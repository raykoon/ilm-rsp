"""
第三方AI服务客户端 - 简化版
只保留实际需要的7个API接口
"""

import httpx
import asyncio
from typing import Dict, Any, Optional, List, Union
from pathlib import Path
import json
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class SimplifiedThirdPartyAIClient:
    """罗慕科技OpenAPI客户端 - 简化版"""
    
    def __init__(self):
        self.base_url = settings.THIRD_PARTY_AI_BASE_URL
        self.api_key = settings.THIRD_PARTY_AI_KEY
        self.api_secret = settings.THIRD_PARTY_AI_SECRET
        self.timeout = settings.THIRD_PARTY_AI_TIMEOUT
        
        # 创建HTTP客户端
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(timeout=self.timeout),
            headers={
                "User-Agent": f"ILM-RSP-AI-Service/{settings.VERSION}",
                "Content-Type": "application/json"
            }
        )
    
    async def authenticate(self) -> str:
        """
        获取访问令牌
        """
        try:
            response = await self.client.post("/auth/token", json={
                "api_key": self.api_key,
                "api_secret": self.api_secret
            })
            response.raise_for_status()
            
            result = response.json()
            token = result.get("access_token")
            
            # 更新客户端头部
            self.client.headers.update({
                "Authorization": f"Bearer {token}"
            })
            
            logger.info("第三方AI服务认证成功")
            return token
            
        except Exception as e:
            logger.error(f"第三方AI服务认证失败: {str(e)}")
            raise
    
    # ========== 2D 影像分析能力 ==========
    
    async def oral_classification(self, image_path: str) -> Dict[str, Any]:
        """
        口腔分类和自态摆正
        智能识别口腔图像的类型和姿态，自动纠正图像角度并精确裁剪关键区域
        """
        return await self._analyze_image("oral/classification", image_path, {
            "auto_correct": True,
            "crop_roi": True,
            "classification_types": ["intraoral", "facial", "dental"],
            "posture_correction": True
        })
    
    async def cephalometric_57(self, image_path: str) -> Dict[str, Any]:
        """
        头侧片分析（57关键点）
        全面识别头颅侧位片影像中的完整解剖关键点集合，包括颅骨、面骨、牙齿等
        """
        return await self._analyze_image("cephalometric/points/57", image_path, {
            "include_measurements": True,
            "advanced_analysis": True,
            "measurement_types": ["angular", "linear", "ratio"],
            "clinical_analysis": True
        })
    
    async def panoramic_segmentation(self, image_path: str) -> Dict[str, Any]:
        """
        全景片分析
        智能识别并标注曲面断层片中的每颗牙齿，进行精确的编号标注和状态分析
        """
        return await self._analyze_image("panoramic/segmentation", image_path, {
            "teeth_numbering": True,
            "condition_analysis": True,
            "pathology_detection": True,
            "dental_chart": True
        })
    
    async def lesion_detection(self, image_path: str) -> Dict[str, Any]:
        """
        面向口内分析（病变检测）
        检测口腔内图像中的异常区域和潜在病变，专门针对口腔内部结构
        """
        return await self._analyze_image("oral/lesions/intraoral", image_path, {
            "sensitivity": "high",
            "include_severity": True,
            "lesion_types": ["caries", "gingivitis", "periodontitis", "ulcer", "tumor"],
            "confidence_threshold": 0.7
        })
    
    # ========== 3D 模型处理能力 ==========
    
    async def model_downsampling_display(self, model_path: str, target_vertices: int = 10000) -> Dict[str, Any]:
        """
        模型降采样（显示版）
        优化3D模型的顶点数量，保持形状特征的同时减少文件大小，适用于显示和预览
        """
        return await self._analyze_3d_model("3d/downsampling/display", model_path, {
            "target_vertices": target_vertices,
            "preserve_features": True,
            "optimization_level": "display",
            "texture_preservation": True
        })
    
    async def model_downsampling_segmentation(self, model_path: str) -> Dict[str, Any]:
        """
        降采样分牙
        在降采样的同时进行牙齿分割，优化模型同时识别每颗牙齿
        """
        return await self._analyze_3d_model("3d/downsampling/segmentation", model_path, {
            "individual_teeth": True,
            "segmentation_precision": "high",
            "tooth_numbering": True,
            "optimization_level": "analysis"
        })
    
    async def teeth_features(self, model_path: str) -> Dict[str, Any]:
        """
        牙齿特征值计算
        基于3D牙齿模型，计算各种牙齿形态学特征参数，包括长度、宽度、体积等
        """
        return await self._analyze_3d_model("3d/features/teeth", model_path, {
            "morphology_params": True,
            "volume_analysis": True,
            "surface_analysis": True,
            "dimension_measurements": True,
            "statistical_features": True
        })
    
    # ========== 辅助方法 ==========
    
    async def _analyze_image(self, endpoint: str, image_path: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        通用2D图像分析方法
        """
        try:
            # 确保已认证
            if "Authorization" not in self.client.headers:
                await self.authenticate()
            
            # 准备文件上传
            with open(image_path, "rb") as f:
                files = {"image": (Path(image_path).name, f, "image/jpeg")}
                data = {"params": json.dumps(params)}
                
                response = await self.client.post(
                    f"/{endpoint}",
                    files=files,
                    data=data
                )
                response.raise_for_status()
                
                result = response.json()
                logger.info(f"2D分析完成: {endpoint}")
                return result
                
        except Exception as e:
            logger.error(f"2D分析失败 {endpoint}: {str(e)}")
            raise
    
    async def _analyze_3d_model(self, endpoint: str, model_path: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        通用3D模型分析方法
        """
        try:
            # 确保已认证
            if "Authorization" not in self.client.headers:
                await self.authenticate()
            
            # 准备文件上传
            with open(model_path, "rb") as f:
                files = {"model": (Path(model_path).name, f, "application/octet-stream")}
                data = {"params": json.dumps(params)}
                
                response = await self.client.post(
                    f"/{endpoint}",
                    files=files,
                    data=data
                )
                response.raise_for_status()
                
                result = response.json()
                logger.info(f"3D分析完成: {endpoint}")
                return result
                
        except Exception as e:
            logger.error(f"3D分析失败 {endpoint}: {str(e)}")
            raise
    
    async def get_analysis_status(self, task_id: str) -> Dict[str, Any]:
        """
        获取分析任务状态（用于异步任务）
        """
        try:
            response = await self.client.get(f"/analysis/status/{task_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"获取任务状态失败: {str(e)}")
            raise
    
    async def close(self):
        """关闭HTTP客户端"""
        await self.client.aclose()


# 模拟API响应（开发阶段使用）
class MockSimplifiedThirdPartyAIClient:
    """模拟第三方AI服务客户端 - 简化版"""
    
    def __init__(self):
        logger.info("使用模拟第三方AI服务客户端 - 简化版")
    
    async def authenticate(self) -> str:
        """模拟认证"""
        return "mock_token_simplified"
    
    async def oral_classification(self, image_path: str) -> Dict[str, Any]:
        """模拟口腔分类和自态摆正"""
        return {
            "success": True,
            "data": {
                "image_type": "intraoral",
                "posture": "frontal",
                "confidence": 0.95,
                "corrections_applied": {
                    "rotation": 5.2,
                    "cropping": [100, 100, 400, 400]
                },
                "classification": {
                    "type": "dental_occlusal",
                    "quadrant": "upper_right",
                    "quality_score": 0.92
                }
            }
        }
    
    async def cephalometric_57(self, image_path: str) -> Dict[str, Any]:
        """模拟头侧片57关键点分析"""
        landmarks = {f"point_{i}": [50 + i*5, 30 + i*3] for i in range(1, 58)}
        
        return {
            "success": True,
            "data": {
                "landmarks": landmarks,
                "measurements": {
                    "SNA": 82.5,
                    "SNB": 78.2,
                    "ANB": 4.3,
                    "SN-MP": 32.1,
                    "FMA": 28.5,
                    "IMPA": 95.2,
                    "U1-SN": 105.8,
                    "L1-MP": 92.4
                },
                "clinical_analysis": {
                    "skeletal_pattern": "Class II",
                    "growth_pattern": "Average",
                    "facial_type": "Mesofacial"
                },
                "confidence": 0.94
            }
        }
    
    async def panoramic_segmentation(self, image_path: str) -> Dict[str, Any]:
        """模拟全景片分析"""
        teeth_data = {}
        for i in range(11, 48):  # 标准牙位编号
            if i not in [19, 29, 39, 49]:  # 跳过不存在的牙位
                teeth_data[str(i)] = {
                    "present": True,
                    "condition": "healthy" if i % 5 != 0 else "caries",
                    "confidence": 0.88 + (i % 10) * 0.01
                }
        
        return {
            "success": True,
            "data": {
                "teeth": teeth_data,
                "missing_teeth": ["18", "28", "38", "48"],
                "pathologies": [
                    {
                        "tooth": "15",
                        "type": "caries",
                        "severity": "moderate",
                        "location": "occlusal"
                    }
                ],
                "overall_health_score": 0.85
            }
        }
    
    async def lesion_detection(self, image_path: str) -> Dict[str, Any]:
        """模拟口内病变检测"""
        return {
            "success": True,
            "data": {
                "lesions": [
                    {
                        "type": "caries",
                        "location": "upper_left_molar",
                        "severity": "moderate",
                        "confidence": 0.89,
                        "bbox": [120, 80, 180, 140],
                        "description": "咬合面龋坏"
                    },
                    {
                        "type": "gingivitis",
                        "location": "anterior_gingiva",
                        "severity": "mild",
                        "confidence": 0.76,
                        "bbox": [200, 150, 280, 200],
                        "description": "前牙区牙龈炎症"
                    }
                ],
                "overall_risk": "moderate",
                "recommendations": [
                    "建议进行龋坏充填治疗",
                    "加强口腔卫生维护"
                ]
            }
        }
    
    async def model_downsampling_display(self, model_path: str, target_vertices: int = 10000) -> Dict[str, Any]:
        """模拟模型降采样（显示版）"""
        return {
            "success": True,
            "data": {
                "original_vertices": 125000,
                "downsampled_vertices": target_vertices,
                "reduction_ratio": 0.92,
                "quality_score": 0.95,
                "processing_time": 2.3,
                "file_size_reduction": 0.88,
                "download_url": "/downloads/downsampled_display_model.stl"
            }
        }
    
    async def model_downsampling_segmentation(self, model_path: str) -> Dict[str, Any]:
        """模拟降采样分牙"""
        teeth_segments = {}
        for i in range(11, 48):
            if i not in [19, 29, 39, 49]:
                teeth_segments[str(i)] = {
                    "vertices": 800 + (i % 10) * 50,
                    "volume": 120.5 + (i % 10) * 15.2,
                    "surface_area": 85.3 + (i % 10) * 8.1,
                    "segmentation_confidence": 0.91 + (i % 10) * 0.005
                }
        
        return {
            "success": True,
            "data": {
                "total_teeth": len(teeth_segments),
                "teeth_segments": teeth_segments,
                "overall_quality": 0.93,
                "processing_time": 4.7,
                "download_urls": {
                    "full_model": "/downloads/segmented_full_model.stl",
                    "individual_teeth": "/downloads/teeth_segments.zip"
                }
            }
        }
    
    async def teeth_features(self, model_path: str) -> Dict[str, Any]:
        """模拟牙齿特征值计算"""
        features_data = {}
        for i in range(11, 48):
            if i not in [19, 29, 39, 49]:
                features_data[str(i)] = {
                    "length": 10.2 + (i % 5) * 0.8,
                    "width": 8.5 + (i % 4) * 0.6,
                    "height": 12.1 + (i % 6) * 0.4,
                    "volume": 156.3 + (i % 8) * 12.5,
                    "surface_area": 98.7 + (i % 7) * 8.2,
                    "crown_height": 8.9 + (i % 3) * 0.7,
                    "root_length": 13.4 + (i % 4) * 1.2,
                    "curvature_mean": 0.15 + (i % 10) * 0.01,
                    "curvature_gaussian": 0.08 + (i % 12) * 0.005
                }
        
        return {
            "success": True,
            "data": {
                "individual_features": features_data,
                "statistical_summary": {
                    "total_volume": sum(f["volume"] for f in features_data.values()),
                    "average_crown_height": sum(f["crown_height"] for f in features_data.values()) / len(features_data),
                    "tooth_count": len(features_data)
                },
                "morphological_analysis": {
                    "arch_form": "ovoid",
                    "symmetry_index": 0.87,
                    "size_variation": "normal"
                }
            }
        }
    
    async def close(self):
        """模拟关闭"""
        pass


def get_simplified_ai_client() -> Union[SimplifiedThirdPartyAIClient, MockSimplifiedThirdPartyAIClient]:
    """
    获取AI客户端实例 - 简化版
    根据配置返回真实或模拟客户端
    """
    if settings.MOCK_THIRD_PARTY_API:
        return MockSimplifiedThirdPartyAIClient()
    return SimplifiedThirdPartyAIClient()
