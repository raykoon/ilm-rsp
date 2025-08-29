'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users, 
  FileText, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Stethoscope,
  Heart,
  Activity,
  UserPlus,
  FileSearch,
  BarChart3,
  Eye
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MedicalCard, ChartCard, StatusIndicator } from '@/components/ui/medical-card'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { useAuth } from '@/contexts/AuthContext'

interface TodayStats {
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

const todayStats: TodayStats[] = [
  {
    title: '今日患者',
    value: '23',
    description: '今日接诊患者数量',
    icon: Users,
    trend: { value: '+5', isPositive: true },
    variant: 'primary'
  },
  {
    title: '待处理检查',
    value: '8',
    description: '需要医生确认的检查',
    icon: FileText,
    trend: { value: '-2', isPositive: false },
    variant: 'warning'
  },
  {
    title: '已完成检查',
    value: '15',
    description: '今日已完成检查数量',
    icon: CheckCircle,
    trend: { value: '+7', isPositive: true },
    variant: 'secondary'
  },
  {
    title: '平均检查时间',
    value: '12分钟',
    description: '每次检查平均耗时',
    icon: Clock,
    trend: { value: '-3分钟', isPositive: true },
    variant: 'accent'
  }
]

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
  bgColor: string
  primary?: boolean
}

const quickActions: QuickAction[] = [
  {
    title: '新建检查',
    description: '为患者创建新的口腔检查',
    icon: Plus,
    href: '/clinic/examination/new',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    primary: true
  },
  {
    title: '患者管理',
    description: '查看和管理患者信息',
    icon: UserPlus,
    href: '/clinic/patients',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100'
  },
  {
    title: '检查记录',
    description: '查看历史检查记录',
    icon: FileSearch,
    href: '/clinic/examinations',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100'
  },
  {
    title: '报告中心',
    description: '查看和管理检查报告',
    icon: BarChart3,
    href: '/clinic/reports',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100'
  }
]

interface RecentExamination {
  id: string
  patientName: string
  type: string
  status: 'pending' | 'in_progress' | 'completed' | 'review'
  time: string
  priority: 'high' | 'medium' | 'low'
}

const recentExaminations: RecentExamination[] = [
  {
    id: '1',
    patientName: '张小明',
    type: '口腔全景检查',
    status: 'pending',
    time: '10:30',
    priority: 'high'
  },
  {
    id: '2',
    patientName: '李小美',
    type: '牙齿矫正复查',
    status: 'in_progress',
    time: '09:45',
    priority: 'medium'
  },
  {
    id: '3',
    patientName: '王小华',
    type: '蛀牙治疗检查',
    status: 'completed',
    time: '09:15',
    priority: 'low'
  },
  {
    id: '4',
    patientName: '赵小强',
    type: '口腔清洁检查',
    status: 'review',
    time: '08:30',
    priority: 'medium'
  }
]

export default function ClinicDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const handleQuickAction = (href: string) => {
    router.push(href)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'completed': return 'bg-green-50 text-green-700 border-green-200'
      case 'review': return 'bg-purple-50 text-purple-700 border-purple-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待检查'
      case 'in_progress': return '检查中'
      case 'completed': return '已完成'
      case 'review': return '待复核'
      default: return '未知'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-amber-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <MedicalLayout
      title="门诊工作台"
      description={`${user?.fullName}医生 - 今日门诊概览和快捷操作`}
      headerActions={
        <Button
          onClick={() => router.push('/clinic/examination/new')}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建检查
        </Button>
      }
    >
      <div className="space-y-8">
        {/* 今日统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {todayStats.map((stat, index) => (
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
              description="常用的诊疗功能入口"
              variant="primary"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md ${
                      action.primary 
                        ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                        : `border-gray-200 ${action.bgColor}`
                    }`}
                    onClick={() => handleQuickAction(action.href)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200">
                        <action.icon className={`w-5 h-5 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
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

          {/* 今日检查安排 */}
          <div>
            <ChartCard
              title="今日检查安排"
              description="预约和待处理的检查"
              variant="secondary"
            >
              <div className="space-y-3">
                {recentExaminations.map((exam, index) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/clinic/examinations/${exam.id}`)}
                  >
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200">
                        <Stethoscope className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {exam.patientName}
                        </p>
                        <div className="flex items-center space-x-1">
                          <AlertCircle className={`w-3 h-3 ${getPriorityColor(exam.priority)}`} />
                          <span className="text-xs text-gray-500">{exam.time}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 truncate">
                        {exam.type}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs border ${getStatusColor(exam.status)}`}
                      >
                        {getStatusText(exam.status)}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => router.push('/clinic/examinations')}
              >
                查看全部检查记录
              </Button>
            </ChartCard>
          </div>
        </div>

        {/* 诊疗数据总览 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 本周统计 */}
          <ChartCard
            title="本周诊疗数据"
            description="过去7天的诊疗统计"
            variant="accent"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">总患者数</p>
                    <p className="text-xs text-gray-500">本周接诊患者</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-900">127</p>
                  <Badge className="text-xs bg-green-100 text-green-700">+15.3%</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                    <Heart className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">成功率</p>
                    <p className="text-xs text-gray-500">诊疗成功率</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-900">98.5%</p>
                  <Badge className="text-xs bg-green-100 text-green-700">+1.2%</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">平均满意度</p>
                    <p className="text-xs text-gray-500">患者反馈评分</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-900">4.8</p>
                  <Badge className="text-xs bg-green-100 text-green-700">+0.3</Badge>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* 设备状态 */}
          <ChartCard
            title="设备状态监控"
            description="医疗设备运行状态"
            variant="warning"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200">
                    <Activity className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">口腔扫描仪</span>
                </div>
                <StatusIndicator status="online" label="正常" className="border-0" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200">
                    <BarChart3 className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">AI分析系统</span>
                </div>
                <StatusIndicator status="online" label="正常" className="border-0" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">报告系统</span>
                </div>
                <StatusIndicator status="warning" label="维护中" className="border-0" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">预约系统</span>
                </div>
                <StatusIndicator status="online" label="正常" className="border-0" />
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </MedicalLayout>
  )
}