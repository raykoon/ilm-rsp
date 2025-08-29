'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { DataTable } from '@/components/ui/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { 
  Activity, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Download,
  MoreVertical
} from 'lucide-react'

interface ExaminationRecord {
  id: string
  patientId: string
  patientName: string
  patientAge: number
  clinicId: string
  clinicName: string
  doctorId: string
  doctorName: string
  type: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  filesCount: number
  analysisResults?: any
}

interface ExaminationStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  failed: number
  todayTotal: number
}

const statusConfig = {
  pending: { label: '待处理', color: 'bg-yellow-500', icon: Clock },
  in_progress: { label: '分析中', color: 'bg-blue-500', icon: Activity },
  completed: { label: '已完成', color: 'bg-green-500', icon: CheckCircle },
  failed: { label: '失败', color: 'bg-red-500', icon: XCircle }
}

const typeConfig = {
  'oral_photos': '口内照片筛查',
  'panoramic_xray': '全景X光分析', 
  'cephalometric_xray': '头颅侧位片分析',
  '3d_model': '3D模型分析'
}

export default function AdminExaminationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [clinicFilter, setClinicFilter] = useState<string>('all')

  // 获取检查统计
  const { data: stats } = useQuery<ExaminationStats>({
    queryKey: ['examination-stats'],
    queryFn: () => api.get('/examinations/stats').then(res => res.data.data)
  })

  // 获取检查记录
  const { data: examinations, isLoading } = useQuery<ExaminationRecord[]>({
    queryKey: ['admin-examinations'],
    queryFn: () => api.get('/examinations').then(res => res.data.data)
  })

  // 获取门诊列表
  const { data: clinics = [] } = useQuery({
    queryKey: ['clinics'],
    queryFn: () => api.get('/clinics').then(res => res.data.data || []),
    initialData: []
  })

  // 过滤数据
  const filteredData = examinations?.filter(exam => {
    const matchesSearch = exam.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.clinicName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter
    const matchesType = typeFilter === 'all' || exam.type === typeFilter
    const matchesClinic = clinicFilter === 'all' || exam.clinicId === clinicFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesClinic
  }) || []

  const columns = [
    {
      header: '检查ID',
      accessorKey: 'id',
      cell: ({ row }: { row: any }) => (
        <div className="font-mono text-sm text-gray-600">
          #{row.original.id.slice(-8)}
        </div>
      )
    },
    {
      header: '患者信息',
      accessorKey: 'patient',
      cell: ({ row }: { row: any }) => (
        <div>
          <div className="font-medium">{row.original.patientName}</div>
          <div className="text-sm text-gray-500">{row.original.patientAge}岁</div>
        </div>
      )
    },
    {
      header: '门诊',
      accessorKey: 'clinicName',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm">{row.original.clinicName}</div>
      )
    },
    {
      header: '医生',
      accessorKey: 'doctorName'
    },
    {
      header: '检查类型',
      accessorKey: 'type',
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline">
          {typeConfig[row.original.type as keyof typeof typeConfig]}
        </Badge>
      )
    },
    {
      header: '状态',
      accessorKey: 'status',
      cell: ({ row }: { row: any }) => {
        const status = row.original.status
        const config = statusConfig[status as keyof typeof statusConfig]
        const Icon = config.icon
        return (
          <Badge className={`${config.color} text-white`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        )
      }
    },
    {
      header: '文件数量',
      accessorKey: 'filesCount',
      cell: ({ row }: { row: any }) => (
        <div className="text-center">
          <Badge variant="secondary">{row.original.filesCount || 0}</Badge>
        </div>
      )
    },
    {
      header: '创建时间',
      accessorKey: 'createdAt',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm text-gray-600">
          {format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
        </div>
      )
    },
    {
      header: '操作',
      id: 'actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4 mr-1" />
            详情
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1" />
            下载
          </Button>
        </div>
      )
    }
  ]

  return (
    <MedicalLayout
      title="检查记录管理"
      description="全系统检查记录的统一管理和监控"
    >
      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700">总检查数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-700">待处理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{stats?.pending || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-700">分析中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats?.inProgress || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700">已完成</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats?.completed || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-700">失败</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{stats?.failed || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-indigo-700">今日新增</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">{stats?.todayTotal || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选和搜索 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="搜索患者姓名、医生或门诊..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <SelectRoot value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待处理</SelectItem>
                    <SelectItem value="in_progress">分析中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="failed">失败</SelectItem>
                  </SelectContent>
                </SelectRoot>

                <SelectRoot value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="检查类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="oral_photos">口内照片筛查</SelectItem>
                    <SelectItem value="panoramic_xray">全景X光分析</SelectItem>
                    <SelectItem value="cephalometric_xray">头颅侧位片分析</SelectItem>
                    <SelectItem value="3d_model">3D模型分析</SelectItem>
                  </SelectContent>
                </SelectRoot>

                <SelectRoot value={clinicFilter} onValueChange={setClinicFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="门诊" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部门诊</SelectItem>
                    {clinics?.map((clinic: any) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 数据表格 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              检查记录列表
              <Badge variant="secondary" className="ml-2">
                {filteredData.length} 条记录
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={filteredData}
              searchKey="patientName"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </MedicalLayout>
  )
}
