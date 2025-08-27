"""
时间统计中间件
统计API响应时间和性能指标
"""

import time
import psutil
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logger import api_logger


class TimingMiddleware(BaseHTTPMiddleware):
    """时间统计中间件"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 记录开始时间和资源使用
        start_time = time.time()
        start_cpu = psutil.cpu_percent()
        process = psutil.Process()
        start_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # 处理请求
        response = await call_next(request)
        
        # 计算各项指标
        end_time = time.time()
        response_time = end_time - start_time
        end_cpu = psutil.cpu_percent()
        end_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # 添加性能指标到响应头
        response.headers.update({
            "X-Response-Time": f"{response_time:.4f}",
            "X-CPU-Usage": f"{end_cpu:.2f}%", 
            "X-Memory-Usage": f"{end_memory:.2f}MB",
            "X-Memory-Delta": f"{end_memory - start_memory:+.2f}MB"
        })
        
        # 记录性能指标（对于慢请求）
        if response_time > 1.0:  # 超过1秒的请求
            api_logger.performance_metrics(
                endpoint=request.url.path,
                method=request.method,
                response_time=response_time,
                cpu_usage=end_cpu,
                memory_usage=end_memory,
                memory_delta=end_memory - start_memory,
                status_code=response.status_code
            )
        
        return response
