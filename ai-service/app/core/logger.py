"""
日志配置模块
使用loguru进行高性能异步日志记录
"""

import sys
import json
from pathlib import Path
from typing import Any, Dict, Optional
from loguru import logger
from app.core.config import settings


class JSONFormatter:
    """JSON格式化器"""
    
    def format(self, record: Dict[str, Any]) -> str:
        """格式化日志记录为JSON"""
        log_entry = {
            "timestamp": record["time"].strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
            "level": record["level"].name,
            "message": record["message"],
            "module": record["name"],
            "function": record["function"],
            "line": record["line"],
        }
        
        # 添加额外的上下文信息
        if record.get("extra"):
            log_entry.update(record["extra"])
            
        return json.dumps(log_entry, ensure_ascii=False)


def setup_logger():
    """设置日志配置"""
    # 移除默认处理器
    logger.remove()
    
    # 开发环境的控制台日志格式
    dev_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )
    
    # 生产环境的JSON格式
    json_formatter = JSONFormatter()
    
    # 控制台处理器
    if settings.is_development:
        logger.add(
            sys.stdout,
            format=dev_format,
            level=settings.LOG_LEVEL,
            colorize=True,
            backtrace=True,
            diagnose=True,
        )
    else:
        logger.add(
            sys.stdout,
            format=json_formatter.format,
            level=settings.LOG_LEVEL,
            serialize=False,
        )
    
    # 文件处理器
    if settings.LOG_FILE:
        log_file_path = Path(settings.LOG_FILE)
        log_file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 主日志文件
        logger.add(
            log_file_path,
            format=json_formatter.format,
            level=settings.LOG_LEVEL,
            rotation=settings.LOG_ROTATION,
            retention=settings.LOG_RETENTION,
            compression="gz",
            serialize=False,
            backtrace=True,
            diagnose=True,
        )
        
        # 错误日志文件
        error_log_path = log_file_path.parent / "error.log"
        logger.add(
            error_log_path,
            format=json_formatter.format,
            level="ERROR",
            rotation="100 MB",
            retention="90 days",
            compression="gz",
            serialize=False,
            backtrace=True,
            diagnose=True,
        )
    
    # 添加应用信息到日志上下文
    logger.configure(
        extra={
            "service": "ai-analysis",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT
        }
    )
    
    return logger


# 自定义日志记录类
class StructuredLogger:
    """结构化日志记录器"""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logger.bind(component=name)
    
    def debug(self, message: str, **kwargs):
        """调试日志"""
        self.logger.bind(**kwargs).debug(message)
    
    def info(self, message: str, **kwargs):
        """信息日志"""
        self.logger.bind(**kwargs).info(message)
    
    def success(self, message: str, **kwargs):
        """成功日志"""
        self.logger.bind(**kwargs).success(message)
    
    def warning(self, message: str, **kwargs):
        """警告日志"""
        self.logger.bind(**kwargs).warning(message)
    
    def error(self, message: str, **kwargs):
        """错误日志"""
        self.logger.bind(**kwargs).error(message)
    
    def critical(self, message: str, **kwargs):
        """严重错误日志"""
        self.logger.bind(**kwargs).critical(message)
    
    def exception(self, message: str, **kwargs):
        """异常日志（包含堆栈信息）"""
        self.logger.bind(**kwargs).exception(message)
    
    # AI分析相关的专用日志方法
    def analysis_start(self, analysis_id: str, analysis_type: str, image_info: Dict[str, Any]):
        """分析开始日志"""
        self.info(
            f"开始{analysis_type}分析",
            analysis_id=analysis_id,
            analysis_type=analysis_type,
            image_info=image_info,
            event_type="analysis_start"
        )
    
    def analysis_complete(self, analysis_id: str, analysis_type: str, 
                         duration: float, confidence: float, results: Dict[str, Any]):
        """分析完成日志"""
        self.success(
            f"{analysis_type}分析完成",
            analysis_id=analysis_id,
            analysis_type=analysis_type,
            duration=duration,
            confidence=confidence,
            results_summary=results,
            event_type="analysis_complete"
        )
    
    def analysis_error(self, analysis_id: str, analysis_type: str, 
                      error: str, duration: Optional[float] = None):
        """分析错误日志"""
        self.error(
            f"{analysis_type}分析失败",
            analysis_id=analysis_id,
            analysis_type=analysis_type,
            error=error,
            duration=duration,
            event_type="analysis_error"
        )
    
    def model_load(self, model_name: str, model_version: str, load_time: float):
        """模型加载日志"""
        self.info(
            f"模型加载完成",
            model_name=model_name,
            model_version=model_version,
            load_time=load_time,
            event_type="model_load"
        )
    
    def model_inference(self, model_name: str, batch_size: int, 
                       inference_time: float, memory_usage: Optional[float] = None):
        """模型推理日志"""
        self.debug(
            f"模型推理完成",
            model_name=model_name,
            batch_size=batch_size,
            inference_time=inference_time,
            memory_usage=memory_usage,
            event_type="model_inference"
        )
    
    def performance_metrics(self, endpoint: str, method: str, 
                          response_time: float, memory_usage: float, 
                          cpu_usage: float, **kwargs):
        """性能指标日志"""
        self.info(
            f"性能指标",
            endpoint=endpoint,
            method=method,
            response_time=response_time,
            memory_usage=memory_usage,
            cpu_usage=cpu_usage,
            event_type="performance_metrics",
            **kwargs
        )
    
    def data_quality(self, image_id: str, quality_score: float, 
                    quality_issues: Optional[Dict[str, Any]] = None):
        """数据质量日志"""
        log_level = "warning" if quality_score < 0.8 else "info"
        getattr(self, log_level)(
            f"图像质量评估",
            image_id=image_id,
            quality_score=quality_score,
            quality_issues=quality_issues,
            event_type="data_quality"
        )
    
    def security_event(self, event_type: str, user_id: Optional[str] = None, 
                      ip_address: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        """安全事件日志"""
        self.warning(
            f"安全事件: {event_type}",
            security_event=event_type,
            user_id=user_id,
            ip_address=ip_address,
            details=details,
            event_type="security"
        )


# 创建不同组件的日志记录器
def get_logger(name: str) -> StructuredLogger:
    """获取指定组件的日志记录器"""
    return StructuredLogger(name)


# 初始化日志系统
logger = setup_logger()

# 常用的日志记录器实例
api_logger = get_logger("api")
analysis_logger = get_logger("analysis")
model_logger = get_logger("model")
database_logger = get_logger("database")
cache_logger = get_logger("cache")

# 导出
__all__ = [
    "logger",
    "StructuredLogger", 
    "get_logger",
    "api_logger",
    "analysis_logger", 
    "model_logger",
    "database_logger",
    "cache_logger"
]
