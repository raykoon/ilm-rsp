'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Box, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Eye,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'

import { uploadApi, apiUtils } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface UploadedFile {
  id: string
  originalName: string
  filename: string
  size: number
  fileType: string
  uploadedAt: string
  downloadUrl: string
}

interface FileUploadProps {
  examinationId?: string
  acceptedTypes?: string[]
  multiple?: boolean
  maxFiles?: number
  onUploadComplete?: (files: UploadedFile[]) => void
  className?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  id?: string
  error?: string
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'image':
      return <Image className="w-8 h-8 text-blue-500" />
    case '3d_model':
      return <Box className="w-8 h-8 text-purple-500" />
    case 'document':
      return <FileText className="w-8 h-8 text-green-500" />
    default:
      return <File className="w-8 h-8 text-gray-500" />
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function FileUpload({
  examinationId,
  acceptedTypes = ['.jpg', '.jpeg', '.png', '.tiff', '.stl', '.ply', '.obj', '.pdf'],
  multiple = true,
  maxFiles = 10,
  onUploadComplete,
  className = ''
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // 检查文件数量限制
    if (uploadingFiles.length + acceptedFiles.length > maxFiles) {
      toast.error(`最多只能上传 ${maxFiles} 个文件`)
      return
    }

    // 添加到上传队列
    const newUploadingFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }))

    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    // 逐个上传文件
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      const fileIndex = uploadingFiles.length + i

      try {
        const formData = new FormData()
        formData.append('file', file)
        if (examinationId) {
          formData.append('examinationId', examinationId)
        }

        const response = await uploadApi.post('/upload/single', formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            )
            
            setUploadingFiles(prev => 
              prev.map((item, index) => 
                index === fileIndex 
                  ? { ...item, progress }
                  : item
              )
            )
          }
        })

        if (response.data.success) {
          const uploadedFile = response.data.data.file

          // 更新上传状态为成功
          setUploadingFiles(prev => 
            prev.map((item, index) => 
              index === fileIndex 
                ? { ...item, status: 'success', id: uploadedFile.id }
                : item
            )
          )

          // 添加到已上传文件列表
          setUploadedFiles(prev => [...prev, uploadedFile])

          toast.success(`${file.name} 上传成功`)
        }
      } catch (error: any) {
        const errorMessage = apiUtils.getErrorMessage(error)
        
        // 更新上传状态为失败
        setUploadingFiles(prev => 
          prev.map((item, index) => 
            index === fileIndex 
              ? { ...item, status: 'error', error: errorMessage }
              : item
          )
        )

        toast.error(`${file.name} 上传失败: ${errorMessage}`)
      }
    }

    // 3秒后清除上传队列中的成功和失败项
    setTimeout(() => {
      setUploadingFiles(prev => 
        prev.filter(item => item.status === 'uploading')
      )
    }, 3000)

    // 通知父组件
    if (onUploadComplete) {
      onUploadComplete(uploadedFiles)
    }
  }, [uploadingFiles.length, maxFiles, examinationId, uploadedFiles, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    multiple,
    maxFiles
  })

  const removeUploadedFile = async (fileId: string) => {
    try {
      await uploadApi.delete(`/upload/${fileId}`)
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
      toast.success('文件删除成功')
    } catch (error) {
      toast.error('删除文件失败')
    }
  }

  const downloadFile = (file: UploadedFile) => {
    window.open(file.downloadUrl, '_blank')
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 拖放上传区域 */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {isDragActive ? (
          <p className="text-blue-600">放下文件以开始上传...</p>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              拖放文件到此处，或点击选择文件
            </p>
            <p className="text-sm text-gray-500">
              支持格式: {acceptedTypes.join(', ')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              最多 {maxFiles} 个文件，每个文件最大 100MB
            </p>
          </div>
        )}
      </div>

      {/* 上传进度 */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-medium">上传进度</h3>
            {uploadingFiles.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                {getFileIcon('unknown')}
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">
                    {item.file.name}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Progress value={item.progress} className="flex-1" />
                    <span className="text-xs text-gray-500">
                      {item.progress}%
                    </span>
                  </div>
                  {item.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1">{item.error}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {item.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 已上传文件列表 */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-medium">已上传文件 ({uploadedFiles.length})</h3>
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3 p-3 bg-white border rounded-lg shadow-sm"
              >
                {getFileIcon(file.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.originalName}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{file.fileType}</span>
                    <span>{new Date(file.uploadedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(file)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadedFile(file.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
