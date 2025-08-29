'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FileText, 
  Calendar, 
  Heart,
  Clock,
  CheckCircle,
  TrendingUp,
  Download,
  Eye,
  Activity,
  Shield,
  Bell,
  User,
  Stethoscope,
  BarChart3,
  AlertTriangle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MedicalCard, ChartCard, StatusIndicator } from '@/components/ui/medical-card'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { useAuth } from '@/contexts/AuthContext'

interface HealthStats {
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

const healthStats: HealthStats[] = [
  {
    title: '检查记录',
    value: '12',
    description: '历史检查次数',
    icon: FileText,
    trend: { value: '+2', isPositive: true },
    variant: 'primary'
  },
  {
    title: '健康评分',
    value: '85',
    description: '综合口腔健康评分',
    icon: Heart,
    trend: { value: '+5', isPositive: true },
    variant: 'secondary'
  },
  {
    title: '下次复查',
    value: '15天',
    description: '距离下次检查时间',
    icon: Calendar,
    trend: { value: '已预约', isPositive: true },
    variant: 'accent'
  },
  {
    title: '治疗进度',
    value: '75%',
    description: '当前治疗完成度',
    icon: TrendingUp,
    trend: { value: '+10%', isPositive: true },
    variant: 'warning'
  }
]

interface RecentExamination {
  id: string
  date: string
  type: string
  doctor: string
  status: 'completed' | 'pending' | 'scheduled'
  result: string
  hasReport: boolean
}

const recentExaminations: RecentExamination[] = [
  {
    id: '1',
    date: '2024-01-15',
    type: '口腔全景检查',
    doctor: '张医生',
    status: 'completed',
    result: '口腔状况良好',
    hasReport: true
  },
  {
    id: '2',
    date: '2024-01-10',
    type: '牙齿清洁',
    doctor: '李医生',
    status: 'completed',
    result: '清洁完成',
    hasReport: true
  },
  {
    id: '3',
    date: '2024-01-05',
    type: '蛀牙治疗',
    doctor: '王医生',
    status: 'completed',
    result: '治疗成功',
    hasReport: true
  },
  {
    id: '4',
    date: '2024-01-30',
    type: '复查预约',
    doctor: '张医生',
    status: 'scheduled',
    result: '待检查',
    hasReport: false
  }
]

interface HealthTip {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  priority: 'high' | 'medium' | 'low'
}

const healthTips: HealthTip[] = [
  {
    title: '定期刷牙',
    description: '建议每天刷牙2次，每次至少2分钟',
    icon: Clock,
    priority: 'high'
  },
  {
    title: '使用牙线',
    description: '每天使用牙线清洁牙缝，预防牙龈疾病',
    icon: Shield,
    priority: 'medium'
  },
  {
    title: '定期检查',
    description: '建议每6个月进行一次口腔检查',
    icon: Calendar,
    priority: 'high'
  },
  {
    title: '健康饮食',
    description: '减少糖分摄入，多吃富含钙质的食物',
    icon: Heart,
    priority: 'medium'
  }
]

export default function PatientDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'pending': return '待处理'
      case 'scheduled': return '已预约'
      default: return '未知'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-amber-600 bg-amber-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <MedicalLayout
      title="个人健康中心"
      description={`${user?.fullName} - 您的口腔健康管理中心`}
      headerActions={
        <Button
          onClick={() => router.push('/patient/appointments/new')}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Calendar className="w-4 h-4 mr-2" />
          预约检查
        </Button>
      }
    >
      <div className="space-y-8">
        {/* 健康概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {healthStats.map((stat, index) => (
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
          {/* 最近检查记录 */}
          <div className="lg:col-span-2">
            <ChartCard
              title="最近检查记录"
              description="您的检查历史和报告"
              variant="primary"
            >
              <div className="space-y-4">
                {recentExaminations.map((exam, index) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200">
                        <Stethoscope className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {exam.type}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs border ${getStatusColor(exam.status)}`}
                          >
                            {getStatusText(exam.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {exam.date} • {exam.doctor} • {exam.result}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {exam.hasReport && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                          onClick={() => router.push(`/patient/reports/${exam.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {exam.hasReport && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => router.push('/patient/examinations')}
              >
                查看全部检查记录
              </Button>
            </ChartCard>
          </div>

          {/* 健康建议 */}
          <div>
            <ChartCard
              title="健康建议"
              description="个性化口腔护理建议"
              variant="secondary"
            >
              <div className="space-y-3">
                {healthTips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 border border-gray-200 ${getPriorityColor(tip.priority)}`}>
                        <tip.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {tip.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                查看更多建议
              </Button>
            </ChartCard>
          </div>
        </div>

        {/* 健康趋势和预约提醒 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 健康趋势 */}
          <ChartCard
            title="健康趋势分析"
            description="过去6个月的健康变化"
            variant="accent"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                    <Heart className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">口腔健康指数</p>
                    <p className="text-xs text-gray-500">综合评估分数</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-900">85</p>
                  <Badge className="text-xs bg-green-100 text-green-700">+12 较上月</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">治疗依从性</p>
                    <p className="text-xs text-gray-500">治疗计划执行率</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-900">92%</p>
                  <Badge className="text-xs bg-green-100 text-green-700">+5% 较上月</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">预防护理</p>
                    <p className="text-xs text-gray-500">日常护理执行情况</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-900">88%</p>
                  <Badge className="text-xs bg-green-100 text-green-700">+3% 较上月</Badge>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* 预约提醒和通知 */}
          <ChartCard
            title="预约提醒"
            description="即将到来的预约和重要通知"
            variant="warning"
          >
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900 mb-1">
                      复查预约提醒
                    </h3>
                    <p className="text-xs text-blue-800 mb-2">
                      您预约的口腔复查将在1月30日上午10:00进行，请提前15分钟到达。
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge className="text-xs bg-blue-100 text-blue-700">
                        15天后
                      </Badge>
                      <span className="text-xs text-blue-600">张医生</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-amber-900 mb-1">
                      护理提醒
                    </h3>
                    <p className="text-xs text-amber-800 mb-2">
                      根据您的治疗计划，建议本周开始使用处方漱口水。
                    </p>
                    <Badge className="text-xs bg-amber-100 text-amber-700">
                      治疗建议
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-green-900 mb-1">
                      报告已就绪
                    </h3>
                    <p className="text-xs text-green-800 mb-2">
                      您1月15日的检查报告已经完成，请查看详细结果。
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-700 hover:text-green-800 hover:bg-green-100 p-0 h-auto"
                      onClick={() => router.push('/patient/reports')}
                    >
                      立即查看
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </MedicalLayout>
  )
}