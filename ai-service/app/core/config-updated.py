"""
应用配置管理 - 更新版（专注报告解读）
使用Pydantic Settings进行配置管理和验证
"""

import os
from typing import Optional, List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from pathlib import Path

# 获取项目根目录
BASE_DIR = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    """应用设置 - 专注报告解读和第三方AI服务调用"""
    
    # 基础配置
    PROJECT_NAME: str = Field(default="儿童口腔AI报告解读服务", env="PROJECT_NAME")
    VERSION: str = Field(default="2.0.0", env="VERSION")
    DESCRIPTION: str = Field(default="专注于口腔医疗报告解读和第三方AI服务集成", env="DESCRIPTION")
    
    # 服务器配置
    SERVER_HOST: str = Field(default="0.0.0.0", env="SERVER_HOST")
    SERVER_PORT: int = Field(default=8000, env="SERVER_PORT")
    WORKERS: int = Field(default=1, env="WORKERS")
    
    # 环境配置
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    TESTING: bool = Field(default=False, env="TESTING")
    
    @field_validator("ENVIRONMENT")
    @classmethod
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
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:3001",
        env="CORS_ORIGINS"
    )
    
    # 文件上传配置
    UPLOAD_DIR: str = Field(default=str(BASE_DIR / "uploads"), env="UPLOAD_DIR")
    MAX_FILE_SIZE: int = Field(default=50 * 1024 * 1024, env="MAX_FILE_SIZE")  # 50MB
    ALLOWED_IMAGE_EXTENSIONS: str = Field(
        default=".jpg,.jpeg,.png,.tiff,.dcm",
        env="ALLOWED_IMAGE_EXTENSIONS"
    )
    
    # ========== 第三方AI服务配置 (罗慕科技) ==========
    THIRD_PARTY_AI_BASE_URL: str = Field(
        default="https://openapi-lab.ilmsmile.com.cn/api/v1",
        env="THIRD_PARTY_AI_BASE_URL"
    )
    THIRD_PARTY_AI_KEY: str = Field(default="", env="THIRD_PARTY_AI_KEY")
    THIRD_PARTY_AI_SECRET: str = Field(default="", env="THIRD_PARTY_AI_SECRET")
    THIRD_PARTY_AI_TIMEOUT: int = Field(default=300, env="THIRD_PARTY_AI_TIMEOUT")  # 5分钟
    
    # 支持的分析类型（对应第三方API）
    SUPPORTED_2D_ANALYSES: str = Field(
        default="oral_classification,cephalometric_17points,cephalometric_57points,panoramic_segmentation,lesion_detection",
        env="SUPPORTED_2D_ANALYSES"
    )
    SUPPORTED_3D_ANALYSES: str = Field(
        default="stl_segmentation,posture_correction,growth_direction,feature_calculation,model_comparison",
        env="SUPPORTED_3D_ANALYSES"
    )
    
    # ========== 报告生成配置 ==========
    REPORT_TEMPLATES_DIR: str = Field(default=str(BASE_DIR / "templates"), env="REPORT_TEMPLATES_DIR")
    REPORT_OUTPUT_DIR: str = Field(default=str(BASE_DIR / "reports"), env="REPORT_OUTPUT_DIR")
    
    # 报告模板配置
    PROFESSIONAL_TEMPLATE: str = Field(default="professional_report.html", env="PROFESSIONAL_TEMPLATE")
    PATIENT_FRIENDLY_TEMPLATE: str = Field(default="patient_report.html", env="PATIENT_FRIENDLY_TEMPLATE")
    
    # 报告格式支持
    GENERATE_PDF: bool = Field(default=True, env="GENERATE_PDF")
    GENERATE_HTML: bool = Field(default=True, env="GENERATE_HTML")
    GENERATE_DOCX: bool = Field(default=False, env="GENERATE_DOCX")
    
    # ========== AI报告解读配置 ==========
    # 置信度阈值
    MIN_CONFIDENCE_THRESHOLD: float = Field(default=0.7, env="MIN_CONFIDENCE_THRESHOLD")
    
    # 报告解读规则
    RISK_LEVELS: str = Field(default="low,medium,high,critical", env="RISK_LEVELS")
    
    # 建议生成配置
    ENABLE_TREATMENT_SUGGESTIONS: bool = Field(default=True, env="ENABLE_TREATMENT_SUGGESTIONS")
    ENABLE_FOLLOWUP_RECOMMENDATIONS: bool = Field(default=True, env="ENABLE_FOLLOWUP_RECOMMENDATIONS")
    
    # ========== 缓存和性能配置 ==========
    ANALYSIS_CACHE_TTL: int = Field(default=7200, env="ANALYSIS_CACHE_TTL")  # 2小时
    REPORT_CACHE_TTL: int = Field(default=86400, env="REPORT_CACHE_TTL")  # 24小时
    MAX_CONCURRENT_ANALYSES: int = Field(default=10, env="MAX_CONCURRENT_ANALYSES")
    
    # 日志配置
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FILE: Optional[str] = Field(default=None, env="LOG_FILE")
    LOG_ROTATION: str = Field(default="1 day", env="LOG_ROTATION")
    LOG_RETENTION: str = Field(default="30 days", env="LOG_RETENTION")
    
    @field_validator("LOG_LEVEL")
    @classmethod
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
    
    # 安全配置
    ALLOWED_HOSTS: str = Field(default="*", env="ALLOWED_HOSTS")
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_PERIOD: int = Field(default=60, env="RATE_LIMIT_PERIOD")  # seconds
    
    # 开发配置
    MOCK_AI_RESULTS: bool = Field(default=False, env="MOCK_AI_RESULTS")
    MOCK_THIRD_PARTY_API: bool = Field(default=False, env="MOCK_THIRD_PARTY_API")
    
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
    def third_party_ai_config(self) -> dict:
        """第三方AI服务配置"""
        return {
            "base_url": self.THIRD_PARTY_AI_BASE_URL,
            "api_key": self.THIRD_PARTY_AI_KEY,
            "api_secret": self.THIRD_PARTY_AI_SECRET,
            "timeout": self.THIRD_PARTY_AI_TIMEOUT
        }
    
    @property
    def cors_origins_list(self) -> List[str]:
        """CORS源列表"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        """允许的文件扩展名列表"""
        return [ext.strip() for ext in self.ALLOWED_IMAGE_EXTENSIONS.split(",")]
    
    @property
    def allowed_hosts_list(self) -> List[str]:
        """允许的主机列表"""
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",")]
    
    @property
    def supported_2d_analyses_list(self) -> List[str]:
        """支持的2D分析类型列表"""
        return [analysis.strip() for analysis in self.SUPPORTED_2D_ANALYSES.split(",")]
    
    @property
    def supported_3d_analyses_list(self) -> List[str]:
        """支持的3D分析类型列表"""
        return [analysis.strip() for analysis in self.SUPPORTED_3D_ANALYSES.split(",")]
    
    @property
    def risk_levels_list(self) -> List[str]:
        """风险等级列表"""
        return [level.strip() for level in self.RISK_LEVELS.split(",")]


# 创建全局设置实例
settings = Settings()

# 导出常用配置
__all__ = ["settings", "Settings", "BASE_DIR"]
