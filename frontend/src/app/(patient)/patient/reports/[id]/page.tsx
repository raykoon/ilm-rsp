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
  Heart,
  Info
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsItem } from '@/components/ui/tabs'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { api } from '@/lib/api'

// 患者友好的简化数据
const mockPatientReport = {
  id: '1',
  title: '我的口腔健康检查报告',
  doctorName: '李医生',
  clinicName: '北京儿童口腔诊所',
  examinationType: '口腔全景检查',
  examDate: '2024年1月15日',
  reportDate: '2024年1月16日',
  overallHealth: '良好',
  healthScore: 85,
  summary: '您的口腔整体状况良好！发现了一些需要注意的地方，按照医生的建议进行治疗和护理，您的口腔会更加健康。',
  keyFindings: [
    {
      title: '需要治疗的牙齿',
      items: [
        { name: '左上大牙', issue: '蛀牙较深', urgency: 'high', description: '需要尽快治疗，避免疼痛' },
        { name: '右下大牙', issue: '小蛀牙', urgency: 'medium', description: '需要补牙，很简单的治疗' }
      ]
    },
    {
      title: '口腔卫生状况',
      items: [
        { name: '牙龈', issue: '轻微发炎', urgency: 'low', description: '加强刷牙即可改善' },
        { name: '牙垢', issue: '少量', urgency: 'low', description: '建议定期洁牙' }
      ]
    }
  ],
  doctorAdvice: [
    '尽快预约治疗左上大牙的深蛀牙',
    '两周内完成右下大牙的补牙',
    '每天认真刷牙两次，每次至少2分钟',
    '使用牙线清洁牙缝',
    '3个月后来复查治疗效果',
    '半年后进行常规口腔检查'
  ],
  careInstructions: {
    daily: [
      '早晚用含氟牙膏刷牙',
      '使用牙线清洁牙缝',
      '饭后漱口'
    ],
    dietary: [
      '减少糖分摄入',
      '多吃富含钙质的食物',
      '避免过硬食物'
    ],
    followUp: [
      '按时复诊',
      '有不适及时就医',
      '定期口腔检查'
    ]
  },
  nextAppointment: '2024年1月30日 上午10:00',
  images: [
    { id: '1', title: 'X光片', description: '显示牙齿和骨骼结构', patientFriendly: true },
    { id: '2', title: '口腔照片', description: '记录治疗前的状况', patientFriendly: true }
  ]
}

export default function PatientReportDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const { data: report = mockPatientReport, isLoading } = useQuery({
    queryKey: ['patient-report', params.id],
    queryFn: () => Promise.resolve(mockPatientReport),
    initialData: mockPatientReport
  })

  const getHealthScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50'
    if (score >= 70) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'low': return 'bg-blue-50 text-blue-700 border-blue-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return AlertCircle
      case 'medium': return Clock
      case 'low': return Info
      default: return Activity
    }
  }

  if (isLoading) {
    return (
      <MedicalLayout title="我的报告" description="加载中...">
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MedicalLayout>
    )
  }

  return (
    <MedicalLayout
      title="我的检查报告"
      description={`${report.examDate} - ${report.examinationType}`}
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
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            下载报告
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
          返回我的报告
        </Button>

        {/* 健康总览 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Heart className="w-6 h-6 mr-2 text-red-500" />
                  {report.title}
                </CardTitle>
                <p className="text-gray-600 text-lg leading-relaxed">{report.summary}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">主治医生</p>
                      <p className="font-medium text-gray-900">{report.doctorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">检查日期</p>
                      <p className="font-medium text-gray-900">{report.examDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 健康评分 */}
          <div className="space-y-4">
            <Card className={`border-2 ${getHealthScoreColor(report.healthScore)}`}>
              <CardHeader className="text-center">
                <CardTitle className="text-lg font-medium">口腔健康评分</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold mb-2">{report.healthScore}</div>
                <div className="text-sm font-medium mb-4">{report.overallHealth}</div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${report.healthScore}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* 下次预约 */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-blue-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  下次预约
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 font-medium">{report.nextAppointment}</p>
                <p className="text-sm text-blue-600 mt-1">记得按时来复查哦！</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 详细内容 - 患者友好的Tab设计 */}
        <Tabs defaultValue="findings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100">
            <TabsItem value="findings" className="data-[state=active]:bg-white">
              检查发现
            </TabsItem>
            <TabsItem value="care" className="data-[state=active]:bg-white">
              护理指导
            </TabsItem>
            <TabsItem value="images" className="data-[state=active]:bg-white">
              检查照片
            </TabsItem>
          </TabsList>

          {/* 检查发现 */}
          <TabsContent value="findings" className="space-y-6">
            {report.keyFindings.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-900">
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.items.map((item, idx) => {
                        const UrgencyIcon = getUrgencyIcon(item.urgency)
                        return (
                          <div key={idx} className="flex items-start space-x-4 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-colors">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${getUrgencyColor(item.urgency)}`}>
                              <UrgencyIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900 text-lg">{item.name}</h4>
                                <Badge variant="outline" className={`border ${getUrgencyColor(item.urgency)}`}>
                                  {item.issue}
                                </Badge>
                              </div>
                              <p className="text-gray-600">{item.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* 医生建议 */}
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-green-800 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  医生的建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.doctorAdvice.map((advice, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-white border border-green-200"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white flex-shrink-0">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{advice}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 护理指导 */}
          <TabsContent value="care" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-blue-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-blue-700 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    每日护理
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.careInstructions.daily.map((instruction, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-blue-800">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-green-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-green-700 flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    饮食建议
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.careInstructions.dietary.map((instruction, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-green-800">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-purple-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-purple-700 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    定期复查
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.careInstructions.followUp.map((instruction, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                        <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-purple-800">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 检查照片 */}
          <TabsContent value="images" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-gray-900">
                        {image.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{image.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <div className="text-center text-gray-500">
                          <Eye className="w-12 h-12 mx-auto mb-3" />
                          <p>检查图像</p>
                          <p className="text-xs">点击查看详细</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setSelectedImage(image.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        查看原图
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MedicalLayout>
  )
}
