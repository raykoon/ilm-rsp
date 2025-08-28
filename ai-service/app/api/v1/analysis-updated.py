"""
AI分析API - 更新版
集成第三方AI服务和报告解读功能
"""

import os
import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from app.core.config import settings
from app.core.logger import api_logger
from app.services.third_party_ai import get_ai_client
from app.services.report_interpreter import report_interpreter

router = APIRouter()

# ========== 请求/响应模型 ==========

class AnalysisRequest(BaseModel):
    """AI分析请求模型"""
    analysis_type: str = Field(..., description="分析类型", pattern="^(oral_classification|cephalometric_17|cephalometric_57|panoramic_segmentation|lesion_detection|stl_segmentation|growth_direction|virtual_fitting)$")
    patient_id: str = Field(..., description="患者ID")
    examination_id: Optional[str] = Field(None, description="检查记录ID")
    params: Optional[Dict[str, Any]] = Field(default_factory=dict, description="分析参数")

    @field_validator('analysis_type')
    @classmethod
    def validate_analysis_type(cls, v):
        supported_types = [
            'oral_classification', 'cephalometric_17', 'cephalometric_57',
            'panoramic_segmentation', 'lesion_detection', 'stl_segmentation',
            'growth_direction', 'virtual_fitting'
        ]
        if v not in supported_types:
            raise ValueError(f'分析类型必须是: {", ".join(supported_types)}')
        return v


class AnalysisResponse(BaseModel):
    """AI分析响应模型"""
    success: bool = Field(description="是否成功")
    task_id: str = Field(description="任务ID")
    analysis_type: str = Field(description="分析类型")
    status: str = Field(description="分析状态", default="processing")
    message: str = Field(description="响应消息")
    estimated_time: Optional[int] = Field(None, description="预计完成时间（秒）")


class AnalysisResult(BaseModel):
    """AI分析结果模型"""
    task_id: str = Field(description="任务ID")
    analysis_type: str = Field(description="分析类型")
    status: str = Field(description="分析状态")
    third_party_result: Optional[Dict[str, Any]] = Field(None, description="第三方AI分析原始结果")
    interpreted_report: Optional[Dict[str, Any]] = Field(None, description="AI解读报告")
    error_message: Optional[str] = Field(None, description="错误信息")
    processing_time: Optional[float] = Field(None, description="处理时间（秒）")
    created_at: str = Field(description="创建时间")
    completed_at: Optional[str] = Field(None, description="完成时间")


# ========== 存储分析任务状态 ==========
analysis_tasks: Dict[str, Dict[str, Any]] = {}


# ========== API端点 ==========

@router.post("/analyze/image", 
             response_model=AnalysisResponse,
             summary="图像AI分析",
             description="上传图像进行AI分析，支持口内、面部、X光片等多种类型")
async def analyze_image(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(..., description="待分析图像文件"),
    request_data: str = Form(..., description="分析请求参数（JSON格式）"),
):
    """
    图像AI分析接口
    """
    try:
        # 解析请求参数
        request_dict = json.loads(request_data)
        analysis_request = AnalysisRequest(**request_dict)
        
        # 验证文件类型
        if not _is_valid_image_file(image.filename):
            raise HTTPException(
                status_code=400,
                detail="不支持的图像格式，请上传 JPG、PNG、TIFF 或 DCM 格式的文件"
            )
        
        # 生成任务ID
        task_id = f"img_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{analysis_request.patient_id}"
        
        # 保存上传文件
        file_path = await _save_uploaded_file(image, task_id)
        
        # 创建分析任务
        task_info = {
            "task_id": task_id,
            "analysis_type": analysis_request.analysis_type,
            "patient_id": analysis_request.patient_id,
            "examination_id": analysis_request.examination_id,
            "file_path": str(file_path),
            "file_type": "image",
            "status": "processing",
            "created_at": datetime.now().isoformat(),
            "params": analysis_request.params
        }
        
        analysis_tasks[task_id] = task_info
        
        # 启动后台分析任务
        background_tasks.add_task(
            _process_image_analysis,
            task_id,
            analysis_request.analysis_type,
            str(file_path),
            analysis_request.patient_id,
            analysis_request.params
        )
        
        # 估算处理时间
        estimated_time = _estimate_processing_time(analysis_request.analysis_type)
        
        api_logger.info(f"启动图像分析任务: {task_id}, 类型: {analysis_request.analysis_type}")
        
        return AnalysisResponse(
            success=True,
            task_id=task_id,
            analysis_type=analysis_request.analysis_type,
            status="processing",
            message="分析任务已启动，请使用任务ID查询结果",
            estimated_time=estimated_time
        )
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="请求参数格式错误")
    except Exception as e:
        api_logger.error(f"启动图像分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"启动分析失败: {str(e)}")


@router.post("/analyze/3d",
             response_model=AnalysisResponse, 
             summary="3D模型AI分析",
             description="上传3D模型进行AI分析，支持STL等格式")
async def analyze_3d_model(
    background_tasks: BackgroundTasks,
    model: UploadFile = File(..., description="待分析3D模型文件"),
    request_data: str = Form(..., description="分析请求参数（JSON格式）"),
):
    """
    3D模型AI分析接口
    """
    try:
        # 解析请求参数
        request_dict = json.loads(request_data)
        analysis_request = AnalysisRequest(**request_dict)
        
        # 验证文件类型
        if not _is_valid_3d_file(model.filename):
            raise HTTPException(
                status_code=400,
                detail="不支持的3D模型格式，请上传 STL、PLY 或 OBJ 格式的文件"
            )
        
        # 生成任务ID
        task_id = f"3d_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{analysis_request.patient_id}"
        
        # 保存上传文件
        file_path = await _save_uploaded_file(model, task_id)
        
        # 创建分析任务
        task_info = {
            "task_id": task_id,
            "analysis_type": analysis_request.analysis_type,
            "patient_id": analysis_request.patient_id,
            "examination_id": analysis_request.examination_id,
            "file_path": str(file_path),
            "file_type": "3d_model",
            "status": "processing",
            "created_at": datetime.now().isoformat(),
            "params": analysis_request.params
        }
        
        analysis_tasks[task_id] = task_info
        
        # 启动后台分析任务
        background_tasks.add_task(
            _process_3d_analysis,
            task_id,
            analysis_request.analysis_type,
            str(file_path),
            analysis_request.patient_id,
            analysis_request.params
        )
        
        # 估算处理时间
        estimated_time = _estimate_processing_time(analysis_request.analysis_type, is_3d=True)
        
        api_logger.info(f"启动3D分析任务: {task_id}, 类型: {analysis_request.analysis_type}")
        
        return AnalysisResponse(
            success=True,
            task_id=task_id,
            analysis_type=analysis_request.analysis_type,
            status="processing",
            message="3D分析任务已启动，请使用任务ID查询结果",
            estimated_time=estimated_time
        )
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="请求参数格式错误")
    except Exception as e:
        api_logger.error(f"启动3D分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"启动分析失败: {str(e)}")


@router.get("/analysis/{task_id}",
            response_model=AnalysisResult,
            summary="获取分析结果",
            description="根据任务ID获取AI分析结果")
async def get_analysis_result(task_id: str):
    """
    获取AI分析结果
    """
    if task_id not in analysis_tasks:
        raise HTTPException(status_code=404, detail="未找到指定的分析任务")
    
    task_info = analysis_tasks[task_id]
    
    return AnalysisResult(
        task_id=task_id,
        analysis_type=task_info["analysis_type"],
        status=task_info["status"],
        third_party_result=task_info.get("third_party_result"),
        interpreted_report=task_info.get("interpreted_report"),
        error_message=task_info.get("error_message"),
        processing_time=task_info.get("processing_time"),
        created_at=task_info["created_at"],
        completed_at=task_info.get("completed_at")
    )


@router.get("/analysis",
            summary="获取分析任务列表",
            description="获取所有分析任务的列表")
async def list_analysis_tasks(
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20
):
    """
    获取分析任务列表
    """
    tasks = list(analysis_tasks.values())
    
    # 过滤条件
    if patient_id:
        tasks = [t for t in tasks if t.get("patient_id") == patient_id]
    
    if status:
        tasks = [t for t in tasks if t.get("status") == status]
    
    # 限制数量并按时间排序
    tasks = sorted(tasks, key=lambda x: x["created_at"], reverse=True)[:limit]
    
    return {
        "success": True,
        "data": {
            "tasks": tasks,
            "total": len(tasks)
        }
    }


@router.delete("/analysis/{task_id}",
               summary="删除分析任务",
               description="删除指定的分析任务及其相关文件")
async def delete_analysis_task(task_id: str):
    """
    删除分析任务
    """
    if task_id not in analysis_tasks:
        raise HTTPException(status_code=404, detail="未找到指定的分析任务")
    
    task_info = analysis_tasks[task_id]
    
    # 删除相关文件
    try:
        file_path = Path(task_info["file_path"])
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        api_logger.warning(f"删除任务文件失败 {task_id}: {str(e)}")
    
    # 删除任务记录
    del analysis_tasks[task_id]
    
    api_logger.info(f"删除分析任务: {task_id}")
    
    return {
        "success": True,
        "message": "分析任务已删除"
    }


# ========== 后台处理任务 ==========

async def _process_image_analysis(
    task_id: str,
    analysis_type: str,
    file_path: str,
    patient_id: str,
    params: Dict[str, Any]
):
    """处理图像分析任务"""
    start_time = datetime.now()
    
    try:
        api_logger.info(f"开始处理图像分析任务: {task_id}")
        
        # 获取AI客户端
        ai_client = get_ai_client()
        
        # 调用对应的第三方AI服务
        third_party_result = await _call_third_party_image_analysis(
            ai_client, analysis_type, file_path, params
        )
        
        # 获取患者信息（简化版）
        patient_info = {"id": patient_id, "age": 8}  # 实际应从数据库获取
        
        # AI报告解读
        interpreted_report = await report_interpreter.interpret_analysis_results(
            third_party_result, analysis_type, patient_info
        )
        
        # 更新任务状态
        processing_time = (datetime.now() - start_time).total_seconds()
        
        analysis_tasks[task_id].update({
            "status": "completed",
            "third_party_result": third_party_result,
            "interpreted_report": interpreted_report,
            "processing_time": processing_time,
            "completed_at": datetime.now().isoformat()
        })
        
        api_logger.info(f"图像分析任务完成: {task_id}, 耗时: {processing_time:.2f}秒")
        
    except Exception as e:
        # 更新任务状态为失败
        processing_time = (datetime.now() - start_time).total_seconds()
        
        analysis_tasks[task_id].update({
            "status": "failed",
            "error_message": str(e),
            "processing_time": processing_time,
            "completed_at": datetime.now().isoformat()
        })
        
        api_logger.error(f"图像分析任务失败: {task_id}, 错误: {str(e)}")


async def _process_3d_analysis(
    task_id: str,
    analysis_type: str,
    file_path: str,
    patient_id: str,
    params: Dict[str, Any]
):
    """处理3D模型分析任务"""
    start_time = datetime.now()
    
    try:
        api_logger.info(f"开始处理3D分析任务: {task_id}")
        
        # 获取AI客户端
        ai_client = get_ai_client()
        
        # 调用对应的第三方AI服务
        third_party_result = await _call_third_party_3d_analysis(
            ai_client, analysis_type, file_path, params
        )
        
        # 获取患者信息（简化版）
        patient_info = {"id": patient_id, "age": 8}  # 实际应从数据库获取
        
        # AI报告解读
        interpreted_report = await report_interpreter.interpret_analysis_results(
            third_party_result, analysis_type, patient_info
        )
        
        # 更新任务状态
        processing_time = (datetime.now() - start_time).total_seconds()
        
        analysis_tasks[task_id].update({
            "status": "completed",
            "third_party_result": third_party_result,
            "interpreted_report": interpreted_report,
            "processing_time": processing_time,
            "completed_at": datetime.now().isoformat()
        })
        
        api_logger.info(f"3D分析任务完成: {task_id}, 耗时: {processing_time:.2f}秒")
        
    except Exception as e:
        # 更新任务状态为失败
        processing_time = (datetime.now() - start_time).total_seconds()
        
        analysis_tasks[task_id].update({
            "status": "failed", 
            "error_message": str(e),
            "processing_time": processing_time,
            "completed_at": datetime.now().isoformat()
        })
        
        api_logger.error(f"3D分析任务失败: {task_id}, 错误: {str(e)}")


# ========== 辅助函数 ==========

async def _call_third_party_image_analysis(ai_client, analysis_type: str, file_path: str, params: Dict[str, Any]):
    """调用第三方图像分析API"""
    method_map = {
        "oral_classification": ai_client.oral_image_classification,
        "cephalometric_17": ai_client.cephalometric_17_points,
        "cephalometric_57": ai_client.cephalometric_57_points_pro,
        "panoramic_segmentation": ai_client.panoramic_segmentation,
        "lesion_detection": ai_client.oral_lesion_detection,
    }
    
    method = method_map.get(analysis_type)
    if not method:
        raise ValueError(f"不支持的图像分析类型: {analysis_type}")
    
    return await method(file_path)


async def _call_third_party_3d_analysis(ai_client, analysis_type: str, file_path: str, params: Dict[str, Any]):
    """调用第三方3D分析API"""
    method_map = {
        "stl_segmentation": ai_client.stl_teeth_segmentation_pro,
        "growth_direction": ai_client.teeth_growth_direction,
        "virtual_fitting": lambda path: ai_client.virtual_appliance_fitting(path, params.get("appliance_type", "crown")),
    }
    
    method = method_map.get(analysis_type)
    if not method:
        raise ValueError(f"不支持的3D分析类型: {analysis_type}")
    
    return await method(file_path)


async def _save_uploaded_file(file: UploadFile, task_id: str) -> Path:
    """保存上传的文件"""
    # 确保上传目录存在
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成文件名
    file_extension = Path(file.filename).suffix
    filename = f"{task_id}{file_extension}"
    file_path = upload_dir / filename
    
    # 保存文件
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    return file_path


def _is_valid_image_file(filename: str) -> bool:
    """验证图像文件类型"""
    if not filename:
        return False
    
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.tiff', '.tif', '.dcm'}
    return Path(filename).suffix.lower() in allowed_extensions


def _is_valid_3d_file(filename: str) -> bool:
    """验证3D文件类型"""
    if not filename:
        return False
    
    allowed_extensions = {'.stl', '.ply', '.obj'}
    return Path(filename).suffix.lower() in allowed_extensions


def _estimate_processing_time(analysis_type: str, is_3d: bool = False) -> int:
    """估算处理时间（秒）"""
    base_time = 120 if is_3d else 60  # 3D处理更耗时
    
    time_factors = {
        "oral_classification": 1.0,
        "cephalometric_17": 1.5,
        "cephalometric_57": 2.0,
        "panoramic_segmentation": 2.5,
        "lesion_detection": 2.0,
        "stl_segmentation": 3.0,
        "growth_direction": 2.5,
        "virtual_fitting": 4.0,
    }
    
    factor = time_factors.get(analysis_type, 1.0)
    return int(base_time * factor)
