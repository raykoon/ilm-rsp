'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Download,
  Share2,
  Eye,
  Calendar,
  User,
  Stethoscope,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Camera,
  Cpu,
  BarChart3,
  Zap,
  Image as ImageIcon,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsItem } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { MedicalCard } from '@/components/ui/medical-card'
import { api } from '@/lib/api'

// 模拟检查详情数据
const mockExamination = {
  id: '1',
  title: '口腔全景AI检查分析',
  patientName: '张小明',
  patientId: 'P001',
  doctorName: '李医生',
  clinicName: '北京儿童口腔诊所',
  examDate: '2024-01-15',
  examTime: '14:30',
  status: 'completed',
  priority: 'medium',
  type: 'panoramic_xray',
  typeName: '全景X光检查',
  duration: '45分钟',
  
  // AI分析结果
  aiAnalysis: {
    processingTime: '2.3秒',
    confidence: 95.2,
    algorithm: 'DeepTooth-CNN v3.2',
    version: '2024.1.15',
    status: 'completed',
    
    detections: [
      {
        id: '1',
        category: '蛀牙检测',
        position: '上颌左侧第一磨牙',
        confidence: 94.8,
        severity: 'high',
        coordinates: { x: 320, y: 240, width: 45, height: 38 },
        description: '深度龋洞，建议根管治疗'
      },
      {
        id: '2', 
        category: '蛀牙检测',
        position: '下颌右侧第二磨牙',
        confidence: 87.3,
        severity: 'medium',
        coordinates: { x: 480, y: 360, width: 32, height: 28 },
        description: '浅层龋洞，建议补牙治疗'
      },
      {
        id: '3',
        category: '牙龈炎症',
        position: '上颌前牙区',
        confidence: 76.5,
        severity: 'low',
        coordinates: { x: 400, y: 180, width: 80, height: 25 },
        description: '轻度牙龈炎症，建议加强清洁'
      }
    ],
    
    metrics: {
      totalTeethAnalyzed: 20,
      healthyTeeth: 17,
      affectedTeeth: 3,
      overallScore: 78,
      riskLevel: 'medium'
    }
  },

  // 检查图像
  images: [
    {
      id: '1',
      title: '全景X光片',
      type: 'xray',
      url: '/api/placeholder/800/600',
      thumbnail: '/api/placeholder/200/150',
      annotations: [
        { id: '1', x: 320, y: 240, width: 45, height: 38, label: '深龋', severity: 'high' },
        { id: '2', x: 480, y: 360, width: 32, height: 28, label: '浅龋', severity: 'medium' }
      ]
    },
    {
      id: '2',
      title: 'AI分析结果图',
      type: 'analysis',
      url: '/api/placeholder/800/600',
      thumbnail: '/api/placeholder/200/150',
      annotations: []
    },
    {
      id: '3',
      title: '牙齿标注图',
      type: 'annotation',
      url: '/api/placeholder/800/600',
      thumbnail: '/api/placeholder/200/150',
      annotations: []
    }
  ],

  // 检查参数
  parameters: {
    exposure: '70kV, 8mA',
    duration: '0.8s',
    filter: '2.5mm Al',
    collimation: '10cm x 12cm',
    patientPosition: '站立位',
    imageQuality: '优秀'
  },

  // 临床发现
  findings: {
    primary: [
      {
        category: '牙齿疾病',
        items: [
          { tooth: '上颌左侧第一磨牙', condition: '深龋C3', severity: 'high', aiConfidence: 94.8 },
          { tooth: '下颌右侧第二磨牙', condition: '浅龋C2', severity: 'medium', aiConfidence: 87.3 }
        ]
      }
    ],
    secondary: [
      {
        category: '牙周状况',
        items: [
          { area: '上颌前牙区', condition: '轻度牙龈炎', severity: 'low', aiConfidence: 76.5 }
        ]
      }
    ]
  },

  // 医生诊断
  diagnosis: {
    primary: '多发性龋齿',
    secondary: ['轻度牙龈炎'],
    icd10: 'K02.9',
    severity: 'medium',
    recommendations: [
      '立即进行上颌左侧第一磨牙根管治疗',
      '2周内完成下颌右侧第二磨牙补牙',
      '加强口腔卫生护理',
      '3个月后复查'
    ]
  },

  // 处理流程
  workflow: [
    { step: 1, name: '图像获取', status: 'completed', timestamp: '14:30', duration: '5分钟' },
    { step: 2, name: '图像预处理', status: 'completed', timestamp: '14:35', duration: '1分钟' },
    { step: 3, name: 'AI分析处理', status: 'completed', timestamp: '14:36', duration: '2.3秒' },
    { step: 4, name: '结果验证', status: 'completed', timestamp: '14:37', duration: '3分钟' },
    { step: 5, name: '报告生成', status: 'completed', timestamp: '14:40', duration: '2分钟' },
    { step: 6, name: '医生审核', status: 'completed', timestamp: '14:55', duration: '15分钟' }
  ]
}

export default function AdminExaminationDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showAnnotations, setShowAnnotations] = useState(true)

  const { data: examination = mockExamination, isLoading } = useQuery({
    queryKey: ['admin-examination', params.id],
    queryFn: () => Promise.resolve(mockExamination),
    initialData: mockExamination
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200'
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'failed': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'in_progress': return '进行中'
      case 'pending': return '待处理'
      case 'failed': return '失败'
      default: return '未知'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return AlertCircle
      case 'medium': return Clock
      case 'low': return CheckCircle
      default: return Activity
    }
  }

  if (isLoading) {
    return (
      <MedicalLayout title="检查详情" description="加载中...">
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MedicalLayout>
    )
  }

  return (
    <MedicalLayout
      title="检查详情管理"
      description={`${examination.patientName} - ${examination.title}`}
      headerActions={
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            分享结果
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑检查
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            导出报告
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回检查列表
        </Button>

        {/* 检查基本信息 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {examination.title}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-gray-600 mt-2">
                      <span>检查ID: EX{examination.id.padStart(6, '0')}</span>
                      <span>耗时: {examination.duration}</span>
                    </div>
                  </div>
                  <Badge className={`border ${getStatusColor(examination.status)}`}>
                    {getStatusText(examination.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">患者</p>
                      <p className="text-sm font-medium text-gray-900">{examination.patientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">医生</p>
                      <p className="text-sm font-medium text-gray-900">{examination.doctorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">检查日期</p>
                      <p className="text-sm font-medium text-gray-900">{examination.examDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">检查时间</p>
                      <p className="text-sm font-medium text-gray-900">{examination.examTime}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI分析概要 */}
          <div>
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-blue-800 flex items-center">
                  <Cpu className="w-5 h-5 mr-2" />
                  AI分析结果
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-900 mb-1">
                    {examination.aiAnalysis.confidence}%
                  </div>
                  <p className="text-sm text-blue-600">分析置信度</p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">处理时间</span>
                    <span className="text-sm font-medium text-blue-900">{examination.aiAnalysis.processingTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">算法版本</span>
                    <span className="text-sm font-medium text-blue-900">{examination.aiAnalysis.algorithm}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">检测项目</span>
                    <span className="text-sm font-medium text-blue-900">{examination.aiAnalysis.detections.length}个</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 详细分析结果 */}
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100">
            <TabsItem value="analysis" className="data-[state=active]:bg-white">
              AI分析
            </TabsItem>
            <TabsItem value="images" className="data-[state=active]:bg-white">
              检查图像
            </TabsItem>
            <TabsItem value="findings" className="data-[state=active]:bg-white">
              临床发现
            </TabsItem>
            <TabsItem value="workflow" className="data-[state=active]:bg-white">
              处理流程
            </TabsItem>
            <TabsItem value="parameters" className="data-[state=active]:bg-white">
              检查参数
            </TabsItem>
          </TabsList>

          {/* AI分析结果 */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-900">AI检测结果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {examination.aiAnalysis.detections.map((detection, index) => {
                        const SeverityIcon = getSeverityIcon(detection.severity)
                        return (
                          <motion.div
                            key={detection.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 border border-gray-200"
                          >
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 border ${getSeverityColor(detection.severity)}`}>
                              <SeverityIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{detection.category}</h4>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs border-gray-300">
                                    {detection.confidence}%
                                  </Badge>
                                  <Badge variant="outline" className={`border ${getSeverityColor(detection.severity)}`}>
                                    {detection.severity === 'high' ? '严重' : detection.severity === 'medium' ? '中等' : '轻微'}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">位置：{detection.position}</p>
                              <p className="text-sm text-gray-700">{detection.description}</p>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI分析指标 */}
              <div className="space-y-4">
                <MedicalCard
                  title="总体健康评分"
                  value={`${examination.aiAnalysis.metrics.overallScore}`}
                  description="AI综合评估分数"
                  icon={BarChart3}
                  variant="primary"
                >
                  <Progress value={examination.aiAnalysis.metrics.overallScore} className="w-full" />
                </MedicalCard>

                <MedicalCard
                  title="分析牙齿"
                  value={`${examination.aiAnalysis.metrics.totalTeethAnalyzed}`}
                  description="检测牙齿总数"
                  icon={Activity}
                  variant="secondary"
                />

                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-900">检测统计</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">健康牙齿</span>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        {examination.aiAnalysis.metrics.healthyTeeth}颗
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">异常牙齿</span>
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        {examination.aiAnalysis.metrics.affectedTeeth}颗
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">风险等级</span>
                      <Badge variant="outline" className={`border ${
                        examination.aiAnalysis.metrics.riskLevel === 'high' ? 'border-red-200 text-red-700 bg-red-50' :
                        examination.aiAnalysis.metrics.riskLevel === 'medium' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                        'border-blue-200 text-blue-700 bg-blue-50'
                      }`}>
                        {examination.aiAnalysis.metrics.riskLevel === 'high' ? '高风险' :
                         examination.aiAnalysis.metrics.riskLevel === 'medium' ? '中等风险' : '低风险'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* 检查图像 */}
          <TabsContent value="images" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">检查图像</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className={showAnnotations ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showAnnotations ? '隐藏标注' : '显示标注'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {examination.images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedImage(image.id)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {image.title}
                      </CardTitle>
                      <Badge variant="outline" className="w-fit text-xs">
                        {image.type === 'xray' ? 'X光片' : 
                         image.type === 'analysis' ? 'AI分析' : 
                         image.type === 'annotation' ? '标注图' : '其他'}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4 relative">
                        <div className="text-center text-gray-500">
                          <Eye className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">点击查看详细</p>
                        </div>
                        
                        {showAnnotations && image.annotations.length > 0 && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                              {image.annotations.length}个标注
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        下载图像
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* 临床发现 */}
          <TabsContent value="findings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 主要发现 */}
              <Card className="bg-white border-red-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-red-700 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    主要发现
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {examination.findings.primary.map((category, index) => (
                      <div key={index}>
                        <h4 className="font-medium text-red-800 mb-3">{category.category}</h4>
                        <div className="space-y-3">
                          {category.items.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-red-50 border border-red-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-red-800">{item.tooth}</span>
                                <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                                  AI: {item.aiConfidence}%
                                </Badge>
                              </div>
                              <p className="text-sm text-red-700">{item.condition}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 次要发现 */}
              <Card className="bg-white border-blue-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-blue-700 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    次要发现
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {examination.findings.secondary.map((category, index) => (
                      <div key={index}>
                        <h4 className="font-medium text-blue-800 mb-3">{category.category}</h4>
                        <div className="space-y-3">
                          {category.items.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-blue-800">{item.area}</span>
                                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                  AI: {item.aiConfidence}%
                                </Badge>
                              </div>
                              <p className="text-sm text-blue-700">{item.condition}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 医生诊断 */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  医生诊断与建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">诊断结果</h4>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="font-medium text-gray-800">主要诊断: {examination.diagnosis.primary}</p>
                        <p className="text-sm text-gray-600">ICD-10: {examination.diagnosis.icd10}</p>
                      </div>
                      {examination.diagnosis.secondary.map((diagnosis, index) => (
                        <div key={index} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <p className="text-sm text-gray-800">次要诊断: {diagnosis}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">治疗建议</h4>
                    <div className="space-y-2">
                      {examination.diagnosis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 rounded-lg bg-green-50 border border-green-200">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium">{index + 1}</span>
                          </div>
                          <p className="text-sm text-green-800">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 处理流程 */}
          <TabsContent value="workflow" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">检查处理流程</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {examination.workflow.map((step, index) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${
                        step.status === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="font-medium">{step.step}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{step.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {step.timestamp}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-700 text-xs">
                              {step.duration}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 检查参数 */}
          <TabsContent value="parameters" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">检查参数设置</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">X光参数</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-sm text-gray-600">曝光参数</span>
                        <span className="text-sm font-medium text-gray-900">{examination.parameters.exposure}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-sm text-gray-600">曝光时间</span>
                        <span className="text-sm font-medium text-gray-900">{examination.parameters.duration}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-sm text-gray-600">过滤器</span>
                        <span className="text-sm font-medium text-gray-900">{examination.parameters.filter}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">检查设置</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-sm text-gray-600">准直范围</span>
                        <span className="text-sm font-medium text-gray-900">{examination.parameters.collimation}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-sm text-gray-600">患者体位</span>
                        <span className="text-sm font-medium text-gray-900">{examination.parameters.patientPosition}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-sm text-gray-600">图像质量</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          {examination.parameters.imageQuality}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MedicalLayout>
  )
}
