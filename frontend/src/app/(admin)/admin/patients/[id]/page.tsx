'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  Stethoscope,
  Plus,
  Download,
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

// 模拟患者数据
const mockPatient = {
  id: '1',
  name: '张小明',
  avatar: null,
  dateOfBirth: '2018-06-15',
  age: 5,
  gender: '男',
  phone: '138****8888',
  email: 'parent@example.com',
  address: '北京市朝阳区某某街道123号',
  parentName: '张先生',
  parentPhone: '138-0000-8888',
  guardianRelation: '父亲',
  allergies: ['青霉素', '海鲜'],
  medicalHistory: ['无特殊病史'],
  registrationDate: '2023-03-15',
  lastVisit: '2024-01-15',
  totalVisits: 8,
  assignedDoctor: '李医生',
  assignedClinic: '北京儿童口腔诊所',
  healthStatus: 'good',
  upcomingAppointments: [
    {
      id: '1',
      date: '2024-01-30',
      time: '10:00',
      type: '复查',
      doctor: '李医生',
      status: 'confirmed'
    }
  ],
  recentExaminations: [
    {
      id: '1',
      date: '2024-01-15',
      type: '口腔全景检查',
      doctor: '李医生',
      status: 'completed',
      findings: '发现2颗蛀牙需要治疗',
      priority: 'medium'
    },
    {
      id: '2',
      date: '2023-12-10',
      type: '口腔清洁',
      doctor: '李医生',
      status: 'completed',
      findings: '清洁完成，口腔卫生良好',
      priority: 'low'
    },
    {
      id: '3',
      date: '2023-10-20',
      type: '常规检查',
      doctor: '王医生',
      status: 'completed',
      findings: '无异常发现',
      priority: 'low'
    }
  ],
  healthMetrics: {
    oralHygiene: 85,
    treatmentCompliance: 92,
    riskLevel: 'low',
    lastScore: 87
  },
  treatmentPlan: {
    active: [
      {
        treatment: '上颌左侧第一磨牙根管治疗',
        status: 'pending',
        scheduledDate: '2024-01-25',
        priority: 'high'
      },
      {
        treatment: '下颌右侧第二磨牙补牙',
        status: 'pending',
        scheduledDate: '2024-02-05',
        priority: 'medium'
      }
    ],
    completed: [
      {
        treatment: '口腔清洁',
        completedDate: '2023-12-10',
        result: '成功完成'
      }
    ]
  },
  notes: [
    {
      id: '1',
      date: '2024-01-15',
      author: '李医生',
      content: '患者配合度高，家长非常关注口腔健康。建议加强日常护理指导。'
    },
    {
      id: '2',
      date: '2023-12-10',
      author: '李医生',
      content: '口腔清洁后效果良好，患者刷牙习惯有明显改善。'
    }
  ]
}

export default function AdminPatientDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: patient = mockPatient, isLoading } = useQuery({
    queryKey: ['admin-patient', params.id],
    queryFn: () => Promise.resolve(mockPatient),
    initialData: mockPatient
  })

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200'
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'fair': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'poor': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getHealthStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return '优秀'
      case 'good': return '良好'
      case 'fair': return '一般'
      case 'poor': return '需要关注'
      default: return '未知'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  if (isLoading) {
    return (
      <MedicalLayout title="患者详情" description="加载中...">
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MedicalLayout>
    )
  }

  return (
    <MedicalLayout
      title="患者档案管理"
      description={`${patient.name} - 完整医疗档案`}
      headerActions={
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            导出档案
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Send className="w-4 h-4 mr-2" />
            发送报告
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑档案
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
          返回患者列表
        </Button>

        {/* 患者基本信息卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                      <div className="flex items-center space-x-4 text-gray-600 mt-1">
                        <span>{calculateAge(patient.dateOfBirth)}岁 • {patient.gender}</span>
                        <span>患者ID: P{patient.id.padStart(6, '0')}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`border text-sm ${getHealthStatusColor(patient.healthStatus)}`}>
                    {getHealthStatusText(patient.healthStatus)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">联系电话</p>
                      <p className="text-sm font-medium text-gray-900">{patient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">出生日期</p>
                      <p className="text-sm font-medium text-gray-900">{patient.dateOfBirth}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">主治医生</p>
                      <p className="text-sm font-medium text-gray-900">{patient.assignedDoctor}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">就诊次数</p>
                      <p className="text-sm font-medium text-gray-900">{patient.totalVisits}次</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 健康指标卡片 */}
          <div className="space-y-4">
            <MedicalCard
              title="口腔卫生"
              value={`${patient.healthMetrics.oralHygiene}%`}
              description="综合评估分数"
              icon={Heart}
              trend={{ value: '+5%', isPositive: true }}
              variant="primary"
            />
            <MedicalCard
              title="治疗依从性"
              value={`${patient.healthMetrics.treatmentCompliance}%`}
              description="按时就诊率"
              icon={CheckCircle}
              trend={{ value: '+8%', isPositive: true }}
              variant="secondary"
            />
          </div>
        </div>

        {/* 详细信息tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100">
            <TabsItem value="overview" className="data-[state=active]:bg-white">
              总览
            </TabsItem>
            <TabsItem value="examinations" className="data-[state=active]:bg-white">
              检查记录
            </TabsItem>
            <TabsItem value="treatment" className="data-[state=active]:bg-white">
              治疗计划
            </TabsItem>
            <TabsItem value="appointments" className="data-[state=active]:bg-white">
              预约管理
            </TabsItem>
            <TabsItem value="notes" className="data-[state=active]:bg-white">
              医生备注
            </TabsItem>
          </TabsList>

          {/* 总览 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">姓名</p>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">性别</p>
                      <p className="font-medium text-gray-900">{patient.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">年龄</p>
                      <p className="font-medium text-gray-900">{calculateAge(patient.dateOfBirth)}岁</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">注册时间</p>
                      <p className="font-medium text-gray-900">{patient.registrationDate}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">联系地址</p>
                    <p className="font-medium text-gray-900">{patient.address}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 监护人信息 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">监护人信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">监护人姓名</p>
                      <p className="font-medium text-gray-900">{patient.parentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">关系</p>
                      <p className="font-medium text-gray-900">{patient.guardianRelation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">联系电话</p>
                      <p className="font-medium text-gray-900">{patient.parentPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">电子邮箱</p>
                      <p className="font-medium text-gray-900">{patient.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 过敏史 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">过敏史</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="border-red-200 text-red-700 bg-red-50">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 既往病史 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">既往病史</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {patient.medicalHistory.map((history, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{history}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 检查记录 */}
          <TabsContent value="examinations" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-gray-900">近期检查记录</CardTitle>
                  <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    新建检查
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patient.recentExaminations.map((exam, index) => (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/examinations/${exam.id}`)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200">
                        <Stethoscope className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{exam.type}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={`border ${getPriorityColor(exam.priority)}`}>
                              {exam.priority === 'high' ? '高' : exam.priority === 'medium' ? '中' : '低'}
                            </Badge>
                            <span className="text-sm text-gray-500">{exam.date}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">医生：{exam.doctor}</p>
                        <p className="text-sm text-gray-700">{exam.findings}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 治疗计划 */}
          <TabsContent value="treatment" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 进行中的治疗 */}
              <Card className="bg-white border-amber-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-amber-700 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    进行中的治疗
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patient.treatmentPlan.active.map((treatment, index) => (
                      <div key={index} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-amber-800">{treatment.treatment}</p>
                          <Badge variant="outline" className={`border ${getPriorityColor(treatment.priority)}`}>
                            {treatment.priority === 'high' ? '紧急' : treatment.priority === 'medium' ? '重要' : '普通'}
                          </Badge>
                        </div>
                        <p className="text-sm text-amber-700">预约时间：{treatment.scheduledDate}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 已完成的治疗 */}
              <Card className="bg-white border-green-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-green-700 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    已完成的治疗
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patient.treatmentPlan.completed.map((treatment, index) => (
                      <div key={index} className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <p className="font-medium text-green-800 mb-1">{treatment.treatment}</p>
                        <p className="text-sm text-green-700">完成时间：{treatment.completedDate}</p>
                        <p className="text-sm text-green-600">{treatment.result}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 预约管理 */}
          <TabsContent value="appointments" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-gray-900">即将到来的预约</CardTitle>
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    新建预约
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patient.upcomingAppointments.map((appointment, index) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">{appointment.type}</p>
                          <p className="text-sm text-blue-600">{appointment.date} {appointment.time}</p>
                          <p className="text-sm text-blue-600">医生：{appointment.doctor}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        已确认
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 医生备注 */}
          <TabsContent value="notes" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-gray-900">医生备注</CardTitle>
                  <Button size="sm" className="bg-gray-600 text-white hover:bg-gray-700">
                    <Plus className="w-4 h-4 mr-2" />
                    添加备注
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patient.notes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{note.author}</span>
                        </div>
                        <span className="text-sm text-gray-500">{note.date}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{note.content}</p>
                    </motion.div>
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
