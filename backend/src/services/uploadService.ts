/**
 * 文件上传服务
 * 处理多种文件类型的上传、验证和存储
 */

import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

const prisma = new PrismaClient()

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  // 图像文件
  IMAGE: {
    extensions: ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.dcm'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/tiff', 'application/dicom'],
    maxSize: 50 * 1024 * 1024, // 50MB
    category: 'image'
  },
  // 3D模型文件
  MODEL_3D: {
    extensions: ['.stl', '.ply', '.obj'],
    mimeTypes: ['application/octet-stream', 'text/plain'],
    maxSize: 100 * 1024 * 1024, // 100MB
    category: '3d_model'
  },
  // 文档文件
  DOCUMENT: {
    extensions: ['.pdf', '.doc', '.docx'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 20 * 1024 * 1024, // 20MB
    category: 'document'
  }
}

// 文件类型检测
export function detectFileType(filename: string, mimetype: string): string | null {
  const ext = path.extname(filename).toLowerCase()
  
  for (const [typeName, typeConfig] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (typeConfig.extensions.includes(ext) || typeConfig.mimeTypes.includes(mimetype)) {
      return typeConfig.category
    }
  }
  
  return null
}

// 文件验证
export function validateFile(filename: string, mimetype: string, size: number): { valid: boolean; error?: string; type?: string } {
  const fileType = detectFileType(filename, mimetype)
  
  if (!fileType) {
    return {
      valid: false,
      error: `不支持的文件类型: ${path.extname(filename)}`
    }
  }
  
  const typeConfig = Object.values(SUPPORTED_FILE_TYPES).find(config => config.category === fileType)!
  
  if (size > typeConfig.maxSize) {
    return {
      valid: false,
      error: `文件大小超出限制，最大支持 ${Math.round(typeConfig.maxSize / 1024 / 1024)}MB`
    }
  }
  
  return {
    valid: true,
    type: fileType
  }
}

// 生成安全的文件名
export function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(8).toString('hex')
  const ext = path.extname(originalName)
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_').substring(0, 50)
  
  return `${timestamp}_${randomBytes}_${baseName}${ext}`
}

// 确保目录存在
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

// 文件上传处理类
export class UploadService {
  private uploadDir: string
  
  constructor(uploadDir: string = './uploads') {
    this.uploadDir = uploadDir
  }
  
  async setupDirectories(): Promise<void> {
    const directories = [
      path.join(this.uploadDir, 'images'),
      path.join(this.uploadDir, '3d_models'),
      path.join(this.uploadDir, 'documents'),
      path.join(this.uploadDir, 'temp')
    ]
    
    for (const dir of directories) {
      await ensureDirectoryExists(dir)
    }
  }
  
  getMulterConfig() {
    return multer({
      storage: multer.diskStorage({
        destination: async (req, file, cb) => {
          const fileType = detectFileType(file.originalname, file.mimetype)
          let subDir = 'temp'
          
          switch (fileType) {
            case 'image':
              subDir = 'images'
              break
            case '3d_model':
              subDir = '3d_models'
              break
            case 'document':
              subDir = 'documents'
              break
          }
          
          const destDir = path.join(this.uploadDir, subDir)
          await ensureDirectoryExists(destDir)
          cb(null, destDir)
        },
        filename: (req, file, cb) => {
          const safeFilename = generateSafeFilename(file.originalname)
          cb(null, safeFilename)
        }
      }),
      fileFilter: (req, file, cb) => {
        const validation = validateFile(file.originalname, file.mimetype, file.size || 0)
        if (validation.valid) {
          cb(null, true)
        } else {
          cb(new Error(validation.error || '文件验证失败'))
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB 总限制
        files: 10 // 最多10个文件
      }
    })
  }
  
  async saveFileRecord(
    file: Express.Multer.File,
    userId: string,
    examinationId?: string,
    metadata?: any
  ) {
    const fileType = detectFileType(file.originalname, file.mimetype)
    
    const fileRecord = await prisma.uploadedFile.create({
      data: {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        fileType: fileType || 'unknown',
        uploadedById: userId,
        examinationId: examinationId,
        metadata: metadata || {}
      }
    })
    
    return fileRecord
  }
  
  async getFilesByExamination(examinationId: string) {
    return await prisma.uploadedFile.findMany({
      where: { examinationId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })
  }
  
  async deleteFile(fileId: string, userId: string) {
    const file = await prisma.uploadedFile.findFirst({
      where: { 
        id: fileId,
        uploadedById: userId
      }
    })
    
    if (!file) {
      throw new Error('文件不存在或无权限删除')
    }
    
    // 删除物理文件
    try {
      await fs.unlink(file.path)
    } catch (error) {
      console.warn(`删除物理文件失败: ${file.path}`, error)
    }
    
    // 删除数据库记录
    await prisma.uploadedFile.delete({
      where: { id: fileId }
    })
    
    return true
  }
  
  async getFileStats(userId?: string) {
    const where = userId ? { uploadedById: userId } : {}
    
    const stats = await prisma.uploadedFile.groupBy({
      by: ['fileType'],
      where,
      _count: {
        id: true
      },
      _sum: {
        size: true
      }
    })
    
    return stats.map(stat => ({
      type: stat.fileType,
      count: stat._count.id,
      totalSize: stat._sum.size || 0
    }))
  }
}

export const uploadService = new UploadService()
