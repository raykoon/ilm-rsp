'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { 
  Activity, 
  Calendar,
  FileText,
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Stethoscope,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart
} from 'lucide-react'

interface PatientExamination {
  id: string
  type: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  doctorName: string
  clinicName: string
  createdAt: string
  updatedAt: string
  filesCount: number
  analysisResults?: {
    riskLevel: 'low' | 'medium' | 'high'
    summary: string
    score: number
  }
  reportGenerated: boolean
}

interface PatientStats {
  totalExaminations: number
  completedExaminations: number
  pendingExaminations: number
  lastExaminationDate?: string
  overallHealthScore: number
  riskTrend: 'improving' | 'stable' | 'concerning'
}

const statusConfig = {
  pending: { label: '等待分析', color: 'bg-yellow-500', icon: Clock },
  in_progress: { label: '分析中', color: 'bg-blue-500', icon: Activity },
  completed: { label: '已完成', color: 'bg-green-500', icon: CheckCircle },
  failed: { label: '分析失败', color: 'bg-red-500', icon: XCircle }
}

const typeConfig = {
  'oral_photos': '口内照片筛查',
  'panoramic_xray': '全景X光分析',
  'cephalometric_xray': '头颅侧位片分析',
  '3d_model': '3D模型分析'
}

const riskConfig = {
  low: { label: '健康', color: 'bg-green-100 text-green-800', bgColor: 'bg-green-50' },
  medium: { label: '需关注', color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-50' },
  high: { label: '需治疗', color: 'bg-red-100 text-red-800', bgColor: 'bg-red-50' }
}

const trendConfig = {
  improving: { icon: TrendingUp, color: 'text-green-600', label: '改善中' },
  stable: { icon: Minus, color: 'text-blue-600', label: '稳定' },
  concerning: { icon: TrendingDown, color: 'text-red-600', label: '需关注' }
}

export default function PatientExaminationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('timeline')

  // Mock 患者统计数据
  const mockPatientStats: PatientStats = {
    totalExaminations: 12,
    completedExaminations: 10,
    pendingExaminations: 2,
    lastExaminationDate: '2024-01-15T14:00:00Z',
    overallHealthScore: 85,
    riskTrend: 'improving'
  }

  // Mock 患者检查数据
  const mockExaminations: PatientExamination[] = [
    {
      id: '1',
      type: 'oral_photos',
      status: 'completed',
      doctorName: '张医生',
      clinicName: '口腔专科医院',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      filesCount: 5,
      analysisResults: {
        riskLevel: 'low',
        summary: '口腔健康状况良好，未发现异常。建议继续保持良好的口腔卫生习惯。',
        score: 92
      },
      reportGenerated: true
    },
    {
      id: '2',
      type: 'panoramic_xray',
      status: 'completed',
      doctorName: '李医生',
      clinicName: '口腔专科医院',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T11:00:00Z',
      filesCount: 1,
      analysisResults: {
        riskLevel: 'medium',
        summary: '发现轻微牙齿阻生现象，建议定期观察。',
        score: 78
      },
      reportGenerated: true
    },
    {
      id: '3',
      type: 'cephalometric_xray',
      status: 'in_progress',
      doctorName: '王医生',
      clinicName: '儿童口腔诊所',
      createdAt: '2024-01-14T16:00:00Z',
      updatedAt: '2024-01-14T16:00:00Z',
      filesCount: 1,
      reportGenerated: false
    },
    {
      id: '4',
      type: 'oral_photos',
      status: 'completed',
      doctorName: '张医生',
      clinicName: '口腔专科医院',
      createdAt: '2023-12-20T14:00:00Z',
      updatedAt: '2023-12-20T16:00:00Z',
      filesCount: 4,
      analysisResults: {
        riskLevel: 'low',
        summary: '定期复查结果良好，口腔卫生状况有所改善。',
        score: 88
      },
      reportGenerated: true
    }
  ]

  // 获取患者检查记录
  const { data: examinations, isLoading } = useQuery<PatientExamination[]>({
    queryKey: ['patient-examinations'],
    queryFn: () => Promise.resolve(mockExaminations),
    staleTime: 5 * 60 * 1000
  })

  // 过滤数据
  const filteredData = examinations?.filter(exam => {
    const matchesSearch = exam.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.clinicName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter
    const matchesType = typeFilter === 'all' || exam.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  }) || []

  const TrendIcon = trendConfig[mockPatientStats.riskTrend].icon

  return (
    <MedicalLayout
      title="我的检查记录"
      description="查看您的口腔检查历史和健康趋势"
    >
      <div className="space-y-6">
        {/* 个人健康概览 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Heart className="w-5 h-5 mr-2 text-blue-600" />
                口腔健康评分
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-900 mb-2">
                    {mockPatientStats.overallHealthScore}/100
                  </div>
                  <div className="flex items-center text-sm">
                    <TrendIcon className={`w-4 h-4 mr-1 ${trendConfig[mockPatientStats.riskTrend].color}`} />
                    <span className={trendConfig[mockPatientStats.riskTrend].color}>
                      {trendConfig[mockPatientStats.riskTrend].label}
                    </span>
                  </div>
                </div>
                <div className="w-24 h-24">
                  <div className="relative w-full h-full">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="rgba(59, 130, 246, 0.1)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${mockPatientStats.overallHealthScore * 2.51} 251`}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700">完成检查</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {mockPatientStats.completedExaminations}
              </div>
              <p className="text-xs text-green-600 mt-1">
                总共 {mockPatientStats.totalExaminations} 次检查
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-700">待处理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">
                {mockPatientStats.pendingExaminations}
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                分析中的检查
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="timeline">时间线视图</TabsTrigger>
            <TabsTrigger value="list">列表视图</TabsTrigger>
            <TabsTrigger value="reports">我的报告</TabsTrigger>
          </TabsList>

          {/* 时间线视图 */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                  检查时间线
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* 时间线 */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {filteredData.map((exam, index) => {
                      const status = statusConfig[exam.status]
                      const StatusIcon = status.icon
                      const analysis = exam.analysisResults
                      
                      return (
                        <div key={exam.id} className="relative flex items-start space-x-4">
                          {/* 时间线圆点 */}
                          <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${status.color}`}>
                            <StatusIcon className="w-4 h-4 text-white" />
                          </div>
                          
                          {/* 检查卡片 */}
                          <Card className="flex-1">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-medium">
                                    {typeConfig[exam.type as keyof typeof typeConfig]}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {format(new Date(exam.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                                  </p>
                                </div>
                                <Badge className={`${status.color} text-white`}>
                                  {status.label}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <Stethoscope className="w-3 h-3 mr-1" />
                                <span>{exam.doctorName} • {exam.clinicName}</span>
                              </div>
                              
                              {analysis && (
                                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge className={riskConfig[analysis.riskLevel].color}>
                                      {riskConfig[analysis.riskLevel].label}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                      健康评分: {analysis.score}/100
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{analysis.summary}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {exam.filesCount} 个文件
                                </span>
                                <div className="space-x-2">
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-3 h-3 mr-1" />
                                    详情
                                  </Button>
                                  {exam.reportGenerated && (
                                    <Button size="sm" variant="outline">
                                      <FileText className="w-3 h-3 mr-1" />
                                      查看报告
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 列表视图 */}
          <TabsContent value="list" className="space-y-6">
            {/* 搜索筛选 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="搜索医生或诊所..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="pending">等待分析</SelectItem>
                        <SelectItem value="in_progress">分析中</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
                        <SelectItem value="failed">分析失败</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
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
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 检查列表 */}
            <div className="grid gap-4">
              {filteredData.map((exam) => {
                const status = statusConfig[exam.status]
                const analysis = exam.analysisResults
                
                return (
                  <Card key={exam.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium">
                            {typeConfig[exam.type as keyof typeof typeConfig]}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {format(new Date(exam.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                          </p>
                        </div>
                        <Badge className={`${status.color} text-white`}>
                          <status.icon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-gray-600">
                          <Stethoscope className="w-4 h-4 mr-1" />
                          <span>{exam.doctorName} • {exam.clinicName}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {exam.filesCount} 个文件
                        </span>
                      </div>
                      
                      {analysis && (
                        <div className={`${riskConfig[analysis.riskLevel].bgColor} rounded-lg p-4 mb-4`}>
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={riskConfig[analysis.riskLevel].color}>
                              {riskConfig[analysis.riskLevel].label}
                            </Badge>
                            <span className="text-sm font-medium">
                              健康评分: {analysis.score}/100
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{analysis.summary}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          查看详情
                        </Button>
                        {exam.reportGenerated && (
                          <Button variant="outline">
                            <FileText className="w-4 h-4 mr-1" />
                            查看报告
                          </Button>
                        )}
                        {exam.reportGenerated && (
                          <Button variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            下载报告
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* 我的报告 */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  我的健康报告
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {filteredData
                    .filter(exam => exam.reportGenerated)
                    .map((exam) => (
                    <div key={exam.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">
                          {typeConfig[exam.type as keyof typeof typeConfig]} 报告
                        </h3>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            查看
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 mr-1" />
                            下载
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(exam.createdAt), 'yyyy年MM月dd日', { locale: zhCN })} • {exam.doctorName}
                      </p>
                      {exam.analysisResults && (
                        <div className="mt-2">
                          <Badge className={riskConfig[exam.analysisResults.riskLevel].color}>
                            {riskConfig[exam.analysisResults.riskLevel].label}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MedicalLayout>
  )
}
