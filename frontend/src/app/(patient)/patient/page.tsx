'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FileText,
  Calendar,
  User,
  Heart,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

interface Report {
  id: string
  date: string
  type: string
  status: 'completed' | 'pending' | 'in_progress'
  clinic: string
  doctor: string
  summary: string
}

interface Appointment {
  id: string
  date: string
  time: string
  clinic: string
  doctor: string
  type: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
}

const recentReports: Report[] = [
  {
    id: '1',
    date: '2024-01-15',
    type: '口内照片分析',
    status: 'completed',
    clinic: '北京儿童口腔诊所',
    doctor: '张医生',
    summary: '整体口腔健康状况良好，建议继续保持良好的口腔卫生习惯'
  },
  {
    id: '2',
    date: '2024-01-10',
    type: '全景X光分析',
    status: 'completed',
    clinic: '北京儿童口腔诊所',
    doctor: '李医生',
    summary: '牙齿发育正常，未发现明显异常，建议半年后复查'
  },
  {
    id: '3',
    date: '2024-01-08',
    type: '面相分析',
    status: 'pending',
    clinic: '北京儿童口腔诊所',
    doctor: '王医生',
    summary: '报告正在生成中...'
  }
]

const upcomingAppointments: Appointment[] = [
  {
    id: '1',
    date: '2024-02-15',
    time: '09:30',
    clinic: '北京儿童口腔诊所',
    doctor: '张医生',
    type: '定期复查',
    status: 'confirmed'
  },
  {
    id: '2',
    date: '2024-07-15',
    time: '14:00',
    clinic: '北京儿童口腔诊所',
    doctor: '李医生',
    type: '常规筛查',
    status: 'confirmed'
  }
]

export default function PatientDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [selectedTab, setSelectedTab] = useState('reports')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'patient') {
      router.push('/unauthorized')
      return
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== 'patient') {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'confirmed':
        return '已确认'
      case 'pending':
        return '待处理'
      case 'in_progress':
        return '进行中'
      case 'cancelled':
        return '已取消'
      default:
        return '未知'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'confirmed':
        return CheckCircle
      case 'pending':
        return Clock
      case 'in_progress':
        return Clock
      case 'cancelled':
        return AlertCircle
      default:
        return Clock
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">我的健康档案</h1>
              <p className="mt-1 text-sm text-gray-500">
                欢迎回来，{user?.fullName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/patient/profile')}>
                <User className="w-4 h-4 mr-2" />
                个人信息
              </Button>
              <Button className="medical-primary" onClick={() => router.push('/patient/appointments')}>
                <Calendar className="w-4 h-4 mr-2" />
                预约挂号
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Patient Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user?.fullName}</h2>
                  <p className="text-gray-600">{user?.birthDate ? `${new Date().getFullYear() - new Date(user.birthDate).getFullYear()}岁` : ''} • {user?.gender || '未设置'}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    {user?.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {user.phone}
                      </div>
                    )}
                    {user?.email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium">健康状态: 良好</span>
                </div>
                <p className="text-xs text-gray-500">上次检查: 2024-01-15</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setSelectedTab('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTab === 'reports'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            检查报告
          </button>
          <button
            onClick={() => setSelectedTab('appointments')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTab === 'appointments'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4 inline-block mr-2" />
            预约记录
          </button>
        </div>

        {/* Content based on selected tab */}
        {selectedTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>我的检查报告</CardTitle>
                  <CardDescription>
                    查看您的口腔健康检查报告和建议
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentReports.map((report, index) => {
                      const StatusIcon = getStatusIcon(report.status)
                      return (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-medium text-gray-900">{report.type}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                                  {getStatusText(report.status)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{report.summary}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>📅 {report.date}</span>
                                <span>🏥 {report.clinic}</span>
                                <span>👨‍⚕️ {report.doctor}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <StatusIcon className="w-5 h-5 text-gray-400" />
                              {report.status === 'completed' && (
                                <>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-4 h-4 mr-1" />
                                    查看
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Download className="w-4 h-4 mr-1" />
                                    下载
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Sidebar */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>快捷操作</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      预约新检查
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      查看历史报告
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <User className="w-4 h-4 mr-2" />
                      更新个人信息
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      联系客服
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>健康提醒</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">定期检查提醒</p>
                      <p className="text-xs text-blue-700 mt-1">建议您每6个月进行一次口腔检查</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-900">口腔护理建议</p>
                      <p className="text-xs text-green-700 mt-1">每天至少刷牙2次，使用含氟牙膏</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {selectedTab === 'appointments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>即将到来的预约</CardTitle>
                <CardDescription>
                  您即将到来的门诊预约
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment, index) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{appointment.type}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>📅 {appointment.date} {appointment.time}</p>
                        <p>🏥 {appointment.clinic}</p>
                        <p>👨‍⚕️ {appointment.doctor}</p>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm" variant="outline">
                          <MapPin className="w-4 h-4 mr-1" />
                          查看位置
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4 mr-1" />
                          联系诊所
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>历史预约</CardTitle>
                <CardDescription>
                  您过往的就诊记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">常规检查</p>
                      <p className="text-sm text-gray-600">2024-01-15 • 张医生</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      已完成
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">复查</p>
                      <p className="text-sm text-gray-600">2023-07-15 • 李医生</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      已完成
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full">
                    查看全部历史记录
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
