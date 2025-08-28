"""
AI分析服务简化版主入口
专注于报告解读和第三方AI服务集成
"""

import uvicorn
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import httpx

# 应用配置
from app.core.config import settings
from app.core.logger import setup_logging, api_logger

# API路由
from app.api.v1.analysis import router as analysis_router
from app.api.v1.health import router as health_router

# 中间件
from app.middleware.timing import TimingMiddleware

# 服务管理
from app.services.third_party_ai import third_party_ai_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    api_logger.info("🚀 AI报告解读服务启动中...")
    api_logger.info(f"📋 服务版本: {settings.VERSION}")
    api_logger.info(f"🌍 运行环境: {settings.ENVIRONMENT}")
    api_logger.info(f"🤖 第三方AI服务: {settings.THIRD_PARTY_AI_BASE_URL}")
    
    # 测试第三方AI服务连接
    try:
        if not settings.MOCK_THIRD_PARTY_API and settings.THIRD_PARTY_AI_KEY:
            await third_party_ai_client.authenticate()
            api_logger.info("✅ 第三方AI服务连接成功")
        else:
            api_logger.info("🧪 使用模拟第三方AI服务")
    except Exception as e:
        api_logger.warning(f"⚠️ 第三方AI服务连接失败: {str(e)}")
    
    api_logger.info("✅ AI报告解读服务启动完成")
    
    yield
    
    # 关闭时
    api_logger.info("🛑 AI报告解读服务关闭中...")
    try:
        await third_party_ai_client.close()
        api_logger.info("✅ 第三方AI客户端已关闭")
    except Exception as e:
        api_logger.error(f"❌ 关闭第三方AI客户端失败: {str(e)}")
    
    api_logger.info("✅ AI报告解读服务已关闭")


def create_app() -> FastAPI:
    """创建FastAPI应用"""
    
    # 设置日志
    setup_logging()
    
    # 创建应用实例
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.DESCRIPTION,
        version=settings.VERSION,
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan
    )
    
    # ========== 中间件配置 ==========
    
    # CORS中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    
    # 信任主机中间件
    if settings.ALLOWED_HOSTS != "*":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.allowed_hosts_list
        )
    
    # 时间统计中间件
    app.add_middleware(TimingMiddleware)
    
    # ========== 异常处理器 ==========
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """请求验证错误处理器"""
        api_logger.warning(f"请求验证失败: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": "请求参数验证失败",
                "details": exc.errors()
            }
        )
    
    @app.exception_handler(httpx.TimeoutException)
    async def timeout_exception_handler(request: Request, exc: httpx.TimeoutException):
        """HTTP超时异常处理器"""
        api_logger.error(f"第三方AI服务超时: {str(exc)}")
        return JSONResponse(
            status_code=504,
            content={
                "success": False,
                "error": "第三方AI服务响应超时，请稍后重试"
            }
        )
    
    @app.exception_handler(httpx.HTTPError)
    async def http_exception_handler(request: Request, exc: httpx.HTTPError):
        """HTTP错误异常处理器"""
        api_logger.error(f"第三方AI服务错误: {str(exc)}")
        return JSONResponse(
            status_code=502,
            content={
                "success": False,
                "error": "第三方AI服务不可用"
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """通用异常处理器"""
        api_logger.error(f"未处理异常: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "内部服务器错误"
            }
        )
    
    # ========== 路由配置 ==========
    
    # 根路由
    @app.get("/", summary="服务信息", tags=["系统"])
    async def root():
        """获取服务基本信息"""
        return {
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "description": settings.DESCRIPTION,
            "environment": settings.ENVIRONMENT,
            "status": "running",
            "docs": "/docs" if settings.ENVIRONMENT != "production" else "disabled",
            "features": {
                "third_party_ai": not settings.MOCK_THIRD_PARTY_API,
                "report_interpretation": True,
                "supported_analyses": {
                    "2d": settings.supported_2d_analyses_list,
                    "3d": settings.supported_3d_analyses_list
                }
            }
        }
    
    # API路由
    app.include_router(health_router, prefix="/health", tags=["健康检查"])
    app.include_router(analysis_router, prefix=settings.API_V1_PREFIX, tags=["AI分析"])
    
    # ========== 启动事件 ==========
    
    @app.on_event("startup")
    async def startup_event():
        """应用启动事件"""
        api_logger.info("🎬 应用启动事件触发")
    
    @app.on_event("shutdown")
    async def shutdown_event():
        """应用关闭事件"""
        api_logger.info("🎬 应用关闭事件触发")
    
    return app


# 创建应用实例
app = create_app()


if __name__ == "__main__":
    # 开发服务器配置
    uvicorn.run(
        "main-simplified:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=settings.is_development,
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
                "level": settings.LOG_LEVEL,
                "handlers": ["default"],
            },
        }
    )
