"""
第三方AI服务客户端
集成罗慕科技OpenAPI平台的口腔AI分析能力
"""

import httpx
import asyncio
from typing import Dict, Any, Optional, List, Union
from pathlib import Path
import json
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class ThirdPartyAIClient:
    """罗慕科技OpenAPI客户端"""
    
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
    
    async def oral_image_classification(self, image_path: str) -> Dict[str, Any]:
        """
        口腔图像分类与姿态识别
        智能识别口腔图像的类型和姿态，自动纠正图像角度并精确裁剪关键区域
        """
        return await self._analyze_image("oral/classification", image_path, {
            "auto_correct": True,
            "crop_roi": True
        })
    
    async def cephalometric_17_points(self, image_path: str) -> Dict[str, Any]:
        """
        头颅侧位片17关键点识别
        精准识别头颅侧位片影像中的基础解剖关键点
        """
        return await self._analyze_image("cephalometric/points/17", image_path, {
            "include_measurements": True
        })
    
    async def cephalometric_57_points_pro(self, image_path: str) -> Dict[str, Any]:
        """
        头颅侧位片57关键点识别PRO
        全面识别头颅侧位片影像中的完整解剖关键点集合
        """
        return await self._analyze_image("cephalometric/points/57", image_path, {
            "include_measurements": True,
            "advanced_analysis": True
        })
    
    async def panoramic_segmentation(self, image_path: str) -> Dict[str, Any]:
        """
        曲面断层片轮廓分割
        智能识别并标注曲面断层片中的每颗牙齿
        """
        return await self._analyze_image("panoramic/segmentation", image_path, {
            "teeth_numbering": True,
            "condition_analysis": True
        })
    
    async def panoramic_feature_recognition(self, image_path: str) -> Dict[str, Any]:
        """
        曲面断层片特征识别
        精准识别曲面断层片中的重要解剖标志点
        """
        return await self._analyze_image("panoramic/features", image_path, {
            "landmark_detection": True
        })
    
    async def oral_lesion_detection(self, image_path: str) -> Dict[str, Any]:
        """
        口腔病变检测
        检测口腔图像中的异常区域和潜在病变
        """
        return await self._analyze_image("oral/lesions", image_path, {
            "sensitivity": "high",
            "include_severity": True
        })
    
    # ========== 3D 模型处理能力 ==========
    
    async def stl_teeth_segmentation_pro(self, model_path: str) -> Dict[str, Any]:
        """
        STL牙齿分割PRO
        采用先进的3D深度学习算法，对口腔扫描获得的3D牙齿模型进行精确的自动分割
        """
        return await self._analyze_3d_model("3d/segmentation/pro", model_path, {
            "precision_mode": True,
            "individual_teeth": True
        })
    
    async def oral_scan_posture_correction(self, model_path: str) -> Dict[str, Any]:
        """
        口扫模型姿态纠正
        智能识别口扫模型的姿态偏差并进行自动纠正
        """
        return await self._analyze_3d_model("3d/posture/correction", model_path, {
            "auto_align": True,
            "reference_plane": "Frankfurt"
        })
    
    async def teeth_growth_direction(self, model_path: str) -> Dict[str, Any]:
        """
        牙齿生长方向识别
        精确分析每颗牙齿的生长方向和倾斜角度
        """
        return await self._analyze_3d_model("3d/growth/direction", model_path, {
            "angle_analysis": True,
            "axis_calculation": True
        })
    
    async def teeth_feature_calculation(self, model_path: str) -> Dict[str, Any]:
        """
        牙齿特征计算
        基于分割后的3D牙齿模型，计算各种牙齿形态学特征参数
        """
        return await self._analyze_3d_model("3d/features/calculation", model_path, {
            "morphology_params": True,
            "volume_analysis": True,
            "surface_analysis": True
        })
    
    async def followup_model_comparison(self, model1_path: str, model2_path: str) -> Dict[str, Any]:
        """
        复诊模型对比
        对比不同时期的3D口腔模型，精确分析治疗进展和变化情况
        """
        return await self._compare_3d_models("3d/comparison/followup", model1_path, model2_path, {
            "movement_analysis": True,
            "progress_tracking": True,
            "quantitative_comparison": True
        })
    
    async def model_downsampling(self, model_path: str, target_vertices: int = 10000) -> Dict[str, Any]:
        """
        模型降采样
        优化3D模型的顶点数量，保持形状特征的同时减少文件大小
        """
        return await self._analyze_3d_model("3d/downsampling", model_path, {
            "target_vertices": target_vertices,
            "preserve_features": True
        })
    
    # ========== 3D 仿真技术 ==========
    
    async def virtual_appliance_fitting(self, model_path: str, appliance_type: str) -> Dict[str, Any]:
        """
        硅胶虚拟佩戴
        基于3D口腔模型和修复体设计，实现牙冠、贴面、矫治器等修复体的虚拟试戴效果
        """
        return await self._analyze_3d_model("3d/virtual/fitting", model_path, {
            "appliance_type": appliance_type,
            "fit_analysis": True,
            "visualization": True
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
    
    async def _compare_3d_models(self, endpoint: str, model1_path: str, model2_path: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        通用3D模型对比方法
        """
        try:
            # 确保已认证
            if "Authorization" not in self.client.headers:
                await self.authenticate()
            
            # 准备文件上传
            with open(model1_path, "rb") as f1, open(model2_path, "rb") as f2:
                files = [
                    ("model1", (Path(model1_path).name, f1, "application/octet-stream")),
                    ("model2", (Path(model2_path).name, f2, "application/octet-stream"))
                ]
                data = {"params": json.dumps(params)}
                
                response = await self.client.post(
                    f"/{endpoint}",
                    files=files,
                    data=data
                )
                response.raise_for_status()
                
                result = response.json()
                logger.info(f"3D对比完成: {endpoint}")
                return result
                
        except Exception as e:
            logger.error(f"3D对比失败 {endpoint}: {str(e)}")
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


# 创建全局客户端实例
third_party_ai_client = ThirdPartyAIClient()


# 模拟API响应（开发阶段使用）
class MockThirdPartyAIClient:
    """模拟第三方AI服务客户端"""
    
    def __init__(self):
        logger.info("使用模拟第三方AI服务客户端")
    
    async def authenticate(self) -> str:
        """模拟认证"""
        return "mock_token_12345"
    
    async def oral_image_classification(self, image_path: str) -> Dict[str, Any]:
        """模拟口腔图像分类"""
        return {
            "success": True,
            "data": {
                "image_type": "intraoral",
                "posture": "frontal",
                "confidence": 0.95,
                "corrections_applied": ["rotation", "cropping"],
                "roi_coordinates": [100, 100, 400, 400]
            }
        }
    
    async def cephalometric_17_points(self, image_path: str) -> Dict[str, Any]:
        """模拟头颅侧位片17关键点识别"""
        return {
            "success": True,
            "data": {
                "landmarks": {f"point_{i}": [i*10, i*15] for i in range(1, 18)},
                "measurements": {
                    "SNA": 82.5,
                    "SNB": 78.2,
                    "ANB": 4.3,
                    "SN-MP": 32.1
                },
                "confidence": 0.92
            }
        }
    
    # 其他模拟方法...
    async def close(self):
        """模拟关闭"""
        pass


def get_ai_client() -> Union[ThirdPartyAIClient, MockThirdPartyAIClient]:
    """
    获取AI客户端实例
    根据配置返回真实或模拟客户端
    """
    if settings.MOCK_THIRD_PARTY_API:
        return MockThirdPartyAIClient()
    return third_party_ai_client
