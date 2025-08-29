'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  BarChart3,
  ChevronDown,
  Menu,
  X,
  Activity
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

interface MedicalLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  headerActions?: React.ReactNode
  showSearch?: boolean
  className?: string
}

export function MedicalLayout({
  children,
  title,
  description,
  headerActions,
  showSearch = true,
  className = ''
}: MedicalLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
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
      case 'super_admin': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'admin': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'doctor': return 'bg-green-50 text-green-700 border-green-200'
      case 'nurse': return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'patient': return 'bg-orange-50 text-orange-700 border-orange-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* 简洁顶部导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* 左侧 - Logo和标题 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                  {description && (
                    <p className="text-sm text-gray-500 hidden sm:block">{description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 中央 - 搜索栏 */}
            {showSearch && (
              <div className="flex-1 max-w-md mx-8 hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="搜索患者、检查记录..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* 右侧 - 操作区域 */}
            <div className="flex items-center space-x-3">
              {headerActions}
              
              {/* 通知 */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>

              {/* 移动端菜单按钮 */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>

              {/* 用户菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 hover:bg-gray-100">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                        {user?.fullName?.slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start hidden sm:block">
                      <span className="text-sm font-medium text-gray-900">
                        {user?.fullName || '用户'}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs h-4 border ${getRoleColor(user?.role || '')}`}
                      >
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
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-600 hover:text-red-700"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 移动端搜索栏 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200"
            >
              <div className="container mx-auto px-4 py-3">
                {showSearch && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="搜索患者、检查记录..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>

      {/* 底部状态栏 */}
      <div className="fixed bottom-4 right-4 z-40">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-2 rounded-lg bg-white shadow-lg border border-gray-200 px-3 py-2"
        >
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">系统正常</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center space-x-1">
            <Activity className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">实时监控</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}