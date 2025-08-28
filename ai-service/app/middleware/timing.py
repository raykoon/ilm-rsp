"""
时间统计中间件
统计API响应时间和性能指标
"""

import time
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logger import api_logger


class TimingMiddleware(BaseHTTPMiddleware):
    """时间统计中间件"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 记录开始时间
        start_time = time.time()
        
        # 处理请求
        response = await call_next(request)
        
        # 计算响应时间
        end_time = time.time()
        response_time = end_time - start_time
        
        # 添加响应时间到响应头
        response.headers["X-Response-Time"] = f"{response_time:.4f}"
        
        # 记录慢请求（超过1秒）
        if response_time > 1.0:
            api_logger.info(
                f"慢请求警告: {request.method} {request.url.path} "
                f"响应时间: {response_time:.4f}s "
                f"状态码: {response.status_code}"
            )
        
        return response
