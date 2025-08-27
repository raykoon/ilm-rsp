"""
请求日志中间件
记录所有API请求和响应的详细信息
"""

import time
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logger import api_logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """请求日志记录中间件"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # 记录请求开始
        api_logger.info(
            f"请求开始 {request.method} {request.url.path}",
            method=request.method,
            path=request.url.path,
            query_params=dict(request.query_params),
            client_ip=request.client.host,
            user_agent=request.headers.get("user-agent"),
            event_type="request_start"
        )
        
        # 处理请求
        response = await call_next(request)
        
        # 计算处理时间
        process_time = time.time() - start_time
        
        # 记录请求完成
        log_level = "error" if response.status_code >= 500 else "warning" if response.status_code >= 400 else "info"
        
        getattr(api_logger, log_level)(
            f"请求完成 {request.method} {request.url.path} - {response.status_code}",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            process_time=round(process_time, 4),
            client_ip=request.client.host,
            event_type="request_complete"
        )
        
        # 添加处理时间到响应头
        response.headers["X-Process-Time"] = str(round(process_time, 4))
        
        return response
