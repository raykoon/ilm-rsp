'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { DataTable, Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Plus, 
  User,
  Calendar,
  Phone,
  MapPin,
  Activity,
  FileText,
  PlusCircle
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
  address?: string
  status: 'active' | 'inactive'
  createdAt: string
  _count?: {
    examinations: number
  }
}

interface PatientFormData {
  name: string
  gender: 'male' | 'female'
  birthDate: string
  guardianName: string
  guardianPhone: string
  address: string
}

export default function ClinicPatientsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    gender: 'male',
    birthDate: '',
    guardianName: '',
    guardianPhone: '',
    address: ''
  })

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
  const loadPatients = async () => {
    try {
      setLoading(true)
      const response = await api.get('/patients', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery || undefined
        }
      })

      if (response.data.success) {
        setPatients(response.data.data.patients)
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }))
      }
    } catch (error: any) {
      console.error('加载患者列表失败:', error)
      toast.error('加载患者列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    if (user && ['doctor', 'nurse', 'admin'].includes(user.role)) {
      loadPatients()
    }
  }, [user, pagination.page, pagination.limit, searchQuery])

  // 搜索处理
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 分页处理
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'male',
      birthDate: '',
      guardianName: '',
      guardianPhone: '',
      address: ''
    })
  }

  // 创建患者
  const handleCreate = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  // 查看患者详情
  const handleView = (patient: Patient) => {
    // 可以跳转到患者详情页面或者检查记录
    router.push(`/clinic/patients/${patient.id}`)
  }

  // 为患者创建新检查
  const handleNewExamination = (patient: Patient) => {
    router.push(`/clinic/examination/new?patientId=${patient.id}`)
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      
      const response = await api.post('/patients', formData)
      if (response.data.success) {
        toast.success('患者创建成功')
        setShowCreateDialog(false)
        resetForm()
        loadPatients()
      }
    } catch (error: any) {
      console.error('创建患者失败:', error)
      toast.error(error.response?.data?.message || '创建患者失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 计算年龄
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  // 获取性别显示
  const getGenderText = (gender: string) => {
    return gender === 'male' ? '男' : '女'
  }

  // 获取状态显示
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">正常</Badge>
      case 'inactive':
        return <Badge variant="secondary">停用</Badge>
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  // 表格列定义
  const columns: Column<Patient>[] = [
    {
      key: 'name',
      label: '患者信息',
      render: (value, row) => (
        <div>
          <div className="font-medium flex items-center">
            <User className="h-4 w-4 text-gray-400 mr-2" />
            {value}
          </div>
          <div className="text-sm text-gray-500">
            {getGenderText(row.gender)} · {calculateAge(row.birthDate)}岁
          </div>
        </div>
      )
    },
    {
      key: 'guardianName',
      label: '监护人信息',
      render: (value, row) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">{value}</div>
          <div className="flex items-center text-sm text-gray-500">
            <Phone className="h-4 w-4 text-gray-400 mr-1" />
            {row.guardianPhone}
          </div>
        </div>
      )
    },
    {
      key: 'address',
      label: '地址',
      render: (value) => value ? (
        <div className="flex items-center text-sm">
          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
          <span className="truncate max-w-xs">{value}</span>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">未填写</span>
      )
    },
    {
      key: '_count',
      label: '检查次数',
      render: (value) => (
        <div className="flex items-center text-sm">
          <Activity className="h-4 w-4 text-gray-400 mr-1" />
          {value?.examinations || 0} 次
        </div>
      )
    },
    {
      key: 'createdAt',
      label: '建档时间',
      render: (value) => (
        <div className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString('zh-CN')}
        </div>
      )
    },
    {
      key: 'actions',
      label: '操作',
      width: 'w-20'
    }
  ]

  if (!isAuthenticated || !['doctor', 'nurse', 'admin'].includes(user?.role || '')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="h-6 w-6 mr-2" />
                患者管理
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                管理门诊的患者信息和检查记录
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              新建患者
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle>患者列表</CardTitle>
            <CardDescription>
              当前门诊共有 {pagination.total} 位患者
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={patients}
              columns={columns}
              loading={loading}
              searchPlaceholder="搜索患者姓名、监护人..."
              pagination={pagination}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onView={handleView}
              actions={{
                view: true,
                edit: false,
                delete: false,
                custom: [
                  {
                    label: '新建检查',
                    icon: PlusCircle,
                    onClick: handleNewExamination
                  }
                ]
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* 创建对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建患者</DialogTitle>
            <DialogDescription>
              为门诊创建新的患者档案
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">患者姓名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入患者姓名"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">性别 *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: 'male' | 'female') => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="birthDate">出生日期 *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="guardianName">监护人姓名 *</Label>
              <Input
                id="guardianName"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                placeholder="请输入监护人姓名"
                required
              />
            </div>

            <div>
              <Label htmlFor="guardianPhone">监护人电话 *</Label>
              <Input
                id="guardianPhone"
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                placeholder="请输入监护人电话"
                required
              />
            </div>

            <div>
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="请输入地址（可选）"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '创建中...' : '创建患者'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
