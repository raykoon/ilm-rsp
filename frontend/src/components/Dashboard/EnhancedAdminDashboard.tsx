'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Activity, 
  FileText, 
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  Stethoscope
} from 'lucide-react'

// 导入新创建的组件
import { LoadingCard, LoadingSpinner, SkeletonList } from '@/components/ui/loading'
import { 
  StatCard, 
  ProgressBar, 
  SimplePieChart, 
  SimpleBarChart, 
  StatusIndicator,
  DashboardStats 
} from '@/components/Charts/SimpleCharts'
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout'

// 数据接口定义
interface DashboardData {
  stats: {
    totalPatients: number
    totalExaminations: number
    completedReports: number
    pendingReports: number
    completionRate: number
    activeClinics: number
    activeDoctors: number
  }
  recentActivity: Array<{
    id: string
    type: 'examination' | 'report' | 'user' | 'system'
    title: string
    description: string
    timestamp: string
    status: 'success' | 'warning' | 'error' | 'info'
  }>
  examsByMonth: Array<{
    label: string
    value: number
  }>
  reportsByStatus: Array<{
    label: string
    value: number
    color: string
  }>
  topClinics: Array<{
    name: string
    examinations: number
    completionRate: number
  }>
}

export default function EnhancedAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 模拟数据加载
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const mockData: DashboardData = {
          stats: {
            totalPatients: 1247,
            totalExaminations: 2156,
            completedReports: 1832,
            pendingReports: 324,
            completionRate: 85,
            activeClinics: 12,
            activeDoctors: 48
          },
          recentActivity: [
            {
              id: '1',
              type: 'examination',
              title: '新检查记录',
              description: '患者张小明完成了口腔AI分析',
              timestamp: '5分钟前',
              status: 'success'
            },
            {
              id: '2', 
              type: 'report',
              title: '报告生成完成',
              description: '李小红的检查报告已自动生成',
              timestamp: '12分钟前',
              status: 'success'
            },
            {
              id: '3',
              type: 'system',
              title: 'AI服务异常',
              description: '第三方AI服务响应超时，已自动重试',
              timestamp: '1小时前',
              status: 'warning'
            },
            {
              id: '4',
              type: 'user',
              title: '新用户注册',
              description: '北京口腔医院注册了新医生账号',
              timestamp: '2小时前',
              status: 'info'
            }
          ],
          examsByMonth: [
            { label: '1月', value: 156 },
            { label: '2月', value: 178 },
            { label: '3月', value: 203 },
            { label: '4月', value: 189 },
            { label: '5月', value: 234 },
            { label: '6月', value: 276 }
          ],
          reportsByStatus: [
            { label: '已完成', value: 1832, color: '#10B981' },
            { label: '处理中', value: 184, color: '#F59E0B' },
            { label: '待处理', value: 140, color: '#EF4444' }
          ],
          topClinics: [
            { name: '北京儿童医院', examinations: 456, completionRate: 92 },
            { name: '上海口腔医院', examinations: 378, completionRate: 88 },
            { name: '深圳市人民医院', examinations: 324, completionRate: 85 },
            { name: '广州妇幼保健院', examinations: 298, completionRate: 90 }
          ]
        }
        
        setData(mockData)
      } catch (err) {
        setError('加载仪表盘数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <ResponsiveLayout title="管理员仪表盘">
        <div className="space-y-6">
          {/* 统计卡片骨架 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
          
          {/* 其他内容骨架 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingCard title="加载图表数据" />
            <LoadingCard title="加载活动数据" />
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  if (error || !data) {
    return (
      <ResponsiveLayout title="管理员仪表盘">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout title="管理员仪表盘">
      <div className="space-y-6">
        {/* 欢迎横幅 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                欢迎回来，管理员！
              </h1>
              <p className="text-blue-100">
                今天已有 {data.stats.totalExaminations} 次检查，{data.stats.completedReports} 份报告已生成
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <p className="text-blue-100">完成率</p>
                  <p className="text-xl font-bold">{data.stats.completionRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-100">活跃门诊</p>
                  <p className="text-xl font-bold">{data.stats.activeClinics}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 统计卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DashboardStats stats={data.stats} />
        </motion.div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：图表区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 月度检查趋势 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SimpleBarChart
                data={data.examsByMonth}
                title="月度检查统计"
                color="#3B82F6"
              />
            </motion.div>

            {/* 报告状态分布 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SimplePieChart
                data={data.reportsByStatus}
                title="报告状态分布"
              />
            </motion.div>

            {/* 门诊排行榜 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                门诊排行榜
              </h3>
              <div className="space-y-4">
                {data.topClinics.map((clinic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                        ${index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-gray-300'}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{clinic.name}</p>
                        <p className="text-sm text-gray-500">{clinic.examinations} 次检查</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {clinic.completionRate}%
                      </p>
                      <p className="text-xs text-gray-500">完成率</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 右侧：活动和状态 */}
          <div className="space-y-6">
            {/* 系统状态 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold mb-4">系统状态</h3>
              <div className="space-y-3">
                <StatusIndicator 
                  status="success" 
                  label="后端API服务" 
                />
                <StatusIndicator 
                  status="success" 
                  label="数据库连接" 
                />
                <StatusIndicator 
                  status="warning" 
                  label="AI分析服务" 
                />
                <StatusIndicator 
                  status="success" 
                  label="文件存储服务" 
                />
              </div>
            </motion.div>

            {/* 处理进度 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold mb-4">处理进度</h3>
              <div className="space-y-4">
                <ProgressBar
                  label="今日检查目标"
                  value={156}
                  max={200}
                  color="blue"
                />
                <ProgressBar
                  label="报告生成进度"
                  value={data.stats.completedReports}
                  max={data.stats.totalExaminations}
                  color="green"
                />
                <ProgressBar
                  label="存储空间使用"
                  value={67}
                  max={100}
                  color="yellow"
                />
              </div>
            </motion.div>

            {/* 最近活动 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                最近活动
              </h3>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {data.recentActivity.map((activity) => {
                  const getActivityIcon = (type: string) => {
                    switch (type) {
                      case 'examination':
                        return <Stethoscope className="w-4 h-4 text-blue-600" />
                      case 'report':
                        return <FileText className="w-4 h-4 text-green-600" />
                      case 'user':
                        return <Users className="w-4 h-4 text-purple-600" />
                      case 'system':
                        return <AlertCircle className="w-4 h-4 text-yellow-600" />
                      default:
                        return <Activity className="w-4 h-4 text-gray-600" />
                    }
                  }

                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusIndicator status={activity.status} label="" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* 快速操作 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <h3 className="text-lg font-semibold mb-4">快速操作</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium">添加新用户</p>
              <p className="text-sm text-gray-500">创建医生或患者账号</p>
            </button>
            
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all">
              <Building className="w-6 h-6 text-green-600 mb-2" />
              <p className="font-medium">管理门诊</p>
              <p className="text-sm text-gray-500">添加或配置门诊信息</p>
            </button>
            
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
              <FileText className="w-6 h-6 text-purple-600 mb-2" />
              <p className="font-medium">报告模板</p>
              <p className="text-sm text-gray-500">自定义报告模板</p>
            </button>
            
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all">
              <Activity className="w-6 h-6 text-orange-600 mb-2" />
              <p className="font-medium">系统监控</p>
              <p className="text-sm text-gray-500">查看系统性能状态</p>
            </button>
          </div>
        </motion.div>
      </div>
    </ResponsiveLayout>
  )
}
