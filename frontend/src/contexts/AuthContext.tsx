'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'
import { User, AuthResponse } from '@/types/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthResponse>
  logout: () => void
  refreshAuth: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  // 检查认证状态
  const checkAuth = async () => {
    const token = Cookies.get('auth_token')
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      console.error('Auth check failed:', error)
      Cookies.remove('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  // 登录
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user: userData, token } = response.data
      
      // 存储token
      Cookies.set('auth_token', token, { 
        expires: 7, // 7天过期
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      
      setUser(userData)
      
      return {
        success: true,
        user: userData,
        token
      }
    } catch (error: any) {
      const message = error.response?.data?.message || '登录失败'
      return {
        success: false,
        error: message
      }
    }
  }

  // 登出
  const logout = () => {
    Cookies.remove('auth_token')
    setUser(null)
    router.push('/')
  }

  // 刷新认证信息
  const refreshAuth = async () => {
    await checkAuth()
  }

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
