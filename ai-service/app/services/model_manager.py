"""
AI模型管理器
负责加载、管理和调用各种AI模型
"""

import os
import time
import asyncio
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
from contextlib import asynccontextmanager

import torch
import torch.nn as nn
from torchvision import transforms
import numpy as np
from PIL import Image

from app.core.config import settings
from app.core.logger import model_logger
from app.core.redis import cache_set, cache_get, CacheKeys


class ModelInfo:
    """模型信息类"""
    def __init__(self, name: str, version: str, model_type: str, 
                 model_path: str, config: Dict[str, Any]):
        self.name = name
        self.version = version
        self.model_type = model_type  # intraoral, facial, cephalometric, panoramic, 3d
        self.model_path = model_path
        self.config = config
        self.loaded_at: Optional[datetime] = None
        self.last_used: Optional[datetime] = None
        self.inference_count = 0
        self.memory_usage = 0  # MB
        self.model_instance: Optional[nn.Module] = None
        self.preprocessor: Optional[transforms.Compose] = None
        
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "name": self.name,
            "version": self.version,
            "model_type": self.model_type,
            "model_path": self.model_path,
            "config": self.config,
            "loaded_at": self.loaded_at.isoformat() if self.loaded_at else None,
            "last_used": self.last_used.isoformat() if self.last_used else None,
            "inference_count": self.inference_count,
            "memory_usage": self.memory_usage,
            "is_loaded": self.model_instance is not None
        }


class BaseModel(nn.Module):
    """基础AI模型类"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__()
        self.config = config
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """前向传播（子类需要实现）"""
        raise NotImplementedError
        
    def preprocess(self, image: Image.Image) -> torch.Tensor:
        """图像预处理"""
        # 默认预处理流程
        transform = transforms.Compose([
            transforms.Resize((self.config.get('input_size', 512), 
                             self.config.get('input_size', 512))),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=self.config.get('normalize_mean', [0.485, 0.456, 0.406]),
                std=self.config.get('normalize_std', [0.229, 0.224, 0.225])
            )
        ])
        return transform(image).unsqueeze(0)
    
    def postprocess(self, output: torch.Tensor) -> Dict[str, Any]:
        """后处理（子类需要实现）"""
        raise NotImplementedError


class IntraoralModel(BaseModel):
    """口内照片分析模型"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        # 这里应该定义实际的网络结构
        # 为了演示，使用简单的分类网络
        self.backbone = nn.Sequential(
            nn.Conv2d(3, 64, 3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(64, config.get('num_classes', 10))
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)
    
    def postprocess(self, output: torch.Tensor) -> Dict[str, Any]:
        """后处理口内分析结果"""
        probabilities = torch.softmax(output, dim=1)
        confidence = torch.max(probabilities).item()
        predicted_class = torch.argmax(probabilities).item()
        
        # 映射到具体的口腔问题类别
        class_names = [
            "健康", "蛀牙", "牙龈炎", "牙菌斑", "牙结石",
            "牙齿排列不齐", "缺牙", "补牙", "牙齿变色", "其他问题"
        ]
        
        return {
            "predicted_class": predicted_class,
            "predicted_label": class_names[predicted_class] if predicted_class < len(class_names) else "未知",
            "confidence": confidence,
            "probabilities": probabilities[0].cpu().numpy().tolist(),
            "class_names": class_names,
            "findings": self._extract_findings(probabilities[0]),
            "recommendations": self._generate_recommendations(predicted_class, confidence)
        }
    
    def _extract_findings(self, probabilities: torch.Tensor) -> List[Dict[str, Any]]:
        """提取重要发现"""
        findings = []
        class_names = [
            "健康", "蛀牙", "牙龈炎", "牙菌斑", "牙结石",
            "牙齿排列不齐", "缺牙", "补牙", "牙齿变色", "其他问题"
        ]
        
        # 获取概率较高的类别
        for i, prob in enumerate(probabilities.cpu().numpy()):
            if prob > 0.3 and i > 0:  # 排除"健康"类别，只关注问题
                findings.append({
                    "category": class_names[i],
                    "probability": float(prob),
                    "severity": self._get_severity(i, prob),
                    "description": self._get_description(i)
                })
        
        return sorted(findings, key=lambda x: x["probability"], reverse=True)
    
    def _get_severity(self, class_idx: int, probability: float) -> str:
        """获取问题严重程度"""
        if probability > 0.8:
            return "严重"
        elif probability > 0.6:
            return "中等"
        else:
            return "轻微"
    
    def _get_description(self, class_idx: int) -> str:
        """获取问题描述"""
        descriptions = {
            1: "检测到疑似蛀牙，建议及时治疗",
            2: "牙龈有炎症表现，需要改善口腔卫生",
            3: "存在牙菌斑堆积，建议定期清洁",
            4: "发现牙结石，建议专业洁牙",
            5: "牙齿排列不整齐，可考虑正畸治疗",
            6: "存在缺牙情况，建议修复治疗",
            7: "发现补牙痕迹，需定期检查",
            8: "牙齿颜色异常，可能需要美白或其他治疗",
            9: "发现其他异常情况，建议专业检查"
        }
        return descriptions.get(class_idx, "需要进一步专业检查")
    
    def _generate_recommendations(self, predicted_class: int, confidence: float) -> List[str]:
        """生成治疗建议"""
        recommendations = []
        
        if predicted_class == 0:  # 健康
            recommendations = [
                "继续保持良好的口腔卫生习惯",
                "建议每半年进行一次口腔检查",
                "使用含氟牙膏，正确刷牙"
            ]
        else:
            recommendations = [
                "建议尽快到口腔科就诊",
                "保持良好的口腔卫生",
                "定期进行口腔检查和清洁"
            ]
            
            # 根据具体问题添加针对性建议
            if predicted_class in [1, 6, 7]:  # 蛀牙、缺牙、补牙
                recommendations.append("可能需要进行修复治疗")
            elif predicted_class in [2, 3, 4]:  # 牙龈炎、牙菌斑、牙结石
                recommendations.append("建议专业洁牙和牙周治疗")
            elif predicted_class == 5:  # 排列不齐
                recommendations.append("可考虑正畸治疗改善牙齿排列")
        
        return recommendations


class FacialModel(BaseModel):
    """面相照片分析模型"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        # 面部分析网络结构
        self.backbone = nn.Sequential(
            nn.Conv2d(3, 64, 3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(64, config.get('num_features', 20))
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)
    
    def postprocess(self, output: torch.Tensor) -> Dict[str, Any]:
        """后处理面相分析结果"""
        # 面部特征分析
        features = output[0].cpu().numpy()
        
        return {
            "facial_symmetry": float(features[0]),
            "jaw_alignment": float(features[1]),
            "lip_position": float(features[2]),
            "nose_position": float(features[3]),
            "facial_proportions": {
                "upper_face_ratio": float(features[4]),
                "middle_face_ratio": float(features[5]),
                "lower_face_ratio": float(features[6])
            },
            "abnormalities": self._detect_abnormalities(features),
            "growth_assessment": self._assess_growth_pattern(features)
        }
    
    def _detect_abnormalities(self, features: np.ndarray) -> List[Dict[str, Any]]:
        """检测面部异常"""
        abnormalities = []
        
        # 这里实现具体的异常检测逻辑
        if features[0] < 0.8:  # 面部不对称
            abnormalities.append({
                "type": "facial_asymmetry",
                "description": "面部不对称",
                "severity": "moderate",
                "recommendation": "建议进行颌面部检查"
            })
        
        return abnormalities
    
    def _assess_growth_pattern(self, features: np.ndarray) -> Dict[str, Any]:
        """评估生长发育模式"""
        return {
            "growth_direction": "normal",
            "development_stage": "appropriate",
            "growth_potential": "good",
            "intervention_timing": "monitor"
        }


class ModelManager:
    """AI模型管理器"""
    
    def __init__(self):
        self.loaded_models: Dict[str, ModelInfo] = {}
        self.device = torch.device(settings.DEVICE)
        self.model_cache_size = settings.MODEL_CACHE_SIZE
        self._loading_locks: Dict[str, asyncio.Lock] = {}
        
        model_logger.info(f"初始化模型管理器", device=str(self.device))
    
    async def initialize_models(self):
        """初始化所有模型"""
        model_logger.info("开始初始化AI模型...")
        
        # 模型配置
        model_configs = {
            "intraoral": {
                "version": settings.INTRAORAL_MODEL_VERSION,
                "model_type": "intraoral",
                "class": IntraoralModel,
                "config": {
                    "input_size": 512,
                    "num_classes": 10,
                    "normalize_mean": [0.485, 0.456, 0.406],
                    "normalize_std": [0.229, 0.224, 0.225]
                }
            },
            "facial": {
                "version": settings.FACIAL_MODEL_VERSION,
                "model_type": "facial", 
                "class": FacialModel,
                "config": {
                    "input_size": 512,
                    "num_features": 20,
                    "normalize_mean": [0.485, 0.456, 0.406],
                    "normalize_std": [0.229, 0.224, 0.225]
                }
            }
        }
        
        # 加载核心模型
        for model_name, config in model_configs.items():
            try:
                await self._load_model(model_name, config)
                model_logger.success(f"模型加载成功", model_name=model_name)
            except Exception as e:
                model_logger.error(f"模型加载失败", model_name=model_name, error=str(e))
                # 继续加载其他模型
        
        model_logger.success(f"模型初始化完成，共加载 {len(self.loaded_models)} 个模型")
    
    async def _load_model(self, model_name: str, config: Dict[str, Any]):
        """加载单个模型"""
        # 获取或创建加载锁
        if model_name not in self._loading_locks:
            self._loading_locks[model_name] = asyncio.Lock()
        
        async with self._loading_locks[model_name]:
            # 检查是否已经加载
            if model_name in self.loaded_models and self.loaded_models[model_name].model_instance is not None:
                return self.loaded_models[model_name]
            
            start_time = time.time()
            
            # 构建模型路径
            model_path = os.path.join(settings.MODELS_DIR, f"{model_name}_{config['version']}.pth")
            
            # 创建模型信息对象
            model_info = ModelInfo(
                name=model_name,
                version=config["version"],
                model_type=config["model_type"],
                model_path=model_path,
                config=config["config"]
            )
            
            # 实例化模型
            model_class = config["class"]
            model_instance = model_class(config["config"])
            
            # 加载权重（如果存在）
            if os.path.exists(model_path):
                try:
                    checkpoint = torch.load(model_path, map_location=self.device)
                    model_instance.load_state_dict(checkpoint.get('model_state_dict', checkpoint))
                    model_logger.info(f"加载模型权重", model_name=model_name, path=model_path)
                except Exception as e:
                    model_logger.warning(f"无法加载模型权重，使用随机权重", 
                                       model_name=model_name, error=str(e))
            else:
                model_logger.warning(f"模型文件不存在，使用随机权重", 
                                   model_name=model_name, path=model_path)
            
            # 移动到指定设备
            model_instance.to(self.device)
            model_instance.eval()
            
            # 计算内存使用
            memory_usage = self._calculate_model_memory(model_instance)
            
            # 更新模型信息
            model_info.model_instance = model_instance
            model_info.loaded_at = datetime.now()
            model_info.memory_usage = memory_usage
            
            # 创建预处理器
            model_info.preprocessor = self._create_preprocessor(config["config"])
            
            # 存储到已加载模型中
            self.loaded_models[model_name] = model_info
            
            load_time = time.time() - start_time
            model_logger.model_load(model_name, config["version"], load_time)
            
            # 缓存模型信息
            await cache_set(
                CacheKeys.format_key(CacheKeys.MODEL_INFO, model_name=model_name),
                model_info.to_dict(),
                ttl=3600
            )
            
            return model_info
    
    def _create_preprocessor(self, config: Dict[str, Any]) -> transforms.Compose:
        """创建图像预处理器"""
        return transforms.Compose([
            transforms.Resize((config.get('input_size', 512), config.get('input_size', 512))),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=config.get('normalize_mean', [0.485, 0.456, 0.406]),
                std=config.get('normalize_std', [0.229, 0.224, 0.225])
            )
        ])
    
    def _calculate_model_memory(self, model: nn.Module) -> float:
        """计算模型内存使用量（MB）"""
        param_size = 0
        buffer_size = 0
        
        for param in model.parameters():
            param_size += param.nelement() * param.element_size()
        
        for buffer in model.buffers():
            buffer_size += buffer.nelement() * buffer.element_size()
        
        size_mb = (param_size + buffer_size) / 1024 / 1024
        return round(size_mb, 2)
    
    async def inference(self, model_name: str, image: Image.Image) -> Dict[str, Any]:
        """执行模型推理"""
        if model_name not in self.loaded_models:
            raise ValueError(f"模型 {model_name} 未加载")
        
        model_info = self.loaded_models[model_name]
        model_instance = model_info.model_instance
        
        if model_instance is None:
            raise ValueError(f"模型 {model_name} 实例为空")
        
        start_time = time.time()
        
        try:
            # 预处理
            input_tensor = model_info.preprocessor(image).to(self.device)
            
            # 推理
            with torch.no_grad():
                output = model_instance(input_tensor)
            
            # 后处理
            results = model_instance.postprocess(output)
            
            # 更新统计信息
            inference_time = time.time() - start_time
            model_info.last_used = datetime.now()
            model_info.inference_count += 1
            
            # 记录推理日志
            model_logger.model_inference(
                model_name=model_name,
                batch_size=1,
                inference_time=inference_time,
                memory_usage=model_info.memory_usage
            )
            
            # 添加元数据
            results.update({
                "model_name": model_name,
                "model_version": model_info.version,
                "inference_time": inference_time,
                "timestamp": datetime.now().isoformat(),
                "device": str(self.device)
            })
            
            return results
            
        except Exception as e:
            model_logger.error(f"模型推理失败", model_name=model_name, error=str(e))
            raise
    
    def get_loaded_models(self) -> Dict[str, Dict[str, Any]]:
        """获取已加载的模型信息"""
        return {name: info.to_dict() for name, info in self.loaded_models.items()}
    
    def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """获取指定模型信息"""
        if model_name in self.loaded_models:
            return self.loaded_models[model_name].to_dict()
        return None
    
    async def unload_model(self, model_name: str) -> bool:
        """卸载模型"""
        if model_name not in self.loaded_models:
            return False
        
        try:
            model_info = self.loaded_models[model_name]
            
            # 清理GPU内存
            if model_info.model_instance is not None:
                del model_info.model_instance
                if self.device.type == 'cuda':
                    torch.cuda.empty_cache()
            
            # 移除模型信息
            del self.loaded_models[model_name]
            
            model_logger.info(f"模型卸载成功", model_name=model_name)
            return True
            
        except Exception as e:
            model_logger.error(f"模型卸载失败", model_name=model_name, error=str(e))
            return False
    
    async def reload_model(self, model_name: str) -> bool:
        """重新加载模型"""
        # 先卸载
        await self.unload_model(model_name)
        
        # 重新加载（需要模型配置）
        # 这里简化处理，实际应该保存模型配置
        model_logger.info(f"模型重新加载", model_name=model_name)
        return True
    
    async def health_check(self) -> Dict[str, Any]:
        """模型服务健康检查"""
        try:
            loaded_count = len(self.loaded_models)
            total_memory = sum(info.memory_usage for info in self.loaded_models.values())
            
            # 检查关键模型是否加载
            critical_models = ["intraoral", "facial"]
            missing_models = [model for model in critical_models 
                            if model not in self.loaded_models]
            
            status = "healthy" if not missing_models else "degraded"
            
            return {
                "status": status,
                "loaded_models": loaded_count,
                "total_memory_mb": round(total_memory, 2),
                "missing_models": missing_models,
                "device": str(self.device),
                "models": list(self.loaded_models.keys())
            }
            
        except Exception as e:
            model_logger.error("模型健康检查失败", error=str(e))
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    def cleanup_unused_models(self, max_idle_time: int = 3600):
        """清理长时间未使用的模型"""
        current_time = datetime.now()
        models_to_unload = []
        
        for model_name, model_info in self.loaded_models.items():
            if model_info.last_used is None:
                continue
                
            idle_time = (current_time - model_info.last_used).total_seconds()
            if idle_time > max_idle_time:
                models_to_unload.append(model_name)
        
        # 异步卸载模型
        for model_name in models_to_unload:
            asyncio.create_task(self.unload_model(model_name))
        
        if models_to_unload:
            model_logger.info(f"清理长时间未使用的模型", models=models_to_unload)


# 全局模型管理器实例
model_manager = ModelManager()

# 导出
__all__ = ["ModelManager", "model_manager", "BaseModel", "IntraoralModel", "FacialModel"]
