import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, formatDistanceToNow, isValid } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 日期格式化工具
export const dateUtils = {
  // 格式化日期
  format: (date: string | Date, pattern: string = 'yyyy-MM-dd') => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date
      return isValid(dateObj) ? format(dateObj, pattern, { locale: zhCN }) : '无效日期'
    } catch {
      return '无效日期'
    }
  },

  // 格式化日期时间
  formatDateTime: (date: string | Date) => {
    return dateUtils.format(date, 'yyyy-MM-dd HH:mm:ss')
  },

  // 相对时间（多久之前）
  relative: (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date
      return isValid(dateObj) ? formatDistanceToNow(dateObj, { locale: zhCN, addSuffix: true }) : '未知时间'
    } catch {
      return '未知时间'
    }
  },

  // 是否是今天
  isToday: (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date
      const today = new Date()
      return dateObj.toDateString() === today.toDateString()
    } catch {
      return false
    }
  }
}

// 文件大小格式化
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 数字格式化
export const numberUtils = {
  // 格式化数字（千分位）
  format: (num: number | string, decimals: number = 0) => {
    const number = typeof num === 'string' ? parseFloat(num) : num
    if (isNaN(number)) return '0'
    return number.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  },

  // 格式化百分比
  percentage: (num: number, decimals: number = 1) => {
    return (num * 100).toFixed(decimals) + '%'
  },

  // 格式化货币
  currency: (num: number, currency: string = '¥') => {
    return currency + numberUtils.format(num, 2)
  }
}

// 字符串工具
export const stringUtils = {
  // 截断字符串
  truncate: (str: string, length: number = 50, suffix: string = '...') => {
    if (str.length <= length) return str
    return str.substring(0, length) + suffix
  },

  // 首字母大写
  capitalize: (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  // 生成随机字符串
  random: (length: number = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // 脱敏处理
  mask: {
    phone: (phone: string) => {
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    },
    email: (email: string) => {
      const [username, domain] = email.split('@')
      if (username.length <= 2) return email
      const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
      return maskedUsername + '@' + domain
    },
    idCard: (idCard: string) => {
      return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
    }
  }
}

// 验证工具
export const validators = {
  email: (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  },

  phone: (phone: string) => {
    const regex = /^1[3-9]\d{9}$/
    return regex.test(phone)
  },

  password: (password: string) => {
    // 至少8位，包含数字和字母
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
    return regex.test(password)
  },

  idCard: (idCard: string) => {
    const regex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    return regex.test(idCard)
  }
}

// 颜色工具
export const colorUtils = {
  // 根据文本生成颜色
  getColorFromText: (text: string) => {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 60%)`
  },

  // 状态颜色映射
  status: {
    pending: 'text-yellow-600 bg-yellow-100',
    processing: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
    reviewed: 'text-purple-600 bg-purple-100'
  },

  // 角色颜色映射
  role: {
    super_admin: 'text-purple-600 bg-purple-100',
    admin: 'text-blue-600 bg-blue-100',
    doctor: 'text-green-600 bg-green-100',
    nurse: 'text-cyan-600 bg-cyan-100',
    patient: 'text-gray-600 bg-gray-100'
  }
}

// 本地存储工具
export const storage = {
  get: <T = any>(key: string, defaultValue: T | null = null): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },

  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },

  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  }
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, wait)
    }
  }
}

// URL工具
export const urlUtils = {
  // 构建查询参数
  buildQuery: (params: Record<string, any>) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    return searchParams.toString()
  },

  // 解析查询参数
  parseQuery: (search: string) => {
    const params = new URLSearchParams(search)
    const result: Record<string, string> = {}
    params.forEach((value, key) => {
      result[key] = value
    })
    return result
  }
}
