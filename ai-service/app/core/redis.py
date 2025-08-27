"""
Redis连接和缓存管理模块
用于缓存AI分析结果和会话管理
"""

import json
import pickle
from typing import Any, Optional, Union, Dict, List
from redis.asyncio import Redis, ConnectionPool
from redis.asyncio.connection import Connection
from redis.exceptions import RedisError, ConnectionError, TimeoutError

from app.core.config import settings
from app.core.logger import cache_logger

# 全局Redis实例
redis_client: Optional[Redis] = None
redis_pool: Optional[ConnectionPool] = None


async def init_redis():
    """初始化Redis连接"""
    global redis_client, redis_pool
    
    try:
        # 创建连接池
        redis_pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=20,
            retry_on_timeout=True,
            socket_keepalive=True,
            socket_keepalive_options={},
            health_check_interval=30,
        )
        
        # 创建Redis客户端
        redis_client = Redis(
            connection_pool=redis_pool,
            decode_responses=False,  # 处理二进制数据
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        
        # 测试连接
        await redis_client.ping()
        
        cache_logger.success(
            "Redis连接初始化成功",
            redis_url=settings.REDIS_URL.split('@')[-1] if '@' in settings.REDIS_URL else settings.REDIS_URL
        )
        
    except Exception as e:
        cache_logger.error(
            "Redis连接初始化失败",
            error=str(e),
            redis_url=settings.REDIS_URL.split('@')[-1] if '@' in settings.REDIS_URL else settings.REDIS_URL
        )
        raise


async def close_redis():
    """关闭Redis连接"""
    global redis_client, redis_pool
    
    if redis_client:
        try:
            await redis_client.close()
            cache_logger.info("Redis连接已关闭")
        except Exception as e:
            cache_logger.error("关闭Redis连接时出错", error=str(e))
    
    if redis_pool:
        try:
            await redis_pool.disconnect()
        except Exception as e:
            cache_logger.error("关闭Redis连接池时出错", error=str(e))


def get_redis() -> Redis:
    """获取Redis客户端实例"""
    if not redis_client:
        raise RuntimeError("Redis未初始化，请先调用 init_redis()")
    return redis_client


class RedisManager:
    """Redis管理器类"""
    
    def __init__(self):
        self.client = redis_client
        self.default_ttl = settings.REDIS_CACHE_TTL
    
    async def health_check(self) -> dict:
        """Redis健康检查"""
        try:
            await self.client.ping()
            info = await self.client.info()
            
            return {
                "status": "healthy",
                "message": "Redis连接正常",
                "info": {
                    "version": info.get("redis_version"),
                    "used_memory": info.get("used_memory_human"),
                    "connected_clients": info.get("connected_clients"),
                    "uptime": info.get("uptime_in_seconds")
                }
            }
        except Exception as e:
            cache_logger.error("Redis健康检查失败", error=str(e))
            return {
                "status": "unhealthy",
                "message": f"Redis连接异常: {str(e)}"
            }
    
    # 基础缓存操作
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """设置缓存值"""
        try:
            # 序列化值
            if isinstance(value, (dict, list)):
                serialized_value = json.dumps(value, ensure_ascii=False).encode('utf-8')
            elif isinstance(value, str):
                serialized_value = value.encode('utf-8')
            elif isinstance(value, bytes):
                serialized_value = value
            else:
                # 使用pickle序列化复杂对象
                serialized_value = pickle.dumps(value)
            
            # 设置缓存
            result = await self.client.set(
                key, 
                serialized_value, 
                ex=ttl or self.default_ttl
            )
            
            if result:
                cache_logger.debug(f"缓存设置成功", key=key, ttl=ttl or self.default_ttl)
            
            return bool(result)
            
        except Exception as e:
            cache_logger.error("设置缓存失败", key=key, error=str(e))
            return False
    
    async def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        try:
            value = await self.client.get(key)
            if value is None:
                return None
            
            # 尝试JSON反序列化
            try:
                return json.loads(value.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                # 尝试pickle反序列化
                try:
                    return pickle.loads(value)
                except:
                    # 返回原始字节
                    return value.decode('utf-8') if isinstance(value, bytes) else value
                    
        except Exception as e:
            cache_logger.error("获取缓存失败", key=key, error=str(e))
            return None
    
    async def delete(self, key: str) -> bool:
        """删除缓存"""
        try:
            result = await self.client.delete(key)
            if result:
                cache_logger.debug("缓存删除成功", key=key)
            return bool(result)
        except Exception as e:
            cache_logger.error("删除缓存失败", key=key, error=str(e))
            return False
    
    async def exists(self, key: str) -> bool:
        """检查缓存是否存在"""
        try:
            result = await self.client.exists(key)
            return bool(result)
        except Exception as e:
            cache_logger.error("检查缓存存在性失败", key=key, error=str(e))
            return False
    
    async def expire(self, key: str, ttl: int) -> bool:
        """设置缓存过期时间"""
        try:
            result = await self.client.expire(key, ttl)
            return bool(result)
        except Exception as e:
            cache_logger.error("设置缓存过期时间失败", key=key, ttl=ttl, error=str(e))
            return False
    
    async def ttl(self, key: str) -> int:
        """获取缓存剩余过期时间"""
        try:
            return await self.client.ttl(key)
        except Exception as e:
            cache_logger.error("获取缓存TTL失败", key=key, error=str(e))
            return -1
    
    # 批量操作
    async def mget(self, keys: List[str]) -> List[Optional[Any]]:
        """批量获取缓存"""
        try:
            values = await self.client.mget(keys)
            results = []
            
            for value in values:
                if value is None:
                    results.append(None)
                    continue
                
                try:
                    results.append(json.loads(value.decode('utf-8')))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    try:
                        results.append(pickle.loads(value))
                    except:
                        results.append(value.decode('utf-8') if isinstance(value, bytes) else value)
            
            return results
            
        except Exception as e:
            cache_logger.error("批量获取缓存失败", keys=keys, error=str(e))
            return [None] * len(keys)
    
    async def delete_pattern(self, pattern: str) -> int:
        """删除匹配模式的所有键"""
        try:
            keys = await self.client.keys(pattern)
            if keys:
                deleted = await self.client.delete(*keys)
                cache_logger.debug(f"批量删除缓存", pattern=pattern, count=deleted)
                return deleted
            return 0
        except Exception as e:
            cache_logger.error("批量删除缓存失败", pattern=pattern, error=str(e))
            return 0
    
    # Hash操作
    async def hset(self, name: str, mapping: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """设置Hash缓存"""
        try:
            # 序列化Hash值
            serialized_mapping = {}
            for key, value in mapping.items():
                if isinstance(value, (dict, list)):
                    serialized_mapping[key] = json.dumps(value, ensure_ascii=False)
                elif isinstance(value, str):
                    serialized_mapping[key] = value
                else:
                    serialized_mapping[key] = str(value)
            
            result = await self.client.hset(name, mapping=serialized_mapping)
            
            # 设置过期时间
            if ttl:
                await self.client.expire(name, ttl)
            
            return bool(result)
            
        except Exception as e:
            cache_logger.error("设置Hash缓存失败", name=name, error=str(e))
            return False
    
    async def hget(self, name: str, key: str) -> Optional[Any]:
        """获取Hash缓存字段"""
        try:
            value = await self.client.hget(name, key)
            if value is None:
                return None
            
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
                
        except Exception as e:
            cache_logger.error("获取Hash缓存失败", name=name, key=key, error=str(e))
            return None
    
    async def hgetall(self, name: str) -> Dict[str, Any]:
        """获取Hash缓存所有字段"""
        try:
            values = await self.client.hgetall(name)
            result = {}
            
            for key, value in values.items():
                try:
                    result[key.decode('utf-8')] = json.loads(value.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    result[key.decode('utf-8')] = value.decode('utf-8')
            
            return result
            
        except Exception as e:
            cache_logger.error("获取Hash缓存所有字段失败", name=name, error=str(e))
            return {}


class CacheKeys:
    """缓存键名常量"""
    
    # AI分析结果缓存
    ANALYSIS_RESULT = "analysis:result:{analysis_id}"
    ANALYSIS_PROGRESS = "analysis:progress:{analysis_id}"
    ANALYSIS_QUEUE = "analysis:queue:{analysis_type}"
    
    # 模型缓存
    MODEL_INFO = "model:info:{model_name}"
    MODEL_VERSION = "model:version:{model_name}"
    MODEL_METRICS = "model:metrics:{model_name}"
    
    # 图像处理缓存
    IMAGE_METADATA = "image:metadata:{image_id}"
    IMAGE_FEATURES = "image:features:{image_id}"
    IMAGE_QUALITY = "image:quality:{image_id}"
    
    # 报告缓存
    REPORT_TEMPLATE = "report:template:{template_id}"
    REPORT_GENERATED = "report:generated:{report_id}"
    
    # 会话和权限缓存
    USER_SESSION = "session:user:{user_id}"
    AUTH_TOKEN = "auth:token:{token_hash}"
    
    # 系统状态缓存
    SYSTEM_HEALTH = "system:health"
    SYSTEM_METRICS = "system:metrics"
    
    # 临时数据缓存
    TEMP_UPLOAD = "temp:upload:{upload_id}"
    TEMP_PROCESSING = "temp:processing:{task_id}"
    
    @classmethod
    def format_key(cls, key_template: str, **kwargs) -> str:
        """格式化缓存键名"""
        return key_template.format(**kwargs)


# 全局Redis管理器实例
redis_manager = RedisManager()

# 常用缓存操作的简化接口
async def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """设置缓存的简化接口"""
    return await redis_manager.set(key, value, ttl)

async def cache_get(key: str) -> Optional[Any]:
    """获取缓存的简化接口"""
    return await redis_manager.get(key)

async def cache_delete(key: str) -> bool:
    """删除缓存的简化接口"""
    return await redis_manager.delete(key)

# 导出
__all__ = [
    "init_redis",
    "close_redis",
    "get_redis", 
    "redis_manager",
    "RedisManager",
    "CacheKeys",
    "cache_set",
    "cache_get", 
    "cache_delete"
]
