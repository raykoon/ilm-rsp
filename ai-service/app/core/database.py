"""
数据库连接和操作模块
使用SQLAlchemy异步引擎和asyncpg驱动
"""

from typing import Optional, AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import StaticPool
from sqlalchemy import text

from app.core.config import settings
from app.core.logger import database_logger

# 创建基础模型类
Base = declarative_base()

# 全局变量
async_engine = None
AsyncSessionLocal = None


async def init_database():
    """初始化数据库连接"""
    global async_engine, AsyncSessionLocal
    
    try:
        # 创建异步引擎
        async_engine = create_async_engine(
            settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
            echo=settings.is_development,
            future=True,
            pool_size=settings.DATABASE_POOL_SIZE,
            max_overflow=settings.DATABASE_MAX_OVERFLOW,
            pool_pre_ping=True,
            pool_recycle=3600,  # 1小时后回收连接
            # 使用静态连接池以避免连接泄露
            poolclass=StaticPool if settings.is_testing else None,
            connect_args={
                "server_settings": {
                    "application_name": "ilm-rsp-ai-service",
                }
            } if not settings.is_testing else {"check_same_thread": False}
        )
        
        # 创建会话工厂
        AsyncSessionLocal = async_sessionmaker(
            async_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=True,
            autocommit=False,
        )
        
        # 测试连接
        async with async_engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            
        database_logger.success(
            "数据库连接初始化成功",
            database_url=settings.DATABASE_URL.split("@")[-1],  # 隐藏密码
            pool_size=settings.DATABASE_POOL_SIZE
        )
        
    except Exception as e:
        database_logger.error(
            "数据库连接初始化失败",
            error=str(e),
            database_url=settings.DATABASE_URL.split("@")[-1]
        )
        raise


async def close_database():
    """关闭数据库连接"""
    global async_engine
    
    if async_engine:
        try:
            await async_engine.dispose()
            database_logger.info("数据库连接已关闭")
        except Exception as e:
            database_logger.error("关闭数据库连接时出错", error=str(e))


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话的依赖项"""
    if not AsyncSessionLocal:
        raise RuntimeError("数据库未初始化，请先调用 init_database()")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            database_logger.error("数据库会话发生错误", error=str(e))
            raise
        finally:
            await session.close()


class DatabaseManager:
    """数据库管理器类"""
    
    def __init__(self):
        self.engine = async_engine
        self.session_factory = AsyncSessionLocal
    
    async def health_check(self) -> dict:
        """数据库健康检查"""
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(text("SELECT 1 as health"))
                await session.commit()
                
            return {
                "status": "healthy",
                "message": "数据库连接正常"
            }
        except Exception as e:
            database_logger.error("数据库健康检查失败", error=str(e))
            return {
                "status": "unhealthy", 
                "message": f"数据库连接异常: {str(e)}"
            }
    
    async def get_connection_info(self) -> dict:
        """获取连接信息"""
        if not self.engine:
            return {"status": "not_initialized"}
            
        pool = self.engine.pool
        return {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "total_connections": pool.size() + pool.overflow()
        }
    
    async def execute_query(self, query: str, params: dict = None) -> list:
        """执行原始SQL查询"""
        async with AsyncSessionLocal() as session:
            try:
                result = await session.execute(text(query), params or {})
                await session.commit()
                
                # 返回结果
                if result.returns_rows:
                    return [dict(row) for row in result.fetchall()]
                else:
                    return [{"rows_affected": result.rowcount}]
                    
            except Exception as e:
                await session.rollback()
                database_logger.error(
                    "执行SQL查询失败",
                    query=query,
                    params=params,
                    error=str(e)
                )
                raise


# 全局数据库管理器实例
db_manager = DatabaseManager()


# 数据库工具函数
async def create_tables():
    """创建所有表（仅用于测试环境）"""
    if not settings.is_testing:
        database_logger.warning("create_tables() 只应在测试环境中使用")
        return
        
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    database_logger.info("数据库表创建完成")


async def drop_tables():
    """删除所有表（仅用于测试环境）"""
    if not settings.is_testing:
        database_logger.warning("drop_tables() 只应在测试环境中使用")
        return
        
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    database_logger.info("数据库表删除完成")


# 数据库装饰器
def with_db_session(func):
    """数据库会话装饰器"""
    async def wrapper(*args, **kwargs):
        async with AsyncSessionLocal() as session:
            try:
                # 将session作为第一个参数传入
                result = await func(session, *args, **kwargs)
                await session.commit()
                return result
            except Exception as e:
                await session.rollback()
                database_logger.error(
                    "数据库操作失败",
                    function=func.__name__,
                    error=str(e)
                )
                raise
            finally:
                await session.close()
    
    return wrapper


# 事务管理上下文管理器
class DatabaseTransaction:
    """数据库事务上下文管理器"""
    
    def __init__(self, session: Optional[AsyncSession] = None):
        self.session = session
        self.should_close = False
    
    async def __aenter__(self) -> AsyncSession:
        if self.session is None:
            self.session = AsyncSessionLocal()
            self.should_close = True
        return self.session
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            await self.session.rollback()
            database_logger.error(
                "事务回滚",
                exception_type=str(exc_type),
                exception_value=str(exc_val)
            )
        else:
            await self.session.commit()
        
        if self.should_close:
            await self.session.close()


# 导出
__all__ = [
    "Base",
    "init_database",
    "close_database", 
    "get_db",
    "db_manager",
    "DatabaseManager",
    "DatabaseTransaction",
    "with_db_session",
    "create_tables",
    "drop_tables"
]
