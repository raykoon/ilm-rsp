'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Camera, 
  FileImage, 
  Scan, 
  Brain, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  User,
  Calendar,
  Zap,
  Eye,
  Activity,
  Plus,
  X
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Patient {
  id: string
  name: string
  gender: 'male' | 'female'
  birthDate: string
  guardianName: string
  guardianPhone: string
}

interface ExaminationType {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  aiAnalysis: string[]
  requiredFiles: string[]
  estimatedTime: string
}

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  preview?: string
  category: string
}

const examinationTypes: ExaminationType[] = [
  {
    id: 'oral_photos',
    name: '口内照片筛查',
    description: '通过口内照片进行AI智能分析，检测口腔健康状况',
    icon: Camera,
    color: 'from-blue-500 to-cyan-500',
    aiAnalysis: ['oral_classification', 'lesion_detection'],
    requiredFiles: ['口内正面照', '左侧咬合照', '右侧咬合照'],
    estimatedTime: '5-10分钟'
  },
  {
    id: 'panoramic_xray',
    name: '全景X光分析',
    description: '全景X光片AI分析，全面评估牙齿和颌骨状况',
    icon: Scan,
    color: 'from-purple-500 to-pink-500',
    aiAnalysis: ['panoramic_segmentation'],
    requiredFiles: ['全景X光片'],
    estimatedTime: '3-5分钟'
  },
  {
    id: 'cephalometric',
    name: '头颅侧位片分析',
    description: '头颅侧位X光片分析，评估颌面部发育情况',
    icon: Brain,
    color: 'from-green-500 to-emerald-500',
    aiAnalysis: ['cephalometric_57'],
    requiredFiles: ['头颅侧位X光片'],
    estimatedTime: '8-12分钟'
  },
  {
    id: '3d_model',
    name: '3D模型分析',
    description: '3D口腔模型分析，精确测量和特征计算',
    icon: Activity,
    color: 'from-orange-500 to-red-500',
    aiAnalysis: ['model-downsampling-display', 'model-downsampling-segmentation', 'teeth-features'],
    requiredFiles: ['3D口腔模型文件'],
    estimatedTime: '15-20分钟'
  }
]

export default function NewExaminationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  
  // 表单状态
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedExamType, setSelectedExamType] = useState<ExaminationType | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [examNotes, setExamNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  // 加载患者列表
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await api.get('/patients')
        if (response.data.success) {
          setPatients(response.data.data.patients)
          
          // 如果URL中有patientId，自动选择该患者
          const patientId = searchParams.get('patientId')
          if (patientId) {
            const patient = response.data.data.patients.find((p: Patient) => p.id === patientId)
            if (patient) {
              setSelectedPatient(patient)
              setCurrentStep(2)
            }
          }
        }
      } catch (error) {
        console.error('加载患者列表失败:', error)
      }
    }

    loadPatients()
  }, [searchParams])

  // 文件上传处理
  const handleFileUpload = (files: FileList | null, category: string) => {
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.size > 50 * 1024 * 1024) { // 50MB限制
        toast.error('文件大小不能超过50MB')
        return
      }

      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        category
      }

      // 如果是图片，生成预览
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string
          setUploadedFiles(prev => [...prev, newFile])
        }
        reader.readAsDataURL(file)
      } else {
        setUploadedFiles(prev => [...prev, newFile])
      }
    })
  }

  // 移除文件
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // 提交检查
  const handleSubmit = async () => {
    if (!selectedPatient || !selectedExamType) return

    try {
      setSubmitting(true)

      // 创建检查记录
      const examData = {
        patientId: selectedPatient.id,
        type: selectedExamType.id,
        notes: examNotes,
        files: uploadedFiles.map(f => ({ name: f.name, type: f.type, category: f.category }))
      }

      const response = await api.post('/examinations', examData)
      
      if (response.data.success) {
        toast.success('检查创建成功！AI分析将在后台进行')
        router.push('/clinic/examinations')
      }
    } catch (error: any) {
      console.error('创建检查失败:', error)
      toast.error(error.response?.data?.message || '创建检查失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 步骤组件
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step < currentStep ? <CheckCircle className="h-5 w-5" /> : step}
            </div>
            {step < 4 && (
              <div className={`w-16 h-1 mx-2 ${step < currentStep ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  // 患者选择步骤
  const PatientSelectionStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">选择患者</h2>
        <p className="text-gray-600">选择需要进行口腔筛查的患者</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <Card
            key={patient.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPatient?.id === patient.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedPatient(patient)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                  {patient.name.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-500">
                    {patient.gender === 'male' ? '男' : '女'} · 
                    {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()}岁
                  </p>
                  <p className="text-xs text-gray-400">监护人: {patient.guardianName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // 检查类型选择步骤
  const ExaminationTypeStep = () => (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">选择检查类型</h2>
        <p className="text-gray-600">选择适合的AI筛查类型</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {examinationTypes.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
              selectedExamType?.id === type.id 
                ? 'ring-2 ring-blue-500 shadow-lg transform scale-105' 
                : 'hover:transform hover:scale-102'
            }`}
            onClick={() => setSelectedExamType(type)}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center text-white`}>
                  <type.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>预估时间: {type.estimatedTime}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">AI分析功能:</p>
                  <div className="flex flex-wrap gap-2">
                    {type.aiAnalysis.map((analysis) => (
                      <Badge key={analysis} variant="secondary" className="text-xs">
                        {analysis}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">需要文件:</p>
                  <div className="space-y-1">
                    {type.requiredFiles.map((file) => (
                      <div key={file} className="flex items-center space-x-2 text-xs text-gray-600">
                        <FileImage className="h-3 w-3" />
                        <span>{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // 文件上传步骤
  const FileUploadStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">上传检查文件</h2>
        <p className="text-gray-600">上传 {selectedExamType?.name} 所需的医疗影像文件</p>
      </div>

      <div className="space-y-6">
        {selectedExamType?.requiredFiles.map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Upload className="h-5 w-5 text-blue-500" />
                <span>{category}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.accept = 'image/*,.dcm,.stl,.obj,.ply'
                  input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, category)
                  input.click()
                }}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">点击上传文件</p>
                <p className="text-sm text-gray-400">支持 JPG, PNG, DICOM, STL, OBJ 等格式</p>
              </div>

              {/* 显示已上传的文件 */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedFiles
                  .filter(file => file.category === category)
                  .map((file) => (
                    <div key={file.id} className="relative bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        {file.preview ? (
                          <img src={file.preview} alt={file.name} className="h-12 w-12 object-cover rounded" />
                        ) : (
                          <FileImage className="h-12 w-12 text-gray-400" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* 检查备注 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">检查备注</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="请输入检查相关备注（可选）"
              value={examNotes}
              onChange={(e) => setExamNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // 确认提交步骤
  const ReviewStep = () => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">确认检查信息</h2>
        <p className="text-gray-600">请确认检查信息无误后提交</p>
      </div>

      <div className="space-y-6">
        {/* 患者信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-500" />
              <span>患者信息</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">患者姓名</Label>
                <p className="font-medium">{selectedPatient?.name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">性别年龄</Label>
                <p className="font-medium">
                  {selectedPatient?.gender === 'male' ? '男' : '女'} · 
                  {selectedPatient && new Date().getFullYear() - new Date(selectedPatient.birthDate).getFullYear()}岁
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">监护人</Label>
                <p className="font-medium">{selectedPatient?.guardianName}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">联系电话</Label>
                <p className="font-medium">{selectedPatient?.guardianPhone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 检查类型 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-purple-500" />
              <span>检查类型</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              {selectedExamType && (
                <>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${selectedExamType.color} flex items-center justify-center text-white`}>
                    <selectedExamType.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedExamType.name}</p>
                    <p className="text-sm text-gray-500">{selectedExamType.description}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 上传文件 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileImage className="h-5 w-5 text-green-500" />
              <span>上传文件 ({uploadedFiles.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <FileImage className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {examNotes && (
          <Card>
            <CardHeader>
              <CardTitle>检查备注</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{examNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  if (!isAuthenticated || !['doctor', 'nurse', 'admin'].includes(user?.role || '')) {
    return null
  }

  const headerActions = (
    <div className="flex items-center space-x-3">
      <Badge variant="outline" className="bg-blue-50 text-blue-600">
        步骤 {currentStep}/4
      </Badge>
      <Progress value={(currentStep / 4) * 100} className="w-32" />
    </div>
  )

  return (
    <MedicalLayout
      title="新建筛查"
      subtitle="为患者创建口腔AI智能筛查"
      headerActions={headerActions}
      showSearch={false}
    >
      <div className="flex-1 overflow-auto bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50">
        <div className="container mx-auto px-6 py-8">
          <StepIndicator />

          <div className="mb-8">
            {currentStep === 1 && <PatientSelectionStep />}
            {currentStep === 2 && <ExaminationTypeStep />}
            {currentStep === 3 && <FileUploadStep />}
            {currentStep === 4 && <ReviewStep />}
          </div>

          {/* 底部操作按钮 */}
          <div className="flex justify-between items-center sticky bottom-6 bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 1) {
                  router.back()
                } else {
                  setCurrentStep(prev => prev - 1)
                }
              }}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{currentStep === 1 ? '返回' : '上一步'}</span>
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                {currentStep === 4 
                  ? '确认信息无误后提交'
                  : `完成当前步骤后继续`
                }
              </p>
            </div>

            <Button
              onClick={() => {
                if (currentStep === 4) {
                  handleSubmit()
                } else if (currentStep === 1 && selectedPatient) {
                  setCurrentStep(2)
                } else if (currentStep === 2 && selectedExamType) {
                  setCurrentStep(3)
                } else if (currentStep === 3 && uploadedFiles.length > 0) {
                  setCurrentStep(4)
                }
              }}
              disabled={
                (currentStep === 1 && !selectedPatient) ||
                (currentStep === 2 && !selectedExamType) ||
                (currentStep === 3 && uploadedFiles.length === 0) ||
                submitting
              }
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <span>
                {submitting 
                  ? '提交中...' 
                  : currentStep === 4 
                    ? '提交检查' 
                    : '下一步'
                }
              </span>
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </MedicalLayout>
  )
}
