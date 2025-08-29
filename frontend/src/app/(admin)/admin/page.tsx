'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users, 
  Building2, 
  ClipboardList, 
  Settings,
  Activity,
  Database,
  Shield,
  TrendingUp,
  Calendar,
  BarChart3,
  UserCheck,
  Clock,
  Download,
  Plus
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MedicalCard, ChartCard, StatusIndicator } from '@/components/ui/medical-card'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { useAuth } from '@/contexts/AuthContext'

interface StatsCard {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: string
    isPositive: boolean
  }
  variant: 'primary' | 'secondary' | 'accent' | 'warning'
}

const statsCards: StatsCard[] = [
  {
    title: '总用户数',
    value: '1,248',
    description: '平台注册用户总数',
    icon: Users,
    trend: { value: '+12%', isPositive: true },
    variant: 'primary'
  },
  {
    title: '合作机构',
    value: '52',
    description: '活跃的医疗机构',
    icon: Building2,
    trend: { value: '+3', isPositive: true },
    variant: 'secondary'
  },
  {
    title: '今日检查',
    value: '127',
    description: '今日完成的检查数量',
    icon: ClipboardList,
    trend: { value: '+8%', isPositive: true },
    variant: 'accent'
  },
  {
    title: '系统健康度',
    value: '99.5%',
    description: '系统运行正常率',
    icon: Activity,
    trend: { value: '稳定', isPositive: true },
    variant: 'warning'
  }
]

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
  bgColor: string
}

const quickActions: QuickAction[] = [
  {
    title: '用户管理',
    description: '管理系统用户和权限',
    icon: Users,
    href: '/admin/users',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100'
  },
  {
    title: '机构管理',
    description: '管理合作医疗机构',
    icon: Building2,
    href: '/admin/clinics',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100'
  },
  {
    title: '检查记录',
    description: '查看所有检查数据',
    icon: ClipboardList,
    href: '/admin/examinations',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100'
  },
  {
    title: '系统设置',
    description: '配置系统参数',
    icon: Settings,
    href: '/admin/settings',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100'
  }
]

interface Activity {
  message: string
  time: string
  type: 'info' | 'success' | 'warning'
  icon: React.ComponentType<{ className?: string }>
}

const recentActivities: Activity[] = [
  {
    message: '新用户注册：张三医生',
    time: '5分钟前',
    type: 'success',
    icon: UserCheck
  },
  {
    message: '系统备份已完成',
    time: '1小时前',
    type: 'info',
    icon: Database
  },
  {
    message: '检查报告批量处理完成',
    time: '2小时前',
    type: 'success',
    icon: ClipboardList
  },
  {
    message: '定时任务执行完成',
    time: '3小时前',
    type: 'info',
    icon: Clock
  }
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const handleQuickAction = (href: string) => {
    router.push(href)
  }

  return (
    <MedicalLayout
      title="管理控制台"
      description={`欢迎回来，${user?.fullName} - 系统总览和快捷操作`}
      headerActions={
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Calendar className="w-4 h-4 mr-2" />
            本月报告
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <MedicalCard
                title={stat.title}
                value={stat.value}
                description={stat.description}
                icon={stat.icon}
                trend={stat.trend}
                variant={stat.variant}
              />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 快捷操作 */}
          <div className="lg:col-span-2">
            <ChartCard
              title="快捷操作"
              description="常用的管理功能入口"
              variant="primary"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`group p-4 rounded-xl border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-md ${action.bgColor}`}
                    onClick={() => handleQuickAction(action.href)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200">
                        <action.icon className={`w-5 h-5 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-gray-800">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* 最近活动 */}
          <div>
            <ChartCard
              title="最近活动"
              description="系统最新动态"
              variant="secondary"
            >
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                      activity.type === 'success' ? 'bg-green-100 text-green-600' :
                      activity.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-5">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                查看全部活动
              </Button>
            </ChartCard>
          </div>
        </div>

        {/* 系统状态监控 */}
        <ChartCard
          title="系统状态监控"
          description="实时系统运行状态监控"
          variant="accent"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200 mx-auto mb-4">
                <Database className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">数据库</p>
              <StatusIndicator status="online" label="正常运行" />
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200 mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">AI服务</p>
              <StatusIndicator status="online" label="正常运行" />
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200 mx-auto mb-4">
                <Shield className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">安全系统</p>
              <StatusIndicator status="online" label="正常运行" />
            </div>
          </div>

          {/* 性能指标 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-4">性能指标</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-white border border-gray-200">
                <div className="text-lg font-semibold text-gray-900">45ms</div>
                <div className="text-xs text-gray-500">平均响应时间</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white border border-gray-200">
                <div className="text-lg font-semibold text-gray-900">99.9%</div>
                <div className="text-xs text-gray-500">系统可用率</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white border border-gray-200">
                <div className="text-lg font-semibold text-gray-900">2.3GB</div>
                <div className="text-xs text-gray-500">内存使用量</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white border border-gray-200">
                <div className="text-lg font-semibold text-gray-900">127</div>
                <div className="text-xs text-gray-500">在线用户</div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </MedicalLayout>
  )
}