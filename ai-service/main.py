"""
儿童口腔快速筛查报告平台 - AI分析服务
基于FastAPI的人工智能分析服务
"""

import asyncio
import uvicorn
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi

from app.core.config import settings
from app.core.logger import logger
from app.core.database import init_database, close_database
from app.core.redis import init_redis, close_redis
from app.middleware.logging import LoggingMiddleware
from app.middleware.timing import TimingMiddleware
from app.middleware.error_handler import ErrorHandlerMiddleware

# 导入路由
from app.api.v1.analysis import router as analysis_router
from app.api.v1.models import router as models_router
from app.api.v1.reports import router as reports_router
from app.api.v1.health import router as health_router


# 应用生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动和关闭时的处理逻辑"""
    # 启动时的初始化
    logger.info("🚀 启动AI分析服务...")
    
    try:
        # 初始化数据库连接
        await init_database()
        logger.info("✅ 数据库连接初始化完成")
        
        # 初始化Redis连接
        await init_redis()
        logger.info("✅ Redis连接初始化完成")
        
        # 初始化AI模型
        from app.services.model_manager import ModelManager
        model_manager = ModelManager()
        await model_manager.initialize_models()
        logger.info("✅ AI模型初始化完成")
        
        logger.info("🎉 AI分析服务启动完成")
        
    except Exception as e:
        logger.error(f"❌ 服务启动失败: {e}")
        raise
    
    yield
    
    # 关闭时的清理
    logger.info("🛑 正在关闭AI分析服务...")
    
    try:
        await close_database()
        await close_redis()
        logger.info("✅ 服务关闭完成")
    except Exception as e:
        logger.error(f"❌ 服务关闭时出错: {e}")


# 创建FastAPI应用实例
app = FastAPI(
    title="儿童口腔AI分析服务",
    description="""
    ## 儿童口腔快速筛查报告平台 - AI分析服务
    
    这是一个基于深度学习的儿童口腔医疗影像分析服务，提供以下功能：
    
    ### 主要功能
    - 📸 **口内照片分析** - 分析口内照片，识别牙齿问题和口腔健康状况
    - 👶 **面相照片分析** - 分析面部照片，检测颌面部发育异常
    - 🦴 **头侧X光分析** - 分析头颅侧位X光片，评估颅颌面结构
    - 🔍 **全景X光分析** - 分析口腔全景片，全面评估牙齿和颌骨状况
    - 🏗️ **3D模型分析** - 分析三维模型，精确测量和评估
    
    ### 技术特点
    - ⚡ **高性能异步处理** - 基于FastAPI和asyncio
    - 🧠 **先进AI算法** - 使用最新的深度学习模型
    - 📊 **专业医疗报告** - 生成符合医疗标准的分析报告
    - 🔒 **数据安全** - 符合医疗数据安全标准
    - 📈 **实时监控** - 提供详细的性能监控和日志
    """,
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan
)


def custom_openapi():
    """自定义OpenAPI文档"""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # 添加安全定义
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# 中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(TimingMiddleware)
app.add_middleware(LoggingMiddleware)

# 全局异常处理
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP异常处理器"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": str(asyncio.get_event_loop().time())
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """通用异常处理器"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "内部服务器错误",
            "status_code": 500,
            "timestamp": str(asyncio.get_event_loop().time())
        }
    )


# 路由注册
app.include_router(health_router, prefix="/health", tags=["健康检查"])
app.include_router(analysis_router, prefix="/api/v1/analysis", tags=["AI分析"])
app.include_router(models_router, prefix="/api/v1/models", tags=["模型管理"])
app.include_router(reports_router, prefix="/api/v1/reports", tags=["报告生成"])


@app.get("/", summary="服务根路径", tags=["基础信息"])
async def root():
    """服务根路径，返回基本信息"""
    return {
        "service": "儿童口腔AI分析服务",
        "version": "1.0.0",
        "status": "running",
        "docs": f"{settings.SERVER_HOST}:{settings.SERVER_PORT}/docs",
        "health": f"{settings.SERVER_HOST}:{settings.SERVER_PORT}/health"
    }


@app.get("/info", summary="服务详细信息", tags=["基础信息"])
async def service_info():
    """获取服务的详细信息"""
    return {
        "service": "儿童口腔AI分析服务",
        "version": "1.0.0",
        "description": "基于深度学习的儿童口腔医疗影像分析服务",
        "features": [
            "口内照片分析",
            "面相照片分析", 
            "头侧X光分析",
            "全景X光分析",
            "3D模型分析"
        ],
        "environment": settings.ENVIRONMENT,
        "python_version": "3.9+",
        "framework": "FastAPI",
        "ai_framework": "PyTorch",
        "database": "PostgreSQL",
        "cache": "Redis"
    }


if __name__ == "__main__":
    # 开发环境直接运行
    logger.info(f"🚀 启动开发服务器: {settings.SERVER_HOST}:{settings.SERVER_PORT}")
    
    uvicorn.run(
        "main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=settings.ENVIRONMENT == "development",
        workers=1 if settings.ENVIRONMENT == "development" else settings.WORKERS,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": "INFO",
                "handlers": ["default"],
            },
        }
    )
