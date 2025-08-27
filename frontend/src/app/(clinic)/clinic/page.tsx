'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Calendar,
  Users,
  ClipboardList,
  Camera,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Search
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

interface PatientRecord {
  id: string
  name: string
  age: number
  gender: string
  lastVisit: string
  status: 'completed' | 'pending' | 'in_progress'
  nextAppointment?: string
}

const todayStats = [
  {
    title: '今日预约',
    value: '12',
    description: '已确认的预约患者',
    icon: Calendar,
    color: 'text-blue-600'
  },
  {
    title: '已完成筛查',
    value: '8',
    description: '今日完成的筛查',
    icon: CheckCircle,
    color: 'text-green-600'
  },
  {
    title: '进行中',
    value: '2',
    description: '正在分析的筛查',
    icon: Clock,
    color: 'text-yellow-600'
  },
  {
    title: '待审核报告',
    value: '3',
    description: '需要医生审核的报告',
    icon: AlertCircle,
    color: 'text-red-600'
  }
]

const recentPatients: PatientRecord[] = [
  {
    id: '1',
    name: '小明',
    age: 6,
    gender: '男',
    lastVisit: '2024-01-15',
    status: 'completed',
    nextAppointment: '2024-07-15'
  },
  {
    id: '2', 
    name: '小红',
    age: 8,
    gender: '女',
    lastVisit: '2024-01-15',
    status: 'pending'
  },
  {
    id: '3',
    name: '小刚',
    age: 5,
    gender: '男',
    lastVisit: '2024-01-15',
    status: 'in_progress'
  }
]

const quickActions = [
  {
    title: '新建筛查',
    description: '为患者开始新的口腔筛查',
    icon: PlusCircle,
    href: '/clinic/examination/new',
    color: 'bg-green-500',
    primary: true
  },
  {
    title: '患者管理',
    description: '查看和管理患者信息',
    icon: Users,
    href: '/clinic/patients',
    color: 'bg-blue-500'
  },
  {
    title: '筛查记录',
    description: '查看历史筛查记录',
    icon: ClipboardList,
    href: '/clinic/examinations',
    color: 'bg-purple-500'
  },
  {
    title: '报告中心',
    description: '管理和审核分析报告',
    icon: FileText,
    href: '/clinic/reports',
    color: 'bg-orange-500'
  }
]

export default function ClinicDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'doctor' && user?.role !== 'nurse' && user?.role !== 'admin') {
      router.push('/unauthorized')
      return
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || 
      (user?.role !== 'doctor' && user?.role !== 'nurse' && user?.role !== 'admin')) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'pending':
        return '待处理'
      case 'in_progress':
        return '进行中'
      default:
        return '未知'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">门诊工作台</h1>
              <p className="mt-1 text-sm text-gray-500">
                欢迎回来，{user?.fullName} - {user?.title || '医生'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索患者..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button 
                className="medical-primary"
                onClick={() => router.push('/clinic/examination/new')}
              >
                <Camera className="w-4 h-4 mr-2" />
                开始筛查
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {todayStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  快捷操作
                </CardTitle>
                <CardDescription>
                  常用的门诊功能快速入口
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={action.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        action.primary ? 'border-green-200 bg-green-50' : ''
                      }`}
                      onClick={() => router.push(action.href)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className={`font-medium ${action.primary ? 'text-green-900' : 'text-gray-900'}`}>
                            {action.title}
                          </h3>
                          <p className={`text-sm ${action.primary ? 'text-green-700' : 'text-gray-500'}`}>
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    今日安排
                  </div>
                  <Button variant="outline" size="sm">
                    查看全部
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">小张 - 常规检查</p>
                      <p className="text-sm text-blue-700">6岁男孩，首次筛查</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-900">09:30</p>
                      <p className="text-xs text-blue-700">进行中</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">小李 - 复查</p>
                      <p className="text-sm text-gray-700">8岁女孩，正畸复查</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">10:30</p>
                      <p className="text-xs text-gray-700">待到达</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">小王 - 常规检查</p>
                      <p className="text-sm text-gray-700">5岁男孩，定期筛查</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">11:00</p>
                      <p className="text-xs text-gray-700">已预约</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Patients */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    最近患者
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/clinic/patients')}>
                    查看全部
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPatients.map((patient, index) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/clinic/patients/${patient.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(patient.status)}`}>
                            {getStatusText(patient.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {patient.age}岁 {patient.gender} • 上次就诊：{patient.lastVisit}
                        </p>
                        {patient.nextAppointment && (
                          <p className="text-xs text-blue-600 mt-1">
                            下次预约：{patient.nextAppointment}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/clinic/patients/new')}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    添加新患者
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>本周统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">完成筛查</span>
                    <span className="font-medium">42次</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">新增患者</span>
                    <span className="font-medium">15人</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">生成报告</span>
                    <span className="font-medium">38份</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">平均满意度</span>
                    <span className="font-medium text-green-600">4.8分</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
