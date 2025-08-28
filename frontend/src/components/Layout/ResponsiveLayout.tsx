'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  ChevronDown,
  Search,
  Bell
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  title: string
}

// 移动端导航菜单项
interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  active?: boolean
  children?: NavItem[]
}

// 根据用户角色获取导航菜单
function getNavItems(userRole: string): NavItem[] {
  const commonItems: NavItem[] = [
    { label: '首页', href: '/', icon: <Home className="w-5 h-5" /> },
  ]

  const roleSpecificItems: Record<string, NavItem[]> = {
    'super_admin': [
      { label: '门诊管理', href: '/admin/clinics', icon: <Users className="w-5 h-5" /> },
      { label: '用户管理', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
      { label: '系统设置', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
    ],
    'admin': [
      { label: '患者管理', href: '/clinic/patients', icon: <Users className="w-5 h-5" /> },
      { label: '检查记录', href: '/clinic/examinations', icon: <FileText className="w-5 h-5" /> },
      { label: '报告管理', href: '/clinic/reports', icon: <FileText className="w-5 h-5" /> },
    ],
    'doctor': [
      { label: '我的患者', href: '/doctor/patients', icon: <Users className="w-5 h-5" /> },
      { label: '检查记录', href: '/doctor/examinations', icon: <FileText className="w-5 h-5" /> },
      { label: 'AI分析', href: '/doctor/ai-analysis', icon: <FileText className="w-5 h-5" /> },
    ],
    'patient': [
      { label: '我的检查', href: '/patient/examinations', icon: <FileText className="w-5 h-5" /> },
      { label: '健康档案', href: '/patient/profile', icon: <Users className="w-5 h-5" /> },
    ]
  }

  return [...commonItems, ...(roleSpecificItems[userRole] || [])]
}

export default function ResponsiveLayout({ children, title }: ResponsiveLayoutProps) {
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 关闭移动菜单当路由改变时
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [])

  const navItems = getNavItems(user?.role || 'patient')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧：Logo + 菜单按钮(移动端) */}
            <div className="flex items-center space-x-4">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>
              )}
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">口</span>
                </div>
                <span className="font-semibold text-gray-900 hidden sm:block">
                  儿童口腔筛查平台
                </span>
              </div>
            </div>

            {/* 中间：页面标题 */}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-900 md:text-xl">
                {title}
              </h1>
            </div>

            {/* 右侧：搜索 + 通知 + 用户菜单 */}
            <div className="flex items-center space-x-2">
              {/* 搜索按钮(移动端隐藏) */}
              {!isMobile && (
                <Button variant="ghost" size="sm" className="p-2">
                  <Search className="w-5 h-5" />
                </Button>
              )}
              
              {/* 通知按钮 */}
              <Button variant="ghost" size="sm" className="p-2 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
              </Button>

              {/* 用户菜单 */}
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName || '用户'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'super_admin' ? '超级管理员' :
                     user?.role === 'admin' ? '门诊管理员' :
                     user?.role === 'doctor' ? '医生' : '患者'}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 移动端侧边菜单 */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />
            
            {/* 侧边菜单 */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 overflow-y-auto"
            >
              {/* 菜单头部 */}
              <div className="p-6 border-b bg-blue-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">口</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {user?.fullName || '用户'}
                    </p>
                    <p className="text-sm text-blue-600">
                      {user?.role === 'super_admin' ? '超级管理员' :
                       user?.role === 'admin' ? '门诊管理员' :
                       user?.role === 'doctor' ? '医生' : '患者'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 导航菜单 */}
              <nav className="p-4">
                <div className="space-y-1">
                  {navItems.map((item, index) => (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                        hover:bg-blue-50 hover:text-blue-700
                        ${item.active ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'}
                      `}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </motion.a>
                  ))}
                </div>

                {/* 菜单底部 */}
                <div className="mt-8 pt-4 border-t">
                  <button
                    onClick={() => {
                      logout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-lg transition-colors hover:bg-red-50 text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>退出登录</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 桌面端导航面包屑 */}
        {!isMobile && (
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <a href="/" className="hover:text-blue-600 transition-colors">
                  首页
                </a>
              </li>
              <li>/</li>
              <li className="font-medium text-gray-900">{title}</li>
            </ol>
          </nav>
        )}

        {/* 页面内容 */}
        <div className="space-y-6">
          {children}
        </div>
      </main>

      {/* 移动端底部导航（可选） */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="grid grid-cols-4 gap-1 p-2">
            {navItems.slice(0, 4).map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-lg transition-colors
                  hover:bg-blue-50 hover:text-blue-700
                  ${item.active ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}
                `}
              >
                {item.icon}
                <span className="text-xs mt-1 truncate">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
      
      {/* 移动端底部导航的占位空间 */}
      {isMobile && <div className="h-16" />}
    </div>
  )
}
