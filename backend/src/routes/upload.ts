/**
 * 文件上传路由
 * 处理文件上传、管理和下载
 */

import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { uploadService, validateFile, SUPPORTED_FILE_TYPES } from '../services/uploadService'
import path from 'path'
import fs from 'fs/promises'

const router = Router()
const prisma = new PrismaClient()

// 验证用户中间件（简化版，实际应该从主服务器获取）
const requireAuth = async (req: any, res: Response, next: any) => {
  // 这里应该有实际的认证逻辑
  // 暂时模拟用户
  req.user = { id: 'user123', role: 'doctor' }
  next()
}

// 设置上传服务
uploadService.setupDirectories()

// 获取支持的文件类型信息
router.get('/file-types', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      supported_types: Object.entries(SUPPORTED_FILE_TYPES).map(([key, config]) => ({
        category: config.category,
        extensions: config.extensions,
        mimeTypes: config.mimeTypes,
        maxSize: config.maxSize,
        maxSizeMB: Math.round(config.maxSize / 1024 / 1024)
      }))
    }
  })
})

// 单文件上传
router.post('/single', requireAuth, (req: any, res: Response) => {
  const upload = uploadService.getMulterConfig().single('file')
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      })
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '未选择文件'
      })
    }
    
    try {
      // 保存文件记录到数据库
      const fileRecord = await uploadService.saveFileRecord(
        req.file,
        req.user.id,
        req.body.examinationId,
        {
          uploadSource: 'web',
          userAgent: req.headers['user-agent'],
          originalSize: req.file.size
        }
      )
      
      res.json({
        success: true,
        data: {
          file: {
            id: fileRecord.id,
            originalName: fileRecord.originalName,
            filename: fileRecord.filename,
            size: fileRecord.size,
            fileType: fileRecord.fileType,
            uploadedAt: fileRecord.uploadedAt,
            downloadUrl: `/api/upload/download/${fileRecord.id}`
          }
        },
        message: '文件上传成功'
      })
      
    } catch (error) {
      console.error('保存文件记录失败:', error)
      res.status(500).json({
        success: false,
        error: '保存文件信息失败'
      })
    }
  })
})

// 多文件上传
router.post('/multiple', requireAuth, (req: any, res: Response) => {
  const upload = uploadService.getMulterConfig().array('files', 10)
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      })
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: '未选择文件'
      })
    }
    
    try {
      const files = req.files as Express.Multer.File[]
      const fileRecords = []
      
      for (const file of files) {
        const fileRecord = await uploadService.saveFileRecord(
          file,
          req.user.id,
          req.body.examinationId,
          {
            uploadSource: 'web',
            userAgent: req.headers['user-agent'],
            originalSize: file.size
          }
        )
        
        fileRecords.push({
          id: fileRecord.id,
          originalName: fileRecord.originalName,
          filename: fileRecord.filename,
          size: fileRecord.size,
          fileType: fileRecord.fileType,
          uploadedAt: fileRecord.uploadedAt,
          downloadUrl: `/api/upload/download/${fileRecord.id}`
        })
      }
      
      res.json({
        success: true,
        data: {
          files: fileRecords,
          totalFiles: fileRecords.length
        },
        message: `成功上传 ${fileRecords.length} 个文件`
      })
      
    } catch (error) {
      console.error('保存文件记录失败:', error)
      res.status(500).json({
        success: false,
        error: '保存文件信息失败'
      })
    }
  })
})

// 获取文件列表
router.get('/files', requireAuth, async (req: any, res: Response) => {
  try {
    const { 
      examinationId, 
      fileType, 
      page = 1, 
      limit = 20,
      userId 
    } = req.query
    
    const where: any = {}
    
    // 只有管理员可以查看所有用户的文件
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      where.uploadedById = req.user.id
    } else if (userId) {
      where.uploadedById = userId
    }
    
    if (examinationId) {
      where.examinationId = examinationId
    }
    
    if (fileType) {
      where.fileType = fileType
    }
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)
    
    const [files, total] = await Promise.all([
      prisma.uploadedFile.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          examination: {
            select: {
              id: true,
              examinationDate: true,
              status: true
            }
          }
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take
      }),
      prisma.uploadedFile.count({ where })
    ])
    
    const fileList = files.map(file => ({
      id: file.id,
      originalName: file.originalName,
      filename: file.filename,
      size: file.size,
      fileType: file.fileType,
      uploadedAt: file.uploadedAt,
      uploadedBy: file.uploadedBy,
      examination: file.examination,
      downloadUrl: `/api/upload/download/${file.id}`,
      metadata: file.metadata
    }))
    
    res.json({
      success: true,
      data: {
        files: fileList,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    })
    
  } catch (error) {
    console.error('获取文件列表失败:', error)
    res.status(500).json({
      success: false,
      error: '获取文件列表失败'
    })
  }
})

// 文件下载
router.get('/download/:fileId', requireAuth, async (req: any, res: Response) => {
  try {
    const { fileId } = req.params
    
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
      include: {
        uploadedBy: {
          select: { id: true }
        }
      }
    })
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      })
    }
    
    // 权限检查：只有文件上传者或管理员可以下载
    if (req.user.role !== 'admin' && 
        req.user.role !== 'super_admin' && 
        file.uploadedBy.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: '无权限下载此文件'
      })
    }
    
    // 检查文件是否存在
    try {
      await fs.access(file.path)
    } catch {
      return res.status(404).json({
        success: false,
        error: '文件已损坏或不存在'
      })
    }
    
    // 设置下载头部
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`)
    res.setHeader('Content-Type', file.mimetype)
    res.setHeader('Content-Length', file.size.toString())
    
    // 发送文件
    res.sendFile(path.resolve(file.path))
    
  } catch (error) {
    console.error('文件下载失败:', error)
    res.status(500).json({
      success: false,
      error: '文件下载失败'
    })
  }
})

// 删除文件
router.delete('/:fileId', requireAuth, async (req: any, res: Response) => {
  try {
    const { fileId } = req.params
    
    await uploadService.deleteFile(fileId, req.user.id)
    
    res.json({
      success: true,
      message: '文件删除成功'
    })
    
  } catch (error) {
    console.error('删除文件失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '删除文件失败'
    })
  }
})

// 获取文件统计信息
router.get('/stats', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.role === 'admin' || req.user.role === 'super_admin' 
      ? req.query.userId as string | undefined
      : req.user.id
    
    const stats = await uploadService.getFileStats(userId)
    
    res.json({
      success: true,
      data: {
        stats,
        totalFiles: stats.reduce((acc, stat) => acc + stat.count, 0),
        totalSize: stats.reduce((acc, stat) => acc + stat.totalSize, 0)
      }
    })
    
  } catch (error) {
    console.error('获取文件统计失败:', error)
    res.status(500).json({
      success: false,
      error: '获取文件统计失败'
    })
  }
})

// 验证文件
router.post('/validate', requireAuth, (req: Request, res: Response) => {
  const { filename, mimetype, size } = req.body
  
  if (!filename || !mimetype || !size) {
    return res.status(400).json({
      success: false,
      error: '缺少必要参数: filename, mimetype, size'
    })
  }
  
  const validation = validateFile(filename, mimetype, parseInt(size))
  
  res.json({
    success: true,
    data: {
      valid: validation.valid,
      error: validation.error,
      fileType: validation.type
    }
  })
})

export default router