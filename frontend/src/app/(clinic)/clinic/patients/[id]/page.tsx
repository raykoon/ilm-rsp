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
  User,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  Stethoscope,
  Plus,
  PlusCircle,
  Camera,
  Clipboard
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsItem } from '@/components/ui/tabs'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { MedicalCard } from '@/components/ui/medical-card'
import { api } from '@/lib/api'

// 使用相同的模拟数据，但针对医生角度优化
const mockPatient = {
  id: '1',
  name: '张小明',
  dateOfBirth: '2018-06-15',
  age: 5,
  gender: '男',
  parentName: '张先生',
  parentPhone: '138-0000-8888',
  guardianRelation: '父亲',
  allergies: ['青霉素', '海鲜'],
  medicalHistory: ['无特殊病史'],
  lastVisit: '2024-01-15',
  totalVisits: 8,
  healthStatus: 'good',
  upcomingAppointments: [
    {
      id: '1',
      date: '2024-01-30',
      time: '10:00',
      type: '复查',
      status: 'confirmed',
      notes: '检查上次治疗效果'
    }
  ],
  recentExaminations: [
    {
      id: '1',
      date: '2024-01-15',
      type: '口腔全景检查',
      status: 'completed',
      findings: '发现2颗蛀牙需要治疗',
      priority: 'medium',
      aiAnalysis: '95.2%置信度'
    },
    {
      id: '2',
      date: '2023-12-10',
      type: '口腔清洁',
      status: 'completed',
      findings: '清洁完成，口腔卫生良好',
      priority: 'low',
      aiAnalysis: '良好'
    }
  ],
  healthMetrics: {
    oralHygiene: 85,
    treatmentCompliance: 92,
    riskLevel: 'low',
    painLevel: 2,
    cooperationLevel: 'excellent'
  },
  activeTreatments: [
    {
      id: '1',
      treatment: '上颌左侧第一磨牙根管治疗',
      status: 'scheduled',
      scheduledDate: '2024-01-25',
      priority: 'high',
      estimatedDuration: '60分钟',
      difficulty: 'medium'
    },
    {
      id: '2',
      treatment: '下颌右侧第二磨牙补牙',
      status: 'scheduled',
      scheduledDate: '2024-02-05',
      priority: 'medium',
      estimatedDuration: '30分钟',
      difficulty: 'low'
    }
  ],
  treatmentHistory: [
    {
      id: '1',
      date: '2023-12-10',
      treatment: '口腔清洁',
      result: '成功完成',
      notes: '患者配合度高，效果良好',
      followUp: '3个月后复查'
    }
  ],
  clinicalNotes: [
    {
      id: '1',
      date: '2024-01-15',
      type: '诊断',
      content: '深龋C3，建议根管治疗。患者无明显疼痛症状，家长同意治疗方案。',
      urgent: false
    },
    {
      id: '2',
      date: '2023-12-10',
      type: '治疗',
      content: '口腔清洁完成，指导家长正确刷牙方法。患者配合度高。',
      urgent: false
    }
  ],
  vitalSigns: {
    lastRecorded: '2024-01-15',
    bloodPressure: '正常',
    heartRate: '82 bpm',
    temperature: '36.5°C',
    weight: '18kg',
    height: '110cm'
  }
}

export default function ClinicPatientDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [activeTab, setActiveTab] = useState('clinical')

  const { data: patient = mockPatient, isLoading } = useQuery({
    queryKey: ['clinic-patient', params.id],
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
      <MedicalLayout title="患者档案" description="加载中...">
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MedicalLayout>
    )
  }

  return (
    <MedicalLayout
      title="患者诊疗档案"
      description={`${patient.name} - 临床诊疗管理`}
      headerActions={
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => router.push(`/clinic/examination/new?patientId=${patient.id}`)}
          >
            <Camera className="w-4 h-4 mr-2" />
            新建检查
          </Button>
          <Button
            size="sm"
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() => router.push(`/clinic/patients/${patient.id}/treatment`)}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            制定治疗
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

        {/* 患者基本信息 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                      <div className="flex items-center space-x-4 text-gray-600 mt-1">
                        <span>{calculateAge(patient.dateOfBirth)}岁 • {patient.gender}</span>
                        <span>监护人: {patient.parentName}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{patient.parentPhone}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`border text-sm ${getHealthStatusColor(patient.healthStatus)}`}>
                    {getHealthStatusText(patient.healthStatus)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">就诊次数</p>
                    <p className="text-lg font-semibold text-gray-900">{patient.totalVisits}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <Heart className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">口腔健康</p>
                    <p className="text-lg font-semibold text-gray-900">{patient.healthMetrics.oralHygiene}%</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">配合度</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {patient.healthMetrics.cooperationLevel === 'excellent' ? '优秀' : '良好'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 生命体征卡片 */}
          <div>
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">生命体征</CardTitle>
                <p className="text-sm text-gray-500">记录时间: {patient.vitalSigns.lastRecorded}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">血压</span>
                  <span className="text-sm font-medium text-gray-900">{patient.vitalSigns.bloodPressure}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">心率</span>
                  <span className="text-sm font-medium text-gray-900">{patient.vitalSigns.heartRate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">体温</span>
                  <span className="text-sm font-medium text-gray-900">{patient.vitalSigns.temperature}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">体重</span>
                  <span className="text-sm font-medium text-gray-900">{patient.vitalSigns.weight}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">身高</span>
                  <span className="text-sm font-medium text-gray-900">{patient.vitalSigns.height}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 临床信息tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsItem value="clinical" className="data-[state=active]:bg-white">
              临床信息
            </TabsItem>
            <TabsItem value="treatment" className="data-[state=active]:bg-white">
              治疗管理
            </TabsItem>
            <TabsItem value="examinations" className="data-[state=active]:bg-white">
              检查记录
            </TabsItem>
            <TabsItem value="notes" className="data-[state=active]:bg-white">
              临床备注
            </TabsItem>
          </TabsList>

          {/* 临床信息 */}
          <TabsContent value="clinical" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 过敏信息 */}
              <Card className="bg-white border-red-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-red-700 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    过敏警示
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {patient.allergies.map((allergy, index) => (
                      <div key={index} className="p-2 rounded-lg bg-red-50 border border-red-200">
                        <span className="font-medium text-red-800">{allergy}</span>
                      </div>
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
                      <div key={index} className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-gray-800">{history}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 即将到来的预约 */}
              <Card className="bg-white border-blue-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-blue-700 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    下次预约
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-800">{appointment.type}</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          已确认
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-600">{appointment.date} {appointment.time}</p>
                      {appointment.notes && (
                        <p className="text-sm text-blue-600 mt-1">{appointment.notes}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 健康指标 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">健康指标</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">口腔卫生评分</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${patient.healthMetrics.oralHygiene}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{patient.healthMetrics.oralHygiene}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">治疗依从性</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${patient.healthMetrics.treatmentCompliance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{patient.healthMetrics.treatmentCompliance}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">疼痛水平</span>
                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                      {patient.healthMetrics.painLevel}/10 (轻微)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 治疗管理 */}
          <TabsContent value="treatment" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 待进行的治疗 */}
              <Card className="bg-white border-amber-200 border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-amber-700 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      待进行治疗
                    </CardTitle>
                    <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700">
                      <Plus className="w-4 h-4 mr-2" />
                      新增
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patient.activeTreatments.map((treatment, index) => (
                      <div key={treatment.id} className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-amber-800">{treatment.treatment}</h4>
                          <Badge variant="outline" className={`border ${getPriorityColor(treatment.priority)}`}>
                            {treatment.priority === 'high' ? '紧急' : treatment.priority === 'medium' ? '重要' : '普通'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-amber-700">
                          <span>预约: {treatment.scheduledDate}</span>
                          <span>时长: {treatment.estimatedDuration}</span>
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                            难度: {treatment.difficulty === 'high' ? '高' : treatment.difficulty === 'medium' ? '中' : '低'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 治疗历史 */}
              <Card className="bg-white border-green-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-green-700 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    治疗历史
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patient.treatmentHistory.map((treatment, index) => (
                      <div key={treatment.id} className="p-4 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-green-800">{treatment.treatment}</h4>
                          <span className="text-sm text-green-600">{treatment.date}</span>
                        </div>
                        <p className="text-sm text-green-700 mb-2">{treatment.result}</p>
                        <p className="text-xs text-green-600">{treatment.notes}</p>
                        {treatment.followUp && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                              复查: {treatment.followUp}
                            </Badge>
                          </div>
                        )}
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
                  <CardTitle className="text-lg font-medium text-gray-900">检查记录</CardTitle>
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Camera className="w-4 h-4 mr-2" />
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
                      onClick={() => router.push(`/clinic/examinations/${exam.id}`)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
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
                        <p className="text-sm text-gray-700 mb-1">{exam.findings}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                            AI分析: {exam.aiAnalysis}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 临床备注 */}
          <TabsContent value="notes" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-gray-900">临床备注</CardTitle>
                  <Button size="sm" className="bg-gray-600 text-white hover:bg-gray-700">
                    <Clipboard className="w-4 h-4 mr-2" />
                    添加备注
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patient.clinicalNotes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={
                            note.type === '诊断' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                            note.type === '治疗' ? 'border-green-200 text-green-700 bg-green-50' :
                            'border-gray-200 text-gray-700 bg-gray-50'
                          }>
                            {note.type}
                          </Badge>
                          {note.urgent && (
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              紧急
                            </Badge>
                          )}
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
