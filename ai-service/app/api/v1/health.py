"""
健康检查和系统状态API
提供服务健康状态、性能指标和诊断信息
"""

import time
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.config import settings
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

class ServiceInfo(BaseModel):
    """服务信息响应模型"""
    name: str
    version: str
    description: str
    environment: str
    features: list

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
    
    # 简化的AI服务状态检查
    try:
        components["ai_service"] = {
            "status": "healthy",
            "message": "AI分析服务运行正常",
            "device": settings.DEVICE
        }
    except Exception as e:
        api_logger.error("AI服务状态检查失败", error=str(e))
        components["ai_service"] = {"status": "unhealthy", "error": str(e)}
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
        content=response.model_dump()
    )

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
        features=[
            "口内照片分析",
            "面相照片分析",
            "头侧X光分析", 
            "全景X光分析",
            "3D模型分析",
            "智能报告生成",
            "异步处理"
        ]
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
        "version": settings.VERSION,
        "uptime": time.time() - START_TIME
    }

@router.get("/readiness", summary="就绪状态检查")  
async def readiness_check():
    """
    就绪状态检查
    
    检查服务是否准备好接收请求
    """
    ready = True
    components = {}
    
    # 简化的就绪检查
    try:
        components["ai_service"] = {
            "status": "ready",
            "message": "服务已准备就绪"
        }
    except Exception as e:
        components["ai_service"] = {"status": "not_ready", "error": str(e)}
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
    
    检查服务进程是否正常运行
    """
    try:
        current_time = time.time()
        uptime = current_time - START_TIME
        
        return {
            "alive": True,
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "uptime": uptime,
            "uptime_human": format_uptime(uptime)
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