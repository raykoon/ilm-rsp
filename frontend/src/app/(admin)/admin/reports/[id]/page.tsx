'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Download,
  Share2,
  Eye,
  Calendar,
  User,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Printer,
  Send
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsItem } from '@/components/ui/tabs'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { MedicalCard } from '@/components/ui/medical-card'
import { api } from '@/lib/api'

// 模拟报告数据
const mockReport = {
  id: '1',
  title: '口腔全景检查报告',
  patientName: '张小明',
  patientId: 'P001',
  doctorName: '李医生',
  clinicName: '北京儿童口腔诊所',
  examinationType: '口腔全景检查',
  examDate: '2024-01-15',
  reportDate: '2024-01-16',
  status: 'completed',
  priority: 'normal',
  summary: '患者口腔整体状况良好，发现2颗蛀牙需要治疗，建议定期复查。',
  findings: [
    {
      category: '牙齿状况',
      items: [
        { name: '上颌左侧第一磨牙', result: '深龋', severity: 'high', recommendation: '需要根管治疗' },
        { name: '下颌右侧第二磨牙', result: '浅龋', severity: 'medium', recommendation: '补牙治疗' },
        { name: '其他牙齿', result: '正常', severity: 'low', recommendation: '保持良好口腔卫生' }
      ]
    },
    {
      category: '牙龈状况',
      items: [
        { name: '牙龈炎症', result: '轻度', severity: 'medium', recommendation: '加强刷牙和使用牙线' },
        { name: '牙石沉积', result: '少量', severity: 'low', recommendation: '定期洁牙' }
      ]
    },
    {
      category: 'AI分析结果',
      items: [
        { name: '蛀牙识别准确率', result: '95.2%', severity: 'low', recommendation: '系统识别可信度高' },
        { name: '牙齿排列分析', result: '轻度不齐', severity: 'low', recommendation: '可考虑矫正治疗' }
      ]
    }
  ],
  images: [
    { id: '1', title: '口腔全景X光片', url: '/api/placeholder/400/300', type: 'xray' },
    { id: '2', title: '上颌照片', url: '/api/placeholder/400/300', type: 'photo' },
    { id: '3', title: '下颌照片', url: '/api/placeholder/400/300', type: 'photo' },
    { id: '4', title: 'AI分析结果图', url: '/api/placeholder/400/300', type: 'analysis' }
  ],
  recommendations: [
    '立即安排上颌左侧第一磨牙根管治疗',
    '2周内完成下颌右侧第二磨牙补牙',
    '加强日常口腔护理，每天刷牙2次',
    '使用牙线清洁牙缝',
    '3个月后复查，评估治疗效果',
    '半年后进行全面口腔检查'
  ],
  treatmentPlan: {
    immediate: ['根管治疗（上颌左侧第一磨牙）', '补牙治疗（下颌右侧第二磨牙）'],
    shortTerm: ['口腔卫生指导', '定期洁牙'],
    longTerm: ['定期复查', '预防性护理']
  }
}

export default function ReportDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // 在实际应用中，这里会根据ID从API获取报告数据
  const { data: report = mockReport, isLoading } = useQuery({
    queryKey: ['report', params.id],
    queryFn: () => Promise.resolve(mockReport),
    initialData: mockReport
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'draft': return 'bg-gray-50 text-gray-700 border-gray-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'pending': return '待完成'
      case 'draft': return '草稿'
      default: return '未知'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
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
      <MedicalLayout title="报告详情" description="加载中...">
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MedicalLayout>
    )
  }

  return (
    <MedicalLayout
      title="报告详情"
      description={`${report.patientName} - ${report.title}`}
      headerActions={
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            分享
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4 mr-2" />
            打印
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            下载
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
          返回
        </Button>

        {/* 报告基本信息 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {report.title}
                    </CardTitle>
                    <p className="text-gray-600 mt-2">{report.summary}</p>
                  </div>
                  <Badge className={`border ${getStatusColor(report.status)}`}>
                    {getStatusText(report.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">患者姓名</p>
                      <p className="text-sm font-medium text-gray-900">{report.patientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">检查日期</p>
                      <p className="text-sm font-medium text-gray-900">{report.examDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">报告日期</p>
                      <p className="text-sm font-medium text-gray-900">{report.reportDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">检查类型</p>
                      <p className="text-sm font-medium text-gray-900">{report.examinationType}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 快捷操作 */}
          <div>
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Send className="w-4 h-4 mr-2" />
                  发送给患者
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  预览打印
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  生成PDF
                </Button>
                <Separator />
                <div className="text-xs text-gray-500 space-y-1">
                  <p>医生：{report.doctorName}</p>
                  <p>机构：{report.clinicName}</p>
                  <p>患者ID：{report.patientId}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 详细内容 */}
        <Tabs defaultValue="findings" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsItem value="findings" className="data-[state=active]:bg-white">
              检查结果
            </TabsItem>
            <TabsItem value="images" className="data-[state=active]:bg-white">
              影像资料
            </TabsItem>
            <TabsItem value="recommendations" className="data-[state=active]:bg-white">
              治疗建议
            </TabsItem>
            <TabsItem value="plan" className="data-[state=active]:bg-white">
              治疗计划
            </TabsItem>
          </TabsList>

          {/* 检查结果 */}
          <TabsContent value="findings" className="space-y-6">
            {report.findings.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-900">
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.items.map((item, idx) => {
                        const SeverityIcon = getSeverityIcon(item.severity)
                        return (
                          <div key={idx} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 border ${getSeverityColor(item.severity)}`}>
                              <SeverityIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                <Badge variant="outline" className={`border ${getSeverityColor(item.severity)}`}>
                                  {item.result}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{item.recommendation}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          {/* 影像资料 */}
          <TabsContent value="images" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {report.images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedImage(image.id)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-900">
                        {image.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <Eye className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">点击查看</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* 治疗建议 */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">
                  医生建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.recommendations.map((recommendation, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white flex-shrink-0">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-800">{recommendation}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 治疗计划 */}
          <TabsContent value="plan" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-red-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-red-700 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    立即治疗
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.treatmentPlan.immediate.map((item, index) => (
                      <div key={index} className="p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm font-medium text-red-800">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-amber-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-amber-700 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    短期计划
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.treatmentPlan.shortTerm.map((item, index) => (
                      <div key={index} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-sm font-medium text-amber-800">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-green-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-green-700 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    长期维护
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.treatmentPlan.longTerm.map((item, index) => (
                      <div key={index} className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-sm font-medium text-green-800">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MedicalLayout>
  )
}
