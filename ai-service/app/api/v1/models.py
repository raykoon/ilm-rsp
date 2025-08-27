"""
AI模型管理API
提供模型状态查询、加载、卸载等功能
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.model_manager import model_manager
from app.core.logger import api_logger

router = APIRouter()

class ModelStatusResponse(BaseModel):
    """模型状态响应"""
    success: bool
    models: Dict[str, Any]
    total_count: int
    loaded_count: int
    total_memory_mb: float

class ModelInfoResponse(BaseModel):
    """单个模型信息响应"""
    success: bool
    model_info: Optional[Dict[str, Any]]

@router.get("/", response_model=ModelStatusResponse, summary="获取所有模型状态")
async def get_models_status():
    """
    获取所有AI模型的状态信息
    """
    try:
        loaded_models = model_manager.get_loaded_models()
        
        total_memory = sum(
            model_info.get("memory_usage", 0) 
            for model_info in loaded_models.values()
        )
        
        return ModelStatusResponse(
            success=True,
            models=loaded_models,
            total_count=len(loaded_models),
            loaded_count=len([m for m in loaded_models.values() if m.get("is_loaded")]),
            total_memory_mb=round(total_memory, 2)
        )
        
    except Exception as e:
        api_logger.error("获取模型状态失败", error=str(e))
        raise HTTPException(status_code=500, detail=f"获取模型状态失败: {str(e)}")

@router.get("/{model_name}", response_model=ModelInfoResponse, summary="获取指定模型信息")
async def get_model_info(model_name: str):
    """
    获取指定模型的详细信息
    """
    try:
        model_info = model_manager.get_model_info(model_name)
        
        return ModelInfoResponse(
            success=True,
            model_info=model_info
        )
        
    except Exception as e:
        api_logger.error("获取模型信息失败", model_name=model_name, error=str(e))
        raise HTTPException(status_code=500, detail=f"获取模型信息失败: {str(e)}")

@router.post("/{model_name}/reload", summary="重新加载模型")
async def reload_model(model_name: str):
    """
    重新加载指定的AI模型
    """
    try:
        success = await model_manager.reload_model(model_name)
        
        if success:
            return {"success": True, "message": f"模型 {model_name} 重新加载成功"}
        else:
            raise HTTPException(status_code=500, detail=f"模型 {model_name} 重新加载失败")
            
    except Exception as e:
        api_logger.error("重新加载模型失败", model_name=model_name, error=str(e))
        raise HTTPException(status_code=500, detail=f"重新加载模型失败: {str(e)}")

@router.delete("/{model_name}", summary="卸载模型")
async def unload_model(model_name: str):
    """
    卸载指定的AI模型以释放内存
    """
    try:
        success = await model_manager.unload_model(model_name)
        
        if success:
            return {"success": True, "message": f"模型 {model_name} 卸载成功"}
        else:
            raise HTTPException(status_code=404, detail=f"模型 {model_name} 不存在或未加载")
            
    except Exception as e:
        api_logger.error("卸载模型失败", model_name=model_name, error=str(e))
        raise HTTPException(status_code=500, detail=f"卸载模型失败: {str(e)}")

@router.get("/health/check", summary="模型服务健康检查")
async def models_health_check():
    """
    检查AI模型服务的健康状态
    """
    try:
        health_status = await model_manager.health_check()
        
        status_code = 200 if health_status["status"] == "healthy" else 503
        
        return {
            "success": True,
            "health": health_status
        }
        
    except Exception as e:
        api_logger.error("模型健康检查失败", error=str(e))
        raise HTTPException(status_code=500, detail=f"健康检查失败: {str(e)}")
