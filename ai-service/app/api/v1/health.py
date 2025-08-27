"""
健康检查和系统状态API
提供服务健康状态、性能指标和诊断信息
"""

import time
import psutil
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import db_manager
from app.core.redis import redis_manager
from app.core.logger import api_logger

router = APIRouter()

# 响应模型
class HealthResponse(BaseModel):
    """健康检查响应模型"""
    status: str
    timestamp: str
    version: str
    environment: str
    uptime: float
    components: Dict[str, Dict[str, Any]]
    
class SystemMetrics(BaseModel):
    """系统指标响应模型"""
    cpu_percent: float
    memory_percent: float
    memory_available: int
    disk_usage: Dict[str, Any]
    network_io: Dict[str, Any]
    process_info: Dict[str, Any]
    
class ServiceInfo(BaseModel):
    """服务信息响应模型"""
    name: str
    version: str
    description: str
    environment: str
    python_version: str
    framework: str
    ai_framework: str
    features: list
    docs_url: Optional[str]
    metrics_url: Optional[str]

# 启动时间记录
START_TIME = time.time()

@router.get("/", response_model=HealthResponse, summary="基础健康检查")
async def health_check():
    """
    基础健康检查，返回服务状态
    
    返回服务是否正常运行的基本信息
    """
    current_time = time.time()
    uptime = current_time - START_TIME
    
    # 检查各组件状态
    components = {}
    overall_status = "healthy"
    
    # 数据库健康检查
    try:
        db_health = await db_manager.health_check()
        components["database"] = db_health
        if db_health["status"] != "healthy":
            overall_status = "degraded"
    except Exception as e:
        api_logger.error("数据库健康检查失败", error=str(e))
        components["database"] = {"status": "unhealthy", "error": str(e)}
        overall_status = "unhealthy"
    
    # Redis健康检查
    try:
        redis_health = await redis_manager.health_check()
        components["redis"] = redis_health
        if redis_health["status"] != "healthy":
            overall_status = "degraded"
    except Exception as e:
        api_logger.error("Redis健康检查失败", error=str(e))
        components["redis"] = {"status": "unhealthy", "error": str(e)}
        overall_status = "unhealthy"
    
    # AI模型健康检查
    try:
        from app.services.model_manager import ModelManager
        model_manager = ModelManager()
        model_health = await model_manager.health_check()
        components["ai_models"] = model_health
        if model_health["status"] != "healthy":
            overall_status = "degraded"
    except Exception as e:
        api_logger.error("AI模型健康检查失败", error=str(e))
        components["ai_models"] = {"status": "unhealthy", "error": str(e)}
        if overall_status == "healthy":
            overall_status = "degraded"
    
    response = HealthResponse(
        status=overall_status,
        timestamp=datetime.now().isoformat(),
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        uptime=uptime,
        components=components
    )
    
    # 根据状态返回适当的HTTP状态码
    status_code = 200 if overall_status == "healthy" else 503
    
    return JSONResponse(
        status_code=status_code,
        content=response.dict()
    )

@router.get("/detailed", summary="详细健康检查")
async def detailed_health_check():
    """
    详细健康检查，包含更多系统信息和指标
    """
    current_time = time.time()
    uptime = current_time - START_TIME
    
    components = {}
    overall_status = "healthy"
    
    # 数据库详细状态
    try:
        db_health = await db_manager.health_check()
        db_connections = await db_manager.get_connection_info()
        components["database"] = {
            **db_health,
            "connections": db_connections
        }
        if db_health["status"] != "healthy":
            overall_status = "degraded"
    except Exception as e:
        components["database"] = {"status": "unhealthy", "error": str(e)}
        overall_status = "unhealthy"
    
    # Redis详细状态
    try:
        redis_health = await redis_manager.health_check()
        components["redis"] = redis_health
        if redis_health["status"] != "healthy":
            overall_status = "degraded"
    except Exception as e:
        components["redis"] = {"status": "unhealthy", "error": str(e)}
        overall_status = "unhealthy"
    
    # 系统资源状态
    try:
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        cpu_percent = psutil.cpu_percent(interval=1)
        
        components["system"] = {
            "status": "healthy",
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_mb": memory.available // (1024 * 1024),
            "disk_usage_percent": disk.percent,
            "disk_free_gb": disk.free // (1024 ** 3),
            "load_average": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
        }
        
        # 检查资源使用是否过高
        if cpu_percent > 90 or memory.percent > 90 or disk.percent > 90:
            components["system"]["status"] = "warning"
            if overall_status == "healthy":
                overall_status = "degraded"
                
    except Exception as e:
        components["system"] = {"status": "unhealthy", "error": str(e)}
        overall_status = "unhealthy"
    
    # AI服务状态
    try:
        from app.services.model_manager import ModelManager
        model_manager = ModelManager()
        
        # 获取已加载的模型信息
        loaded_models = model_manager.get_loaded_models()
        model_stats = {}
        
        for model_name, model_info in loaded_models.items():
            model_stats[model_name] = {
                "version": model_info.get("version", "unknown"),
                "loaded_at": model_info.get("loaded_at"),
                "memory_usage": model_info.get("memory_usage", 0),
                "inference_count": model_info.get("inference_count", 0),
                "last_used": model_info.get("last_used")
            }
        
        components["ai_service"] = {
            "status": "healthy",
            "loaded_models": model_stats,
            "total_models": len(loaded_models),
            "device": settings.DEVICE
        }
        
    except Exception as e:
        api_logger.error("AI服务状态检查失败", error=str(e))
        components["ai_service"] = {"status": "unhealthy", "error": str(e)}
        if overall_status == "healthy":
            overall_status = "degraded"
    
    response = {
        "status": overall_status,
        "timestamp": datetime.now().isoformat(),
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime": uptime,
        "uptime_human": format_uptime(uptime),
        "components": components
    }
    
    status_code = 200 if overall_status == "healthy" else 503
    
    return JSONResponse(
        status_code=status_code,
        content=response
    )

@router.get("/metrics", response_model=SystemMetrics, summary="系统性能指标")
async def get_system_metrics():
    """
    获取系统性能指标
    
    包括CPU、内存、磁盘、网络等系统资源使用情况
    """
    try:
        # CPU使用率
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # 内存信息
        memory = psutil.virtual_memory()
        
        # 磁盘使用情况
        disk = psutil.disk_usage('/')
        
        # 网络IO统计
        net_io = psutil.net_io_counters()
        
        # 当前进程信息
        process = psutil.Process()
        process_memory = process.memory_info()
        
        metrics = SystemMetrics(
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            memory_available=memory.available,
            disk_usage={
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            },
            network_io={
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv
            },
            process_info={
                "pid": process.pid,
                "memory_rss": process_memory.rss,
                "memory_vms": process_memory.vms,
                "cpu_percent": process.cpu_percent(),
                "num_threads": process.num_threads(),
                "create_time": process.create_time()
            }
        )
        
        # 记录性能指标
        api_logger.performance_metrics(
            endpoint="/health/metrics",
            method="GET",
            response_time=0,  # 这里需要在中间件中计算
            memory_usage=memory.percent,
            cpu_usage=cpu_percent,
            disk_usage=disk.percent
        )
        
        return metrics
        
    except Exception as e:
        api_logger.error("获取系统指标失败", error=str(e))
        raise HTTPException(status_code=500, detail=f"获取系统指标失败: {str(e)}")

@router.get("/info", response_model=ServiceInfo, summary="服务信息")
async def get_service_info():
    """
    获取服务的详细信息
    
    包括版本、功能特性、文档地址等信息
    """
    import sys
    
    info = ServiceInfo(
        name=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        environment=settings.ENVIRONMENT,
        python_version=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        framework="FastAPI",
        ai_framework="PyTorch",
        features=[
            "口内照片分析",
            "面相照片分析",
            "头侧X光分析", 
            "全景X光分析",
            "3D模型分析",
            "智能报告生成",
            "实时性能监控",
            "异步处理"
        ],
        docs_url=f"http://{settings.SERVER_HOST}:{settings.SERVER_PORT}/docs" if settings.is_development else None,
        metrics_url=f"http://{settings.SERVER_HOST}:{settings.METRICS_PORT}/metrics" if settings.ENABLE_METRICS else None
    )
    
    return info

@router.get("/ping", summary="简单存活检查")
async def ping():
    """
    简单的存活检查端点
    
    用于负载均衡器和监控系统的快速检查
    """
    return {
        "message": "pong",
        "timestamp": datetime.now().isoformat(),
        "version": settings.VERSION
    }

@router.get("/readiness", summary="就绪状态检查")  
async def readiness_check():
    """
    就绪状态检查
    
    检查服务是否准备好接收请求（所有依赖服务都正常）
    """
    ready = True
    components = {}
    
    # 检查数据库连接
    try:
        db_health = await db_manager.health_check()
        components["database"] = db_health
        if db_health["status"] != "healthy":
            ready = False
    except Exception as e:
        components["database"] = {"status": "unhealthy", "error": str(e)}
        ready = False
    
    # 检查Redis连接
    try:
        redis_health = await redis_manager.health_check()
        components["redis"] = redis_health
        if redis_health["status"] != "healthy":
            ready = False
    except Exception as e:
        components["redis"] = {"status": "unhealthy", "error": str(e)}
        ready = False
    
    # 检查AI模型是否加载
    try:
        from app.services.model_manager import ModelManager
        model_manager = ModelManager()
        loaded_models = model_manager.get_loaded_models()
        
        components["ai_models"] = {
            "status": "healthy" if loaded_models else "unhealthy",
            "loaded_count": len(loaded_models),
            "models": list(loaded_models.keys())
        }
        
        if not loaded_models:
            ready = False
            
    except Exception as e:
        components["ai_models"] = {"status": "unhealthy", "error": str(e)}
        ready = False
    
    response = {
        "ready": ready,
        "status": "ready" if ready else "not_ready",
        "timestamp": datetime.now().isoformat(),
        "components": components
    }
    
    return JSONResponse(
        status_code=200 if ready else 503,
        content=response
    )

@router.get("/liveness", summary="存活状态检查")
async def liveness_check():
    """
    存活状态检查
    
    检查服务进程是否正常运行（不检查依赖服务）
    """
    try:
        # 简单检查服务是否能响应
        current_time = time.time()
        uptime = current_time - START_TIME
        
        # 检查内存使用是否超限
        memory = psutil.virtual_memory()
        if memory.percent > 95:  # 内存使用超过95%认为不健康
            return JSONResponse(
                status_code=503,
                content={
                    "alive": False,
                    "status": "unhealthy",
                    "reason": "内存使用过高",
                    "memory_percent": memory.percent
                }
            )
        
        return {
            "alive": True,
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "uptime": uptime,
            "memory_percent": memory.percent
        }
        
    except Exception as e:
        api_logger.error("存活检查失败", error=str(e))
        return JSONResponse(
            status_code=503,
            content={
                "alive": False,
                "status": "unhealthy",
                "error": str(e)
            }
        )

def format_uptime(uptime_seconds: float) -> str:
    """格式化运行时间"""
    days = int(uptime_seconds // 86400)
    hours = int((uptime_seconds % 86400) // 3600)
    minutes = int((uptime_seconds % 3600) // 60)
    seconds = int(uptime_seconds % 60)
    
    if days > 0:
        return f"{days}天 {hours}小时 {minutes}分钟 {seconds}秒"
    elif hours > 0:
        return f"{hours}小时 {minutes}分钟 {seconds}秒"
    elif minutes > 0:
        return f"{minutes}分钟 {seconds}秒"
    else:
        return f"{seconds}秒"
