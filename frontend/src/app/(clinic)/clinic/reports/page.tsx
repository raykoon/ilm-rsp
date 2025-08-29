'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { DataTable } from '@/components/ui/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { 
  FileText, 
  Download, 
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  User,
  Stethoscope,
  Brain,
  Share,
  Mail,
  Printer
} from 'lucide-react'

interface Report {
  id: string
  examinationId: string
  patientId: string
  patientName: string
  patientAge: number
  doctorId: string
  doctorName: string
  type: 'professional' | 'patient_friendly'
  status: 'generating' | 'generated' | 'reviewed' | 'finalized'
  aiAnalysisType: string
  aiResults: any
  content: {
    summary: string
    findings: string[]
    recommendations: string[]
    riskLevel: 'low' | 'medium' | 'high'
  }
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  reviewedBy?: string
}

interface ReportStats {
  total: number
  generating: number
  pendingReview: number
  finalized: number
  todayGenerated: number
}

const statusConfig = {
  generating: { label: '生成中', color: 'bg-blue-500', icon: Clock },
  generated: { label: '待审核', color: 'bg-yellow-500', icon: AlertCircle },
  reviewed: { label: '已审核', color: 'bg-green-500', icon: CheckCircle },
  finalized: { label: '已完成', color: 'bg-gray-500', icon: CheckCircle }
}

const typeConfig = {
  professional: { label: '专业报告', color: 'bg-purple-100 text-purple-800' },
  patient_friendly: { label: '患者报告', color: 'bg-blue-100 text-blue-800' }
}

const riskConfig = {
  low: { label: '低风险', color: 'bg-green-100 text-green-800' },
  medium: { label: '中风险', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: '高风险', color: 'bg-red-100 text-red-800' }
}

const aiTypeConfig = {
  'oral_photos': '口内照片筛查',
  'panoramic_xray': '全景X光分析',
  'cephalometric_xray': '头颅侧位片分析',
  '3d_model': '3D模型分析'
}

export default function ClinicReportsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')

  // Mock 报告数据
  const mockReports: Report[] = [
    {
      id: '1',
      examinationId: 'exam-001',
      patientId: 'patient-001',
      patientName: '小明',
      patientAge: 8,
      doctorId: 'doctor-001',
      doctorName: '张医生',
      type: 'professional',
      status: 'finalized',
      aiAnalysisType: 'oral_photos',
      aiResults: {
        classification: '正常',
        lesions: [],
        score: 0.92
      },
      content: {
        summary: '口内检查整体情况良好，未发现明显异常。',
        findings: [
          '牙龈健康状况良好',
          '无明显龋齿',
          '咬合关系正常'
        ],
        recommendations: [
          '继续保持良好的口腔卫生习惯',
          '定期复查',
          '注意饮食健康'
        ],
        riskLevel: 'low'
      },
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      reviewedAt: '2024-01-15T14:30:00Z',
      reviewedBy: '张医生'
    },
    {
      id: '2',
      examinationId: 'exam-002',
      patientId: 'patient-002',
      patientName: '小红',
      patientAge: 7,
      doctorId: 'doctor-001',
      doctorName: '张医生',
      type: 'professional',
      status: 'generated',
      aiAnalysisType: 'panoramic_xray',
      aiResults: {
        segmentation: ['tooth1', 'tooth2'],
        abnormalities: ['轻微阻生']
      },
      content: {
        summary: '全景片显示轻微牙齿阻生现象，需要持续观察。',
        findings: [
          '下颌第三磨牙轻微阻生',
          '其他牙齿发育正常',
          '牙槽骨密度正常'
        ],
        recommendations: [
          '6个月后复查全景片',
          '观察阻生牙发育情况',
          '如有疼痛及时就诊'
        ],
        riskLevel: 'medium'
      },
      createdAt: '2024-01-15T11:00:00Z',
      updatedAt: '2024-01-15T11:30:00Z'
    },
    {
      id: '3',
      examinationId: 'exam-003',
      patientId: 'patient-003',
      patientName: '小华',
      patientAge: 9,
      doctorId: 'doctor-001',
      doctorName: '张医生',
      type: 'professional',
      status: 'generating',
      aiAnalysisType: 'cephalometric_xray',
      aiResults: {},
      content: {
        summary: '',
        findings: [],
        recommendations: [],
        riskLevel: 'low'
      },
      createdAt: '2024-01-15T12:00:00Z',
      updatedAt: '2024-01-15T12:00:00Z'
    }
  ]

  const mockStats: ReportStats = {
    total: 156,
    generating: 8,
    pendingReview: 12,
    finalized: 136,
    todayGenerated: 15
  }

  // 获取报告列表
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ['clinic-reports'],
    queryFn: () => Promise.resolve(mockReports),
    staleTime: 5 * 60 * 1000
  })

  // 过滤数据
  const filteredData = reports?.filter(report => {
    const matchesSearch = report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesType = typeFilter === 'all' || report.type === typeFilter
    const matchesRisk = riskFilter === 'all' || report.content.riskLevel === riskFilter
    
    let matchesTab = true
    if (activeTab === 'pending') {
      matchesTab = report.status === 'generated'
    } else if (activeTab === 'completed') {
      matchesTab = report.status === 'finalized'
    } else if (activeTab === 'high-risk') {
      matchesTab = report.content.riskLevel === 'high'
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesRisk && matchesTab
  }) || []

  const columns = [
    {
      header: '报告信息',
      accessorKey: 'report',
      cell: ({ row }: { row: any }) => (
        <div>
          <div className="font-mono text-sm text-gray-600">#{row.original.id}</div>
          <div className="text-sm text-gray-500">
            {aiTypeConfig[row.original.aiAnalysisType as keyof typeof aiTypeConfig]}
          </div>
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
      header: '医生',
      accessorKey: 'doctorName',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center">
          <Stethoscope className="w-3 h-3 mr-1 text-gray-400" />
          <span className="text-sm">{row.original.doctorName}</span>
        </div>
      )
    },
    {
      header: '报告类型',
      accessorKey: 'type',
      cell: ({ row }: { row: any }) => {
        const config = typeConfig[row.original.type as keyof typeof typeConfig]
        return (
          <Badge className={config.color}>
            {config.label}
          </Badge>
        )
      }
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
      header: '风险等级',
      accessorKey: 'riskLevel',
      cell: ({ row }: { row: any }) => {
        const risk = row.original.content.riskLevel
        const config = riskConfig[risk as keyof typeof riskConfig]
        return (
          <Badge className={config.color}>
            {config.label}
          </Badge>
        )
      }
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
            查看
          </Button>
          {row.original.status === 'generated' && (
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-1" />
              审核
            </Button>
          )}
          {row.original.status === 'finalized' && (
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <MedicalLayout
      title="报告中心"
      description="AI分析报告管理、审核和导出"
    >
      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700">总报告数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{mockStats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-700">生成中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{mockStats.generating}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-700">待审核</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{mockStats.pendingReview}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700">已完成</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{mockStats.finalized}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-indigo-700">今日生成</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">{mockStats.todayGenerated}</div>
            </CardContent>
          </Card>
        </div>

        {/* 标签页导航 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">全部报告</TabsTrigger>
            <TabsTrigger value="pending">待审核</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
            <TabsTrigger value="high-risk">高风险</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* 筛选和搜索 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                  <div className="flex flex-col lg:flex-row gap-4 flex-1">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="搜索患者姓名或医生..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[120px]">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="状态" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部状态</SelectItem>
                          <SelectItem value="generating">生成中</SelectItem>
                          <SelectItem value="generated">待审核</SelectItem>
                          <SelectItem value="reviewed">已审核</SelectItem>
                          <SelectItem value="finalized">已完成</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="报告类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部类型</SelectItem>
                          <SelectItem value="professional">专业报告</SelectItem>
                          <SelectItem value="patient_friendly">患者报告</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={riskFilter} onValueChange={setRiskFilter}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="风险等级" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部等级</SelectItem>
                          <SelectItem value="low">低风险</SelectItem>
                          <SelectItem value="medium">中风险</SelectItem>
                          <SelectItem value="high">高风险</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      导出报表
                    </Button>
                    <Button variant="outline">
                      <Printer className="w-4 h-4 mr-2" />
                      批量打印
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 数据表格 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                  报告列表
                  <Badge variant="secondary" className="ml-2">
                    {filteredData.length} 份报告
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
          </TabsContent>
        </Tabs>
      </div>
    </MedicalLayout>
  )
}
