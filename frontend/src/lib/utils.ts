import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// 格式化日期
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short') {
  const d = new Date(date)
  
  if (format === 'time') {
    return d.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }
  
  return d.toLocaleDateString('zh-CN')
}

// 格式化文件大小
export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生成随机ID
export function generateId(length = 8) {
  return Math.random().toString(36).substring(2, length + 2)
}

// 延迟函数
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 深拷贝
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (typeof obj === "object") {
    const clonedObj: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone((obj as any)[key])
      }
    }
    return clonedObj
  }
  return obj
}

// 角色显示名称映射
export const roleNames = {
  super_admin: '超级管理员',
  admin: '管理员',
  doctor: '医生',
  nurse: '护士',
  patient: '患者'
}

// 状态显示名称映射
export const statusNames = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
  reviewed: '已审核'
}

// 分析类型显示名称映射
export const analysisTypeNames = {
  intraoral: '口内照片',
  facial: '面部照片',
  cephalometric: '头影测量',
  panoramic: '全景X光',
  threeDModel: '3D模型'
}