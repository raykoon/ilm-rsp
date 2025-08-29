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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Building2, 
  Plus, 
  Users, 
  Activity,
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertCircle
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Clinic {
  id: string
  name: string
  code: string
  address: string
  phone: string
  email: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  _count?: {
    users: number
    patients: number
  }
}

interface ClinicFormData {
  name: string
  code: string
  address: string
  phone: string
  email: string
  description?: string
}

export default function ClinicsManagePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)
  const [deletingClinic, setDeletingClinic] = useState<Clinic | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState<ClinicFormData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    description: ''
  })

  // 权限检查
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'super_admin') {
      router.push('/unauthorized')
      return
    }
  }, [isAuthenticated, user, router])

  // 加载门诊列表
  const loadClinics = async () => {
    try {
      setLoading(true)
      const response = await api.get('/clinics', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery || undefined
        }
      })

      if (response.data.success) {
        setClinics(response.data.data.clinics)
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }))
      }
    } catch (error: any) {
      console.error('加载门诊列表失败:', error)
      toast.error('加载门诊列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadClinics()
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
      code: '',
      address: '',
      phone: '',
      email: '',
      description: ''
    })
    setEditingClinic(null)
  }

  // 创建门诊
  const handleCreate = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  // 编辑门诊
  const handleEdit = (clinic: Clinic) => {
    setFormData({
      name: clinic.name,
      code: clinic.code,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      description: ''
    })
    setEditingClinic(clinic)
    setShowCreateDialog(true)
  }

  // 删除门诊
  const handleDelete = (clinic: Clinic) => {
    setDeletingClinic(clinic)
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!deletingClinic) return

    try {
      setSubmitting(true)
      const response = await api.delete(`/clinics/${deletingClinic.id}`)
      
      if (response.data.success) {
        toast.success('门诊删除成功')
        loadClinics()
      }
    } catch (error: any) {
      console.error('删除门诊失败:', error)
      toast.error(error.response?.data?.message || '删除门诊失败')
    } finally {
      setSubmitting(false)
      setDeletingClinic(null)
    }
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      
      if (editingClinic) {
        // 更新门诊
        const response = await api.put(`/clinics/${editingClinic.id}`, formData)
        if (response.data.success) {
          toast.success('门诊更新成功')
        }
      } else {
        // 创建门诊
        const response = await api.post('/clinics', formData)
        if (response.data.success) {
          toast.success('门诊创建成功')
        }
      }

      setShowCreateDialog(false)
      resetForm()
      loadClinics()
    } catch (error: any) {
      console.error('提交表单失败:', error)
      toast.error(error.response?.data?.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 获取状态显示
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">正常</Badge>
      case 'inactive':
        return <Badge variant="secondary">停用</Badge>
      case 'suspended':
        return <Badge variant="destructive">暂停</Badge>
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  // 表格列定义
  const columns: Column<Clinic>[] = [
    {
      key: 'name',
      label: '门诊名称',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">编号: {row.code}</div>
        </div>
      )
    },
    {
      key: 'address',
      label: '地址',
      render: (value) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'phone',
      label: '联系方式',
      render: (value, row) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Phone className="h-4 w-4 text-gray-400 mr-1" />
            {value}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Mail className="h-4 w-4 text-gray-400 mr-1" />
            {row.email}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: '状态',
      render: (value) => getStatusBadge(value)
    },
    {
      key: '_count',
      label: '统计',
      render: (value) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 text-gray-400 mr-1" />
            {value?.users || 0} 用户
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Activity className="h-4 w-4 text-gray-400 mr-1" />
            {value?.patients || 0} 患者
          </div>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: '创建时间',
      render: (value) => (
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
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

  if (!isAuthenticated || user?.role !== 'super_admin') {
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
                <Building2 className="h-6 w-6 mr-2" />
                门诊管理
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                管理系统中的所有门诊机构
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              新建门诊
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle>门诊列表</CardTitle>
            <CardDescription>
              系统中共有 {pagination.total} 个门诊机构
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={clinics}
              columns={columns}
              loading={loading}
              searchPlaceholder="搜索门诊名称、地址..."
              pagination={pagination}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onEdit={handleEdit}
              onDelete={handleDelete}
              actions={{
                view: false,
                edit: true,
                delete: true
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* 创建/编辑对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClinic ? '编辑门诊' : '新建门诊'}
            </DialogTitle>
            <DialogDescription>
              {editingClinic ? '修改门诊信息' : '创建新的门诊机构'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">门诊名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入门诊名称"
                required
              />
            </div>

            <div>
              <Label htmlFor="code">门诊编号 *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="请输入门诊编号"
                required
              />
            </div>

            <div>
              <Label htmlFor="address">地址 *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="请输入门诊地址"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">联系电话 *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系电话"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">邮箱 *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="请输入邮箱地址"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入门诊描述（可选）"
                rows={3}
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
                {submitting ? '提交中...' : (editingClinic ? '更新' : '创建')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deletingClinic} onOpenChange={() => setDeletingClinic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除门诊</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除门诊 <strong>{deletingClinic?.name}</strong> 吗？
              <br />
              <br />
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                此操作无法撤销，请谨慎操作！
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
