'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User,
  Calendar,
  Activity,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface FullScreenLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  headerActions?: React.ReactNode
  showSearch?: boolean
  className?: string
}

export function FullScreenLayout({
  children,
  title,
  description,
  headerActions,
  showSearch = true,
  className = ''
}: FullScreenLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'super_admin': return '超级管理员'
      case 'admin': return '管理员' 
      case 'doctor': return '医生'
      case 'nurse': return '护士'
      case 'patient': return '患者'
      default: return '用户'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'doctor': return 'bg-green-100 text-green-800'
      case 'nurse': return 'bg-cyan-100 text-cyan-800'
      case 'patient': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* 简约顶部导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* 左侧 - 标题区域 */}
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                {description && (
                  <p className="text-sm text-gray-500">{description}</p>
                )}
              </div>
            </div>

            {/* 中央 - 搜索栏 */}
            {showSearch && (
              <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="搜索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-300"
                  />
                </div>
              </div>
            )}

            {/* 右侧 - 操作区域 */}
            <div className="flex items-center space-x-3">
              {headerActions}
              
              {/* 全屏切换 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-gray-500 hover:text-gray-700"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {/* 通知 */}
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>

              {/* 用户菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback className="text-xs bg-gray-100">
                        {user?.fullName?.slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900">
                        {user?.fullName || '用户'}
                      </span>
                      <Badge variant="secondary" className={`text-xs h-4 ${getRoleColor(user?.role || '')}`}>
                        {getRoleText(user?.role || '')}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    个人资料
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Calendar className="mr-2 h-4 w-4" />
                    我的日程
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    系统设置
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>

      {/* 可选：底部状态栏 */}
      <div className="fixed bottom-0 right-0 p-4 z-40">
        <div className="flex items-center space-x-2 rounded-full bg-white shadow-lg border px-3 py-1.5">
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">系统正常</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center space-x-1">
            <Activity className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">实时</span>
          </div>
        </div>
      </div>
    </div>
  )
}