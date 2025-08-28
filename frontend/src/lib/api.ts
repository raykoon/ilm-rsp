import axios from 'axios'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

// 开发环境使用相对路径（通过Next.js代理），生产环境使用完整URL
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '' // 空字符串，使用相对路径通过Next.js代理
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// 创建axios实例
export const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? '/api' : `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 支持跨域cookie
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误和token过期
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error

    if (!response) {
      toast.error('网络连接错误，请检查您的网络连接')
      return Promise.reject(error)
    }

    switch (response.status) {
      case 401:
        // Token过期或无效
        Cookies.remove('auth_token')
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          toast.error('登录已过期，请重新登录')
          window.location.href = '/login'
        }
        break
      case 403:
        toast.error('您没有权限执行此操作')
        break
      case 404:
        toast.error('请求的资源不存在')
        break
      case 422:
        // 表单验证错误
        if (response.data?.errors) {
          const firstError = Object.values(response.data.errors)[0] as string[]
          toast.error(firstError[0])
        } else {
          toast.error(response.data?.message || '请求参数错误')
        }
        break
      case 429:
        toast.error('请求过于频繁，请稍后再试')
        break
      case 500:
        toast.error('服务器内部错误，请稍后再试')
        break
      case 502:
      case 503:
      case 504:
        toast.error('服务暂时不可用，请稍后再试')
        break
      default:
        toast.error(response.data?.message || '请求失败，请稍后再试')
    }

    return Promise.reject(error)
  }
)

// 文件上传API
export const uploadApi = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? '/api' : `${API_BASE_URL}/api`,
  timeout: 60000, // 文件上传超时时间更长
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true, // 支持跨域cookie
})

// 为上传API添加同样的拦截器
uploadApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

uploadApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error

    if (!response) {
      toast.error('文件上传失败，请检查网络连接')
      return Promise.reject(error)
    }

    switch (response.status) {
      case 413:
        toast.error('文件太大，请选择小于50MB的文件')
        break
      case 415:
        toast.error('不支持的文件格式')
        break
      default:
        toast.error('文件上传失败')
    }

    return Promise.reject(error)
  }
)

// API工具函数
export const apiUtils = {
  // 格式化API错误消息
  getErrorMessage: (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.message) {
      return error.message
    }
    return '操作失败'
  },

  // 处理分页参数
  getPaginationParams: (page: number, pageSize: number = 20) => ({
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, pageSize))
  }),

  // 构建查询字符串
  buildQueryString: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })
    return searchParams.toString()
  }
}

export default api
