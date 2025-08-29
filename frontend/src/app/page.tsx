'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return // 等待认证状态加载完成

    if (!user) {
      // 未登录，跳转到登录页
      router.replace('/login')
      return
    }

    // 已登录，根据用户角色跳转到对应页面
    if (user.email.includes('admin') || user.role === 'super_admin' || user.role === 'admin') {
      router.replace('/admin')
    } else if (user.email.includes('doctor') || user.role === 'doctor') {
      router.replace('/clinic')
    } else if (user.email.includes('patient') || user.role === 'patient') {
      router.replace('/patient')
    } else {
      // 默认跳转到登录页
      router.replace('/login')
    }
  }, [user, isLoading, router])

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    )
  }

  // 跳转过程中的加载页面
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">正在跳转...</p>
      </div>
    </div>
  )
}