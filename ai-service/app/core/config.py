"""
应用配置管理
使用Pydantic Settings进行配置管理和验证
"""

import os
from typing import List, Optional
from pydantic import BaseSettings, Field, validator
from pathlib import Path

# 获取项目根目录
BASE_DIR = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    """应用设置"""
    
    # 基础配置
    PROJECT_NAME: str = Field(default="儿童口腔AI分析服务", env="PROJECT_NAME")
    VERSION: str = Field(default="1.0.0", env="VERSION")
    DESCRIPTION: str = Field(default="基于深度学习的儿童口腔医疗影像分析服务", env="DESCRIPTION")
    
    # 服务器配置
    SERVER_HOST: str = Field(default="0.0.0.0", env="SERVER_HOST")
    SERVER_PORT: int = Field(default=8000, env="SERVER_PORT")
    WORKERS: int = Field(default=1, env="WORKERS")
    
    # 环境配置
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    TESTING: bool = Field(default=False, env="TESTING")
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        if v not in ["development", "testing", "production"]:
            raise ValueError("ENVIRONMENT must be one of: development, testing, production")
        return v
    
    # 数据库配置
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_POOL_SIZE: int = Field(default=10, env="DATABASE_POOL_SIZE")
    DATABASE_MAX_OVERFLOW: int = Field(default=20, env="DATABASE_MAX_OVERFLOW")
    
    # Redis配置
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_CACHE_TTL: int = Field(default=3600, env="REDIS_CACHE_TTL")  # 1小时
    
    # API配置
    API_V1_PREFIX: str = Field(default="/api/v1", env="API_V1_PREFIX")
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # CORS配置
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        env="CORS_ORIGINS"
    )
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    # 文件上传配置
    UPLOAD_DIR: str = Field(default=str(BASE_DIR / "uploads"), env="UPLOAD_DIR")
    MAX_FILE_SIZE: int = Field(default=50 * 1024 * 1024, env="MAX_FILE_SIZE")  # 50MB
    ALLOWED_IMAGE_EXTENSIONS: List[str] = Field(
        default=[".jpg", ".jpeg", ".png", ".tiff", ".dcm"],
        env="ALLOWED_IMAGE_EXTENSIONS"
    )
    
    @validator("ALLOWED_IMAGE_EXTENSIONS", pre=True)
    def parse_extensions(cls, v):
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",")]
        return v
    
    # AI模型配置
    MODELS_DIR: str = Field(default=str(BASE_DIR / "models"), env="MODELS_DIR")
    DEVICE: str = Field(default="cpu", env="DEVICE")  # cpu, cuda, mps
    MODEL_CACHE_SIZE: int = Field(default=3, env="MODEL_CACHE_SIZE")
    
    # 模型版本配置
    INTRAORAL_MODEL_VERSION: str = Field(default="v1.0", env="INTRAORAL_MODEL_VERSION")
    FACIAL_MODEL_VERSION: str = Field(default="v1.0", env="FACIAL_MODEL_VERSION")
    CEPHALOMETRIC_MODEL_VERSION: str = Field(default="v1.0", env="CEPHALOMETRIC_MODEL_VERSION")
    PANORAMIC_MODEL_VERSION: str = Field(default="v1.0", env="PANORAMIC_MODEL_VERSION")
    THREED_MODEL_VERSION: str = Field(default="v1.0", env="THREED_MODEL_VERSION")
    
    # 分析配置
    BATCH_SIZE: int = Field(default=1, env="BATCH_SIZE")
    MAX_CONCURRENT_ANALYSES: int = Field(default=5, env="MAX_CONCURRENT_ANALYSES")
    ANALYSIS_TIMEOUT: int = Field(default=300, env="ANALYSIS_TIMEOUT")  # 5分钟
    
    # 图像预处理配置
    IMAGE_SIZE: int = Field(default=512, env="IMAGE_SIZE")
    NORMALIZE_MEAN: List[float] = Field(default=[0.485, 0.456, 0.406], env="NORMALIZE_MEAN")
    NORMALIZE_STD: List[float] = Field(default=[0.229, 0.224, 0.225], env="NORMALIZE_STD")
    
    # 质量控制配置
    MIN_CONFIDENCE_THRESHOLD: float = Field(default=0.7, env="MIN_CONFIDENCE_THRESHOLD")
    MAX_ANALYSIS_RETRIES: int = Field(default=3, env="MAX_ANALYSIS_RETRIES")
    
    # 报告生成配置
    REPORT_TEMPLATES_DIR: str = Field(default=str(BASE_DIR / "templates"), env="REPORT_TEMPLATES_DIR")
    REPORT_OUTPUT_DIR: str = Field(default=str(BASE_DIR / "reports"), env="REPORT_OUTPUT_DIR")
    GENERATE_PDF: bool = Field(default=True, env="GENERATE_PDF")
    
    # 日志配置
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FILE: Optional[str] = Field(default=None, env="LOG_FILE")
    LOG_ROTATION: str = Field(default="1 day", env="LOG_ROTATION")
    LOG_RETENTION: str = Field(default="30 days", env="LOG_RETENTION")
    
    @validator("LOG_LEVEL")
    def validate_log_level(cls, v):
        if v not in ["TRACE", "DEBUG", "INFO", "SUCCESS", "WARNING", "ERROR", "CRITICAL"]:
            raise ValueError("Invalid log level")
        return v
    
    # 监控配置
    ENABLE_METRICS: bool = Field(default=True, env="ENABLE_METRICS")
    METRICS_PORT: int = Field(default=8001, env="METRICS_PORT")
    
    # 第三方服务配置
    BACKEND_API_URL: str = Field(default="http://localhost:3001", env="BACKEND_API_URL")
    BACKEND_API_KEY: Optional[str] = Field(default=None, env="BACKEND_API_KEY")
    
    # MinIO配置（文件存储）
    MINIO_ENDPOINT: Optional[str] = Field(default=None, env="MINIO_ENDPOINT")
    MINIO_ACCESS_KEY: Optional[str] = Field(default=None, env="MINIO_ACCESS_KEY")
    MINIO_SECRET_KEY: Optional[str] = Field(default=None, env="MINIO_SECRET_KEY")
    MINIO_BUCKET: str = Field(default="ai-analysis", env="MINIO_BUCKET")
    
    # 性能配置
    MAX_MEMORY_USAGE: int = Field(default=4096, env="MAX_MEMORY_USAGE")  # MB
    ENABLE_GPU_MONITORING: bool = Field(default=False, env="ENABLE_GPU_MONITORING")
    
    # 安全配置
    ALLOWED_HOSTS: List[str] = Field(default=["*"], env="ALLOWED_HOSTS")
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_PERIOD: int = Field(default=60, env="RATE_LIMIT_PERIOD")  # seconds
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_allowed_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    # 开发配置
    RELOAD_MODELS: bool = Field(default=False, env="RELOAD_MODELS")
    MOCK_AI_RESULTS: bool = Field(default=False, env="MOCK_AI_RESULTS")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 确保必要的目录存在
        self._ensure_directories()
    
    def _ensure_directories(self):
        """确保必要的目录存在"""
        directories = [
            self.UPLOAD_DIR,
            self.MODELS_DIR,
            self.REPORT_TEMPLATES_DIR,
            self.REPORT_OUTPUT_DIR
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
    
    @property
    def is_development(self) -> bool:
        """是否为开发环境"""
        return self.ENVIRONMENT == "development"
    
    @property
    def is_production(self) -> bool:
        """是否为生产环境"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_testing(self) -> bool:
        """是否为测试环境"""
        return self.ENVIRONMENT == "testing"
    
    @property
    def database_config(self) -> dict:
        """数据库配置字典"""
        return {
            "url": self.DATABASE_URL,
            "pool_size": self.DATABASE_POOL_SIZE,
            "max_overflow": self.DATABASE_MAX_OVERFLOW
        }
    
    @property
    def redis_config(self) -> dict:
        """Redis配置字典"""
        return {
            "url": self.REDIS_URL,
            "cache_ttl": self.REDIS_CACHE_TTL
        }
    
    @property
    def model_versions(self) -> dict:
        """模型版本配置"""
        return {
            "intraoral": self.INTRAORAL_MODEL_VERSION,
            "facial": self.FACIAL_MODEL_VERSION,
            "cephalometric": self.CEPHALOMETRIC_MODEL_VERSION,
            "panoramic": self.PANORAMIC_MODEL_VERSION,
            "3d": self.THREED_MODEL_VERSION
        }


# 创建全局设置实例
settings = Settings()

# 导出常用配置
__all__ = ["settings", "Settings", "BASE_DIR"]
