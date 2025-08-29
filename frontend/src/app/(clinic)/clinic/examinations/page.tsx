'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { DataTable, Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Activity,
  Plus, 
  Eye,
  Brain,
  Camera,
  Scan,
  FileImage,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Share,
  Filter
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Examination {
  id: string
  patientId: string
  patientName: string
  patientAge: number
  patientGender: 'male' | 'female'
  type: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  aiAnalysisStatus: 'waiting' | 'analyzing' | 'completed' | 'failed'
  notes?: string
  createdAt: string
  completedAt?: string
  doctorName: string
  filesCount: number
  analysisResults?: any
}

interface ExaminationStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  todayTotal: number
}

const getExaminationTypeInfo = (type: string) => {
  switch (type) {
    case 'oral_photos':
      return {
        name: '口内照片筛查',
        icon: Camera,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700'
      }
    case 'panoramic_xray':
      return {
        name: '全景X光分析',
        icon: Scan,
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700'
      }
    case 'cephalometric':
      return {
        name: '头颅侧位片分析',
        icon: Brain,
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700'
      }
    case '3d_model':
      return {
        name: '3D模型分析',
        icon: Activity,
        color: 'from-orange-500 to-red-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700'
      }
    default:
      return {
        name: '未知类型',
        icon: FileImage,
        color: 'from-gray-500 to-gray-600',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700'
      }
  }
}

export default function ExaminationsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [examinations, setExaminations] = useState<Examination[]>([])
  const [stats, setStats] = useState<ExaminationStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    todayTotal: 0
  })
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // 权限检查
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!['doctor', 'nurse', 'admin'].includes(user?.role || '')) {
      router.push('/unauthorized')
      return
    }
  }, [isAuthenticated, user, router])

  // 加载检查列表和统计
  const loadData = async () => {
    try {
      setLoading(true)
      
      const [examinationsResponse, statsResponse] = await Promise.all([
        api.get('/examinations', {
          params: {
            page: pagination.page,
            limit: pagination.limit,
            search: searchQuery || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            type: typeFilter !== 'all' ? typeFilter : undefined
          }
        }),
        api.get('/examinations/stats')
      ])

      if (examinationsResponse.data.success) {
        setExaminations(examinationsResponse.data.data.examinations || [])
        setPagination(prev => ({
          ...prev,
          ...examinationsResponse.data.data.pagination
        }))
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data)
      }
    } catch (error: any) {
      console.error('加载数据失败:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    if (user && ['doctor', 'nurse', 'admin'].includes(user.role)) {
      loadData()
    }
  }, [user, pagination.page, pagination.limit, searchQuery, statusFilter, typeFilter])

  // 搜索处理
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 分页处理
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // 查看详情
  const handleView = (examination: Examination) => {
    setSelectedExam(examination)
    setShowDetailDialog(true)
  }

  // 获取状态显示
  const getStatusBadge = (status: string, aiStatus?: string) => {
    if (status === 'completed' && aiStatus === 'completed') {
      return <Badge className="bg-green-100 text-green-800">已完成</Badge>
    }
    if (status === 'in_progress' || aiStatus === 'analyzing') {
      return (
        <Badge className="bg-blue-100 text-blue-800 flex items-center space-x-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>分析中</span>
        </Badge>
      )
    }
    if (status === 'failed' || aiStatus === 'failed') {
      return <Badge variant="destructive">失败</Badge>
    }
    return <Badge variant="secondary">等待中</Badge>
  }

  // 表格列定义
  const columns: Column<Examination>[] = [
    {
      key: 'patientName',
      label: '患者信息',
      render: (value, row) => {
        const typeInfo = getExaminationTypeInfo(row.type)
        return (
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeInfo.color} flex items-center justify-center text-white`}>
              <typeInfo.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">
                {row.patientGender === 'male' ? '男' : '女'} · {row.patientAge}岁
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'type',
      label: '检查类型',
      render: (value) => {
        const typeInfo = getExaminationTypeInfo(value)
        return (
          <Badge className={`${typeInfo.bgColor} ${typeInfo.textColor} border-0`}>
            {typeInfo.name}
          </Badge>
        )
      }
    },
    {
      key: 'status',
      label: '状态',
      render: (value, row) => getStatusBadge(value, row.aiAnalysisStatus)
    },
    {
      key: 'doctorName',
      label: '执行医生',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      )
    },
    {
      key: 'filesCount',
      label: '文件数量',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <FileImage className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value} 个文件</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: '创建时间',
      render: (value, row) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{new Date(value).toLocaleDateString('zh-CN')}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="h-3 w-3 text-gray-400" />
            <span>{new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: '操作',
      width: 'w-20'
    }
  ]

  if (!isAuthenticated || !['doctor', 'nurse', 'admin'].includes(user?.role || '')) {
    return null
  }

  const headerActions = (
    <div className="flex items-center space-x-3">
      <Button
        onClick={() => router.push('/clinic/examination/new')}
        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        新建检查
      </Button>
    </div>
  )

  return (
    <MedicalLayout
      title="筛查记录"
      subtitle="管理和查看所有口腔AI筛查记录"
      headerActions={headerActions}
    >
      <div className="flex-1 overflow-auto bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
        <div className="container mx-auto px-6 py-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Activity className="h-8 w-8 text-blue-100" />
                  <div>
                    <p className="text-sm text-blue-100">总检查数</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-orange-100" />
                  <div>
                    <p className="text-sm text-orange-100">等待中</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-purple-500 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-8 w-8 text-blue-100 animate-spin" />
                  <div>
                    <p className="text-sm text-blue-100">分析中</p>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-green-100" />
                  <div>
                    <p className="text-sm text-green-100">已完成</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-8 w-8 text-purple-100" />
                  <div>
                    <p className="text-sm text-purple-100">今日新增</p>
                    <p className="text-2xl font-bold">{stats.todayTotal}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 筛选栏 */}
          <Card className="mb-6 bg-white/80 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="状态筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">等待中</SelectItem>
                    <SelectItem value="in_progress">分析中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="failed">失败</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="类型筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="oral_photos">口内照片筛查</SelectItem>
                    <SelectItem value="panoramic_xray">全景X光分析</SelectItem>
                    <SelectItem value="cephalometric">头颅侧位片分析</SelectItem>
                    <SelectItem value="3d_model">3D模型分析</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 数据表格 */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <span>检查记录</span>
              </CardTitle>
              <CardDescription>
                共 {pagination.total} 条记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={examinations}
                columns={columns}
                loading={loading}
                searchPlaceholder="搜索患者姓名、医生..."
                pagination={pagination}
                onPageChange={handlePageChange}
                onSearch={handleSearch}
                onView={handleView}
                actions={{
                  view: true,
                  edit: false,
                  delete: false,
                  custom: [
                    {
                      label: '下载报告',
                      icon: Download,
                      onClick: (row) => {
                        // 实现报告下载逻辑
                        toast.success('报告下载功能开发中')
                      }
                    }
                  ]
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <span>检查详情</span>
            </DialogTitle>
            <DialogDescription>
              查看详细的检查信息和AI分析结果
            </DialogDescription>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-6">
              {/* 患者和检查信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">患者信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">患者姓名</span>
                      <span className="font-medium">{selectedExam.patientName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">性别年龄</span>
                      <span className="font-medium">
                        {selectedExam.patientGender === 'male' ? '男' : '女'} · {selectedExam.patientAge}岁
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">执行医生</span>
                      <span className="font-medium">{selectedExam.doctorName}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">检查信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">检查类型</span>
                      <Badge className={`${getExaminationTypeInfo(selectedExam.type).bgColor} ${getExaminationTypeInfo(selectedExam.type).textColor}`}>
                        {getExaminationTypeInfo(selectedExam.type).name}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">当前状态</span>
                      {getStatusBadge(selectedExam.status, selectedExam.aiAnalysisStatus)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">文件数量</span>
                      <span className="font-medium">{selectedExam.filesCount} 个</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">创建时间</span>
                      <span className="font-medium">
                        {new Date(selectedExam.createdAt).toLocaleDateString('zh-CN')} {' '}
                        {new Date(selectedExam.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 备注信息 */}
              {selectedExam.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">检查备注</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedExam.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* AI分析结果 */}
              {selectedExam.aiAnalysisStatus === 'completed' && selectedExam.analysisResults && (
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <span>AI分析结果</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-gray-600">AI分析结果将在这里显示...</p>
                      {/* 这里可以根据实际的AI分析结果来渲染具体内容 */}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MedicalLayout>
  )
}
