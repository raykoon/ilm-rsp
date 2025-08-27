"""
错误处理中间件
统一处理应用中的异常和错误
"""

import traceback
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from fastapi import HTTPException

from app.core.logger import api_logger
from app.core.config import settings


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """错误处理中间件"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> JSONResponse:
        try:
            response = await call_next(request)
            return response
            
        except HTTPException as exc:
            # FastAPI HTTP异常
            api_logger.warning(
                f"HTTP异常: {exc.status_code} - {exc.detail}",
                status_code=exc.status_code,
                detail=exc.detail,
                path=request.url.path,
                method=request.method,
                event_type="http_exception"
            )
            
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "success": False,
                    "error": exc.detail,
                    "status_code": exc.status_code,
                    "path": request.url.path
                }
            )
            
        except ValueError as exc:
            # 值错误
            api_logger.error(
                f"值错误: {str(exc)}",
                error=str(exc),
                path=request.url.path,
                method=request.method,
                event_type="value_error"
            )
            
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "请求参数错误",
                    "detail": str(exc) if settings.is_development else None,
                    "status_code": 400
                }
            )
            
        except FileNotFoundError as exc:
            # 文件未找到错误
            api_logger.error(
                f"文件未找到: {str(exc)}",
                error=str(exc),
                path=request.url.path,
                method=request.method,
                event_type="file_not_found"
            )
            
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "请求的资源不存在",
                    "status_code": 404
                }
            )
            
        except MemoryError as exc:
            # 内存错误
            api_logger.critical(
                f"内存不足错误: {str(exc)}",
                error=str(exc),
                path=request.url.path,
                method=request.method,
                event_type="memory_error"
            )
            
            return JSONResponse(
                status_code=507,
                content={
                    "success": False,
                    "error": "服务器内存不足，请稍后再试",
                    "status_code": 507
                }
            )
            
        except Exception as exc:
            # 其他未捕获的异常
            error_traceback = traceback.format_exc()
            
            api_logger.critical(
                f"未捕获的异常: {str(exc)}",
                error=str(exc),
                traceback=error_traceback,
                path=request.url.path,
                method=request.method,
                event_type="unhandled_exception"
            )
            
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": "服务器内部错误",
                    "detail": str(exc) if settings.is_development else None,
                    "traceback": error_traceback if settings.is_development else None,
                    "status_code": 500
                }
            )
