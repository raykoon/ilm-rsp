'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { 
  FileText, 
  Download, 
  Share2,
  Heart,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  User,
  Stethoscope,
  Brain,
  Search,
  Filter,
  ArrowRight,
  Shield,
  Activity,
  TrendingUp,
  Star,
  ChevronRight,
  Eye,
  Mail,
  MessageCircle
} from 'lucide-react'

interface PatientReport {
  id: string
  examinationId: string
  type: 'professional' | 'patient_friendly'
  title: string
  examinationType: string
  status: 'generated' | 'reviewed' | 'finalized'
  doctorName: string
  clinicName: string
  createdAt: string
  reviewedAt?: string
  content: {
    summary: string
    riskLevel: 'low' | 'medium' | 'high'
    score: number
    findings: {
      positive: string[]
      concerns: string[]
      recommendations: string[]
    }
    nextSteps: string[]
    followUpDate?: string
  }
  images?: {
    original: string
    annotated: string
    description: string
  }[]
}

const riskConfig = {
  low: { 
    label: '健康状况良好', 
    color: 'text-green-700', 
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-200',
    icon: CheckCircle
  },
  medium: { 
    label: '需要关注', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-50', 
    borderColor: 'border-yellow-200',
    icon: AlertTriangle
  },
  high: { 
    label: '需要治疗', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-200',
    icon: AlertTriangle
  }
}

const typeConfig = {
  'oral_photos': {
    title: '口内照片筛查报告',
    description: '通过AI分析口内照片，评估牙齿和口腔健康状况',
    icon: Eye
  },
  'panoramic_xray': {
    title: '全景X光分析报告',
    description: '全景X光片AI分析，评估牙齿发育和潜在问题',
    icon: Activity
  },
  'cephalometric_xray': {
    title: '头颅侧位片分析报告',
    description: '头颅侧位片57点分析，评估头面部发育情况',
    icon: Brain
  },
  '3d_model': {
    title: '3D模型分析报告',
    description: '3D口腔模型分析，精确评估牙齿排列和咬合关系',
    icon: Star
  }
}

export default function PatientReportsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReport, setSelectedReport] = useState<PatientReport | null>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)

  // Mock 患者报告数据
  const mockReports: PatientReport[] = [
    {
      id: '1',
      examinationId: 'exam-001',
      type: 'patient_friendly',
      title: '口内照片筛查报告',
      examinationType: 'oral_photos',
      status: 'finalized',
      doctorName: '张医生',
      clinicName: '口腔专科医院',
      createdAt: '2024-01-15T10:00:00Z',
      reviewedAt: '2024-01-15T14:30:00Z',
      content: {
        summary: '恭喜！您的口腔整体健康状况非常好。AI分析显示，您的牙齿排列整齐，牙龈健康，没有发现龋齿或其他口腔问题。',
        riskLevel: 'low',
        score: 92,
        findings: {
          positive: [
            '牙龈颜色正常，无红肿现象',
            '牙齿表面清洁，无明显菌斑',
            '咬合关系良好',
            '口腔卫生状况优秀'
          ],
          concerns: [],
          recommendations: [
            '继续保持现有的刷牙习惯',
            '每天使用牙线清洁牙缝',
            '定期使用漱口水',
            '避免过多甜食'
          ]
        },
        nextSteps: [
          '6个月后进行常规复查',
          '如有任何不适及时就诊',
          '保持良好的口腔卫生习惯'
        ],
        followUpDate: '2024-07-15'
      }
    },
    {
      id: '2',
      examinationId: 'exam-002',
      type: 'patient_friendly',
      title: '全景X光分析报告',
      examinationType: 'panoramic_xray',
      status: 'reviewed',
      doctorName: '李医生',
      clinicName: '口腔专科医院',
      createdAt: '2024-01-10T09:00:00Z',
      reviewedAt: '2024-01-10T11:00:00Z',
      content: {
        summary: '全景X光分析显示，您的口腔发育整体正常，但发现一颗智齿存在轻微阻生现象。这是比较常见的情况，目前不需要立即处理。',
        riskLevel: 'medium',
        score: 78,
        findings: {
          positive: [
            '大部分牙齿发育正常',
            '颌骨发育良好',
            '无明显病变',
            '牙根形态正常'
          ],
          concerns: [
            '右下智齿轻微阻生',
            '需要定期观察智齿发育情况'
          ],
          recommendations: [
            '保持智齿区域清洁',
            '注意观察是否有疼痛或肿胀',
            '避免用智齿咀嚼硬物',
            '定期复查X光片'
          ]
        },
        nextSteps: [
          '3个月后复查智齿情况',
          '如出现疼痛立即就诊',
          '考虑未来是否需要拔除智齿'
        ],
        followUpDate: '2024-04-10'
      }
    },
    {
      id: '3',
      examinationId: 'exam-003',
      type: 'patient_friendly',
      title: '头颅侧位片分析报告',
      examinationType: 'cephalometric_xray',
      status: 'generated',
      doctorName: '王医生',
      clinicName: '儿童口腔诊所',
      createdAt: '2024-01-14T16:00:00Z',
      content: {
        summary: '头颅侧位片分析显示，您的面部发育基本正常，上下颌关系协调。建议继续观察面部发育情况。',
        riskLevel: 'low',
        score: 85,
        findings: {
          positive: [
            '面部轮廓发育正常',
            '上下颌比例协调',
            '牙齿角度合适',
            '呼吸道通畅'
          ],
          concerns: [
            '需要持续观察面部发育'
          ],
          recommendations: [
            '保持良好的口腔习惯',
            '避免用嘴呼吸',
            '注意面部肌肉训练',
            '定期检查面部发育'
          ]
        },
        nextSteps: [
          '1年后复查头颅侧位片',
          '观察面部发育变化',
          '如有异常及时咨询'
        ],
        followUpDate: '2025-01-14'
      }
    }
  ]

  // 获取患者报告列表
  const { data: reports, isLoading } = useQuery<PatientReport[]>({
    queryKey: ['patient-reports'],
    queryFn: () => Promise.resolve(mockReports),
    staleTime: 5 * 60 * 1000
  })

  // 过滤数据
  const filteredReports = reports?.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.clinicName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleViewReport = (report: PatientReport) => {
    setSelectedReport(report)
    setShowReportDialog(true)
  }

  const getRiskStats = () => {
    if (!reports) return { low: 0, medium: 0, high: 0, total: 0 }
    
    return reports.reduce((acc, report) => {
      acc[report.content.riskLevel]++
      acc.total++
      return acc
    }, { low: 0, medium: 0, high: 0, total: 0 })
  }

  const riskStats = getRiskStats()
  const avgScore = reports?.reduce((sum, report) => sum + report.content.score, 0) / (reports?.length || 1) || 0

  return (
    <MedicalLayout
      title="我的健康报告"
      description="查看详细的口腔健康分析报告和建议"
    >
      <div className="space-y-6">
        {/* 健康概览 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Heart className="w-5 h-5 mr-2 text-blue-600" />
                整体健康评分
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-900 mb-2">
                    {Math.round(avgScore)}/100
                  </div>
                  <div className="text-sm text-blue-700">
                    基于 {riskStats.total} 份报告分析
                  </div>
                </div>
                <div className="w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke="rgba(59, 130, 246, 0.1)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${avgScore * 2.2} 220`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-900">
                      {Math.round(avgScore)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700">健康良好</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{riskStats.low}</div>
              <div className="flex items-center mt-1">
                <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600">状况良好</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-700">需要关注</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{riskStats.medium}</div>
              <div className="flex items-center mt-1">
                <AlertTriangle className="w-3 h-3 text-yellow-600 mr-1" />
                <span className="text-xs text-yellow-600">定期观察</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索 */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索报告、医生或诊所..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 报告列表 */}
        <div className="grid gap-4">
          {filteredReports.map((report) => {
            const riskConfig_ = riskConfig[report.content.riskLevel]
            const typeInfo = typeConfig[report.examinationType as keyof typeof typeConfig]
            const TypeIcon = typeInfo.icon
            const RiskIcon = riskConfig_.icon
            
            return (
              <Card key={report.id} className={`hover:shadow-md transition-shadow ${riskConfig_.borderColor} border-2`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className={`${riskConfig_.bgColor} p-3 rounded-lg`}>
                        <TypeIcon className={`w-6 h-6 ${riskConfig_.color}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-1">{report.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{typeInfo.description}</p>
                        <div className="flex items-center text-sm text-gray-600">
                          <Stethoscope className="w-3 h-3 mr-1" />
                          <span>{report.doctorName} • {report.clinicName}</span>
                          <span className="mx-2">•</span>
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{format(new Date(report.createdAt), 'yyyy年MM月dd日', { locale: zhCN })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center mb-2">
                        <RiskIcon className={`w-4 h-4 mr-1 ${riskConfig_.color}`} />
                        <span className={`text-sm font-medium ${riskConfig_.color}`}>
                          {riskConfig_.label}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {report.content.score}/100
                      </div>
                    </div>
                  </div>
                  
                  <div className={`${riskConfig_.bgColor} rounded-lg p-4 mb-4`}>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {report.content.summary}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {report.content.followUpDate && (
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>
                            下次复查: {format(new Date(report.content.followUpDate), 'yyyy年MM月dd日', { locale: zhCN })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleViewReport(report)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看详情
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        下载PDF
                      </Button>
                      <Button variant="outline">
                        <Share2 className="w-4 h-4 mr-1" />
                        分享
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 报告详情弹窗 */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                {selectedReport?.title}
              </DialogTitle>
            </DialogHeader>
            
            {selectedReport && (
              <div className="space-y-6">
                {/* 报告头部信息 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-600">主治医生</label>
                      <p>{selectedReport.doctorName}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-600">检查日期</label>
                      <p>{format(new Date(selectedReport.createdAt), 'yyyy年MM月dd日', { locale: zhCN })}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-600">健康评分</label>
                      <p className="text-lg font-bold">{selectedReport.content.score}/100</p>
                    </div>
                  </div>
                </div>
                
                {/* 风险评估 */}
                <Card className={`${riskConfig[selectedReport.content.riskLevel].borderColor} border-2`}>
                  <CardHeader className={riskConfig[selectedReport.content.riskLevel].bgColor}>
                    <CardTitle className="flex items-center">
                      <riskConfig[selectedReport.content.riskLevel].icon className={`w-5 h-5 mr-2 ${riskConfig[selectedReport.content.riskLevel].color}`} />
                      整体评估: {riskConfig[selectedReport.content.riskLevel].label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedReport.content.summary}
                    </p>
                  </CardContent>
                </Card>
                
                {/* 检查结果 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 正面发现 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-green-700">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        健康状况良好的地方
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedReport.content.findings.positive.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  {/* 需要关注的地方 */}
                  {selectedReport.content.findings.concerns.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-yellow-700">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          需要关注的地方
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedReport.content.findings.concerns.map((item, index) => (
                            <li key={index} className="flex items-start">
                              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {/* 医生建议 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-700">
                      <Stethoscope className="w-5 h-5 mr-2" />
                      医生建议
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedReport.content.findings.recommendations.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                {/* 后续计划 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-700">
                      <Calendar className="w-5 h-5 mr-2" />
                      后续计划
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedReport.content.nextSteps.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <ChevronRight className="w-4 h-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {selectedReport.content.followUpDate && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center text-purple-700">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="font-medium">
                            建议复查时间: {format(new Date(selectedReport.content.followUpDate), 'yyyy年MM月dd日', { locale: zhCN })}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* 操作按钮 */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline">
                    <Mail className="w-4 h-4 mr-1" />
                    发送邮件
                  </Button>
                  <Button variant="outline">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    咨询医生
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    下载PDF
                  </Button>
                  <Button>
                    <Share2 className="w-4 h-4 mr-1" />
                    分享报告
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MedicalLayout>
  )
}
