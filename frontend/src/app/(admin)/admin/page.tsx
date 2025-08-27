'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users, 
  Building2, 
  ClipboardList, 
  Activity,
  Settings,
  Shield,
  TrendingUp,
  AlertTriangle,
  Calendar,
  FileText,
  Database,
  Cpu
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
}

const statsCards: StatsCard[] = [
  {
    title: '总用户数',
    value: '1,248',
    description: '平台注册用户总数',
    icon: Users,
    trend: { value: '+12%', isPositive: true }
  },
  {
    title: '合作机构',
    value: '52',
    description: '活跃的医疗机构',
    icon: Building2,
    trend: { value: '+3', isPositive: true }
  },
  {
    title: '本月筛查',
    value: '3,847',
    description: '本月完成的筛查次数',
    icon: ClipboardList,
    trend: { value: '+18%', isPositive: true }
  },
  {
    title: '系统健康度',
    value: '99.8%',
    description: '系统可用性指标',
    icon: Activity,
    trend: { value: '+0.2%', isPositive: true }
  }
]

const quickActions = [
  {
    title: '用户管理',
    description: '管理系统用户和权限',
    icon: Users,
    href: '/admin/users',
    color: 'bg-blue-500'
  },
  {
    title: '机构管理',
    description: '管理合作医疗机构',
    icon: Building2,
    href: '/admin/clinics',
    color: 'bg-green-500'
  },
  {
    title: '系统设置',
    description: '配置系统参数',
    icon: Settings,
    href: '/admin/settings',
    color: 'bg-purple-500'
  },
  {
    title: '安全中心',
    description: '安全日志和监控',
    icon: Shield,
    href: '/admin/security',
    color: 'bg-red-500'
  }
]

const recentActivities = [
  {
    type: 'user_register',
    message: '新用户注册：张医生（北京儿童口腔诊所）',
    time: '2分钟前'
  },
  {
    type: 'clinic_added',
    message: '新机构加入：上海童牙口腔医院',
    time: '15分钟前'
  },
  {
    type: 'system_update',
    message: 'AI模型更新完成：口内分析模型 v2.1',
    time: '1小时前'
  },
  {
    type: 'alert',
    message: '系统负载预警：CPU使用率达到85%',
    time: '2小时前'
  }
]

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [systemStatus, setSystemStatus] = useState({
    database: 'healthy',
    ai_service: 'healthy',
    redis: 'healthy'
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'super_admin' && user?.role !== 'admin') {
      router.push('/unauthorized')
      return
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || (user?.role !== 'super_admin' && user?.role !== 'admin')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">管理控制台</h1>
              <p className="mt-1 text-sm text-gray-500">
                欢迎回来，{user?.fullName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${systemStatus.database === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>数据库</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${systemStatus.ai_service === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>AI服务</span>
              </div>
              <Button variant="outline" onClick={() => router.push('/admin/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                系统设置
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
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
                  <stat.icon className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="flex items-center mt-2">
                    <p className="text-xs text-gray-500">{stat.description}</p>
                    {stat.trend && (
                      <span className={`ml-2 text-xs ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.trend.value}
                      </span>
                    )}
                  </div>
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
                  常用的管理功能快速入口
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
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(action.href)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{action.title}</h3>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cpu className="w-5 h-5 mr-2" />
                  系统状态
                </CardTitle>
                <CardDescription>
                  实时系统运行状态监控
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Database className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-sm font-medium">数据库</p>
                    <p className="text-xs text-green-600">正常运行</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Activity className="w-8 h-8 mx-auto text-green-500 mb-2" />
                    <p className="text-sm font-medium">AI服务</p>
                    <p className="text-xs text-green-600">正常运行</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Shield className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-sm font-medium">安全系统</p>
                    <p className="text-xs text-green-600">正常运行</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  最近活动
                </CardTitle>
                <CardDescription>
                  系统最新动态和事件
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start space-x-3 p-3 border rounded-lg"
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full ${
                        activity.type === 'alert' ? 'bg-red-400' : 'bg-green-400'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    查看所有活动
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
