"""
AI分析API路由
提供各种类型的口腔影像分析服务
"""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from io import BytesIO

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from PIL import Image

from app.core.config import settings
from app.core.logger import analysis_logger, api_logger
from app.services.model_manager import model_manager
from app.core.redis import cache_set, cache_get, CacheKeys

router = APIRouter()

# 请求和响应模型
class AnalysisRequest(BaseModel):
    """分析请求模型"""
    analysis_type: str = Field(..., description="分析类型", regex="^(intraoral|facial|cephalometric|panoramic|3d)$")
    image_id: Optional[str] = Field(None, description="图像ID")
    options: Dict[str, Any] = Field(default_factory=dict, description="分析选项")
    
class AnalysisResponse(BaseModel):
    """分析响应模型"""
    success: bool
    analysis_id: str
    analysis_type: str
    status: str  # processing, completed, failed
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    processing_time: Optional[float] = None
    timestamp: str
    
class AnalysisStatus(BaseModel):
    """分析状态模型"""
    analysis_id: str
    status: str
    progress: Optional[int] = None
    message: Optional[str] = None
    estimated_time: Optional[int] = None

# 支持的分析类型
SUPPORTED_ANALYSIS_TYPES = {
    "intraoral": {
        "name": "口内照片分析",
        "description": "分析口内照片，识别牙齿问题和口腔健康状况",
        "model": "intraoral",
        "max_file_size": 10 * 1024 * 1024,  # 10MB
        "supported_formats": ["jpg", "jpeg", "png"]
    },
    "facial": {
        "name": "面相照片分析", 
        "description": "分析面部照片，检测颌面部发育异常",
        "model": "facial",
        "max_file_size": 10 * 1024 * 1024,  # 10MB
        "supported_formats": ["jpg", "jpeg", "png"]
    },
    "cephalometric": {
        "name": "头侧X光分析",
        "description": "分析头颅侧位X光片，评估颅颌面结构",
        "model": "cephalometric",
        "max_file_size": 20 * 1024 * 1024,  # 20MB
        "supported_formats": ["jpg", "jpeg", "png", "dcm"]
    },
    "panoramic": {
        "name": "全景X光分析",
        "description": "分析口腔全景片，全面评估牙齿和颌骨状况",
        "model": "panoramic", 
        "max_file_size": 20 * 1024 * 1024,  # 20MB
        "supported_formats": ["jpg", "jpeg", "png", "dcm"]
    },
    "3d": {
        "name": "3D模型分析",
        "description": "分析三维模型，精确测量和评估",
        "model": "3d",
        "max_file_size": 50 * 1024 * 1024,  # 50MB
        "supported_formats": ["stl", "obj", "ply"]
    }
}

@router.get("/types", summary="获取支持的分析类型")
async def get_analysis_types():
    """
    获取所有支持的分析类型及其详细信息
    """
    return {
        "success": True,
        "analysis_types": SUPPORTED_ANALYSIS_TYPES,
        "total": len(SUPPORTED_ANALYSIS_TYPES)
    }

@router.post("/upload", response_model=AnalysisResponse, summary="上传图像并开始分析")
async def upload_and_analyze(
    background_tasks: BackgroundTasks,
    analysis_type: str = Form(..., description="分析类型"),
    file: UploadFile = File(..., description="要分析的图像文件"),
    options: Optional[str] = Form(None, description="分析选项(JSON字符串)")
):
    """
    上传图像文件并开始AI分析
    
    支持的分析类型：
    - intraoral: 口内照片分析
    - facial: 面相照片分析  
    - cephalometric: 头侧X光分析
    - panoramic: 全景X光分析
    - 3d: 3D模型分析
    """
    
    # 验证分析类型
    if analysis_type not in SUPPORTED_ANALYSIS_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的分析类型: {analysis_type}"
        )
    
    analysis_config = SUPPORTED_ANALYSIS_TYPES[analysis_type]
    analysis_id = str(uuid.uuid4())
    
    try:
        # 验证文件
        if not file.filename:
            raise HTTPException(status_code=400, detail="文件名不能为空")
        
        # 检查文件大小
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > analysis_config["max_file_size"]:
            raise HTTPException(
                status_code=413,
                detail=f"文件大小超过限制 ({analysis_config['max_file_size'] / 1024 / 1024}MB)"
            )
        
        # 检查文件格式
        file_extension = file.filename.lower().split('.')[-1]
        if file_extension not in analysis_config["supported_formats"]:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件格式: {file_extension}"
            )
        
        # 解析选项
        analysis_options = {}
        if options:
            import json
            try:
                analysis_options = json.loads(options)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="分析选项JSON格式错误")
        
        # 记录分析开始
        analysis_logger.analysis_start(
            analysis_id=analysis_id,
            analysis_type=analysis_type,
            image_info={
                "filename": file.filename,
                "size": file_size,
                "format": file_extension
            }
        )
        
        # 设置分析状态为处理中
        await cache_set(
            CacheKeys.format_key(CacheKeys.ANALYSIS_PROGRESS, analysis_id=analysis_id),
            {
                "status": "processing",
                "progress": 0,
                "message": "正在处理图像...",
                "started_at": datetime.now().isoformat()
            },
            ttl=3600  # 1小时
        )
        
        # 后台执行分析任务
        background_tasks.add_task(
            process_analysis,
            analysis_id,
            analysis_type, 
            content,
            file.filename,
            analysis_options
        )
        
        return AnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            analysis_type=analysis_type,
            status="processing",
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        analysis_logger.analysis_error(
            analysis_id=analysis_id,
            analysis_type=analysis_type,
            error=str(e)
        )
        raise HTTPException(status_code=500, detail=f"分析启动失败: {str(e)}")

async def process_analysis(
    analysis_id: str,
    analysis_type: str,
    image_content: bytes,
    filename: str,
    options: Dict[str, Any]
):
    """
    后台处理分析任务
    """
    start_time = datetime.now()
    
    try:
        # 更新进度: 开始处理
        await cache_set(
            CacheKeys.format_key(CacheKeys.ANALYSIS_PROGRESS, analysis_id=analysis_id),
            {
                "status": "processing",
                "progress": 10,
                "message": "正在加载图像...",
                "started_at": start_time.isoformat()
            },
            ttl=3600
        )
        
        # 加载图像
        image = Image.open(BytesIO(image_content))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # 更新进度: 图像预处理
        await cache_set(
            CacheKeys.format_key(CacheKeys.ANALYSIS_PROGRESS, analysis_id=analysis_id),
            {
                "status": "processing", 
                "progress": 30,
                "message": "正在进行AI分析...",
                "started_at": start_time.isoformat()
            },
            ttl=3600
        )
        
        # 执行AI分析
        model_name = SUPPORTED_ANALYSIS_TYPES[analysis_type]["model"]
        results = await model_manager.inference(model_name, image)
        
        # 更新进度: 处理结果
        await cache_set(
            CacheKeys.format_key(CacheKeys.ANALYSIS_PROGRESS, analysis_id=analysis_id),
            {
                "status": "processing",
                "progress": 80, 
                "message": "正在生成报告...",
                "started_at": start_time.isoformat()
            },
            ttl=3600
        )
        
        # 计算处理时间
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # 添加分析元数据
        final_results = {
            **results,
            "analysis_metadata": {
                "analysis_id": analysis_id,
                "filename": filename,
                "file_size": len(image_content),
                "image_size": image.size,
                "processing_time": processing_time,
                "options": options,
                "completed_at": datetime.now().isoformat()
            }
        }
        
        # 保存最终结果
        await cache_set(
            CacheKeys.format_key(CacheKeys.ANALYSIS_RESULT, analysis_id=analysis_id),
            final_results,
            ttl=7 * 24 * 3600  # 保存7天
        )
        
        # 更新最终状态
        await cache_set(
            CacheKeys.format_key(CacheKeys.ANALYSIS_PROGRESS, analysis_id=analysis_id),
            {
                "status": "completed",
                "progress": 100,
                "message": "分析完成",
                "started_at": start_time.isoformat(),
                "completed_at": datetime.now().isoformat(),
                "processing_time": processing_time
            },
            ttl=3600
        )
        
        # 记录分析完成
        analysis_logger.analysis_complete(
            analysis_id=analysis_id,
            analysis_type=analysis_type,
            duration=processing_time,
            confidence=results.get("confidence", 0.0),
            results={"summary": "analysis_completed"}
        )
        
    except Exception as e:
        # 记录错误
        error_message = str(e)
        processing_time = (datetime.now() - start_time).total_seconds()
        
        analysis_logger.analysis_error(
            analysis_id=analysis_id,
            analysis_type=analysis_type,
            error=error_message,
            duration=processing_time
        )
        
        # 保存错误状态
        await cache_set(
            CacheKeys.format_key(CacheKeys.ANALYSIS_PROGRESS, analysis_id=analysis_id),
            {
                "status": "failed",
                "progress": 0,
                "message": f"分析失败: {error_message}",
                "error": error_message,
                "started_at": start_time.isoformat(),
                "failed_at": datetime.now().isoformat()
            },
            ttl=3600
        )

@router.get("/status/{analysis_id}", response_model=AnalysisStatus, summary="查询分析状态")
async def get_analysis_status(analysis_id: str):
    """
    查询指定分析任务的状态和进度
    """
    
    # 从缓存获取状态
    status_data = await cache_get(
        CacheKeys.format_key(CacheKeys.ANALYSIS_PROGRESS, analysis_id=analysis_id)
    )
    
    if not status_data:
        raise HTTPException(status_code=404, detail="分析任务不存在或已过期")
    
    return AnalysisStatus(
        analysis_id=analysis_id,
        status=status_data.get("status", "unknown"),
        progress=status_data.get("progress"),
        message=status_data.get("message"),
        estimated_time=status_data.get("estimated_time")
    )

@router.get("/result/{analysis_id}", summary="获取分析结果")
async def get_analysis_result(analysis_id: str):
    """
    获取指定分析任务的详细结果
    """
    
    # 检查分析状态
    status_data = await cache_get(
        CacheKeys.format_key(CacheKeys.ANALYSIS_PROGRESS, analysis_id=analysis_id)
    )
    
    if not status_data:
        raise HTTPException(status_code=404, detail="分析任务不存在或已过期")
    
    if status_data.get("status") != "completed":
        return JSONResponse(
            status_code=202,  # Accepted, still processing
            content={
                "success": False,
                "message": "分析尚未完成",
                "status": status_data.get("status"),
                "progress": status_data.get("progress")
            }
        )
    
    # 获取分析结果
    results = await cache_get(
        CacheKeys.format_key(CacheKeys.ANALYSIS_RESULT, analysis_id=analysis_id)
    )
    
    if not results:
        raise HTTPException(status_code=404, detail="分析结果不存在或已过期")
    
    return {
        "success": True,
        "analysis_id": analysis_id,
        "results": results,
        "timestamp": datetime.now().isoformat()
    }

@router.delete("/result/{analysis_id}", summary="删除分析结果")
async def delete_analysis_result(analysis_id: str):
    """
    删除指定的分析结果和状态信息
    """
    
    try:
        # 删除进度信息
        progress_key = CacheKeys.format_key(CacheKeys.ANALYSIS_PROGRESS, analysis_id=analysis_id)
        result_key = CacheKeys.format_key(CacheKeys.ANALYSIS_RESULT, analysis_id=analysis_id)
        
        from app.core.redis import redis_manager
        
        deleted_progress = await redis_manager.delete(progress_key)
        deleted_result = await redis_manager.delete(result_key)
        
        if not deleted_progress and not deleted_result:
            raise HTTPException(status_code=404, detail="分析任务不存在")
        
        api_logger.info(f"删除分析结果", analysis_id=analysis_id)
        
        return {
            "success": True,
            "message": "分析结果已删除",
            "analysis_id": analysis_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"删除分析结果失败", analysis_id=analysis_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")

@router.get("/history", summary="获取分析历史")
async def get_analysis_history(
    limit: int = 50,
    offset: int = 0,
    analysis_type: Optional[str] = None
):
    """
    获取分析历史记录
    
    注意：这个端点需要连接数据库来获取历史记录
    目前返回模拟数据
    """
    
    # TODO: 从数据库获取实际的历史记录
    # 这里返回模拟数据
    
    mock_history = [
        {
            "analysis_id": str(uuid.uuid4()),
            "analysis_type": "intraoral",
            "status": "completed", 
            "created_at": datetime.now().isoformat(),
            "processing_time": 2.5,
            "filename": "example1.jpg"
        },
        {
            "analysis_id": str(uuid.uuid4()),
            "analysis_type": "facial",
            "status": "completed",
            "created_at": datetime.now().isoformat(), 
            "processing_time": 1.8,
            "filename": "example2.jpg"
        }
    ]
    
    # 根据类型过滤
    if analysis_type:
        mock_history = [h for h in mock_history if h["analysis_type"] == analysis_type]
    
    # 分页
    total = len(mock_history)
    paginated_history = mock_history[offset:offset + limit]
    
    return {
        "success": True,
        "history": paginated_history,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }
    }

@router.post("/batch", summary="批量分析")
async def batch_analyze(
    background_tasks: BackgroundTasks,
    analysis_type: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    批量上传多个文件进行分析
    """
    
    if analysis_type not in SUPPORTED_ANALYSIS_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的分析类型: {analysis_type}"
        )
    
    if len(files) > 10:  # 限制批量处理的文件数量
        raise HTTPException(
            status_code=400,
            detail="批量分析最多支持10个文件"
        )
    
    batch_id = str(uuid.uuid4())
    analysis_ids = []
    
    try:
        for file in files:
            analysis_id = str(uuid.uuid4())
            analysis_ids.append(analysis_id)
            
            # 读取文件内容
            content = await file.read()
            
            # 后台执行分析
            background_tasks.add_task(
                process_analysis,
                analysis_id,
                analysis_type,
                content, 
                file.filename or f"batch_{analysis_id}",
                {}
            )
        
        # 缓存批量任务信息
        await cache_set(
            f"batch:{batch_id}",
            {
                "analysis_ids": analysis_ids,
                "analysis_type": analysis_type,
                "total_files": len(files),
                "created_at": datetime.now().isoformat()
            },
            ttl=24 * 3600  # 24小时
        )
        
        return {
            "success": True,
            "batch_id": batch_id,
            "analysis_ids": analysis_ids,
            "total_files": len(files),
            "analysis_type": analysis_type
        }
        
    except Exception as e:
        api_logger.error(f"批量分析启动失败", error=str(e))
        raise HTTPException(status_code=500, detail=f"批量分析失败: {str(e)}")

@router.get("/batch/{batch_id}", summary="获取批量分析状态")
async def get_batch_status(batch_id: str):
    """
    获取批量分析的整体状态
    """
    
    # 获取批量任务信息
    batch_info = await cache_get(f"batch:{batch_id}")
    if not batch_info:
        raise HTTPException(status_code=404, detail="批量任务不存在")
    
    analysis_ids = batch_info["analysis_ids"]
    
    # 获取每个分析的状态
    statuses = []
    completed_count = 0
    failed_count = 0
    
    for analysis_id in analysis_ids:
        status_data = await cache_get(
            CacheKeys.format_key(CacheKeys.ANALYSIS_PROGRESS, analysis_id=analysis_id)
        )
        
        if status_data:
            status = status_data.get("status", "unknown")
            if status == "completed":
                completed_count += 1
            elif status == "failed":
                failed_count += 1
            
            statuses.append({
                "analysis_id": analysis_id,
                "status": status,
                "progress": status_data.get("progress", 0)
            })
        else:
            statuses.append({
                "analysis_id": analysis_id,
                "status": "unknown",
                "progress": 0
            })
    
    # 计算整体进度
    total_files = batch_info["total_files"]
    overall_progress = (completed_count / total_files) * 100 if total_files > 0 else 0
    
    return {
        "success": True,
        "batch_id": batch_id,
        "status": "completed" if completed_count == total_files else "processing",
        "overall_progress": round(overall_progress, 1),
        "completed_count": completed_count,
        "failed_count": failed_count,
        "total_count": total_files,
        "analysis_statuses": statuses,
        "created_at": batch_info.get("created_at")
    }
