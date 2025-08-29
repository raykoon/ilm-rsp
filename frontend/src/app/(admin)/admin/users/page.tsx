'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { DataTable } from '@/components/ui/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail,
  Phone,
  Building2,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  UserCheck,
  UserX
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  username: string
  fullName: string
  role: 'super_admin' | 'admin' | 'doctor' | 'nurse' | 'patient'
  phone?: string
  avatarUrl?: string
  clinicId?: string
  clinicName?: string
  status: 'active' | 'inactive' | 'suspended'
  lastLoginAt?: string
  createdAt: string
}

interface UserStats {
  total: number
  active: number
  inactive: number
  doctors: number
  nurses: number
  admins: number
}

const roleConfig = {
  super_admin: { label: '超级管理员', color: 'bg-purple-500', icon: Shield },
  admin: { label: '门诊管理员', color: 'bg-blue-500', icon: Shield },
  doctor: { label: '医生', color: 'bg-green-500', icon: UserCheck },
  nurse: { label: '护士', color: 'bg-cyan-500', icon: UserCheck },
  patient: { label: '患者', color: 'bg-gray-500', icon: Users }
}

const statusConfig = {
  active: { label: '正常', color: 'bg-green-500' },
  inactive: { label: '未激活', color: 'bg-yellow-500' },
  suspended: { label: '已停用', color: 'bg-red-500' }
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clinicFilter, setClinicFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    fullName: '',
    role: 'doctor',
    phone: '',
    clinicId: '',
    password: ''
  })

  const queryClient = useQueryClient()

  // Mock 用户统计数据
  const mockStats: UserStats = {
    total: 156,
    active: 142,
    inactive: 14,
    doctors: 45,
    nurses: 23,
    admins: 8
  }

  // Mock 用户数据
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'super@admin.com',
      username: 'super',
      fullName: '超级管理员',
      role: 'super_admin',
      phone: '13800138000',
      status: 'active',
      lastLoginAt: new Date().toISOString(),
      createdAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '2',
      email: 'admin@clinic.com',
      username: 'admin',
      fullName: '门诊管理员',
      role: 'admin',
      phone: '13800138001',
      clinicId: 'clinic1',
      clinicName: '口腔专科医院',
      status: 'active',
      lastLoginAt: '2024-01-15T10:30:00Z',
      createdAt: '2023-02-01T00:00:00Z'
    },
    {
      id: '3',
      email: 'doctor@clinic.com',
      username: 'doctor',
      fullName: '张医生',
      role: 'doctor',
      phone: '13800138002',
      clinicId: 'clinic1',
      clinicName: '口腔专科医院',
      status: 'active',
      lastLoginAt: '2024-01-15T14:20:00Z',
      createdAt: '2023-03-01T00:00:00Z'
    },
    {
      id: '4',
      email: 'nurse@clinic.com',
      username: 'nurse',
      fullName: '李护士',
      role: 'nurse',
      phone: '13800138003',
      clinicId: 'clinic1',
      clinicName: '口腔专科医院',
      status: 'active',
      lastLoginAt: '2024-01-15T09:00:00Z',
      createdAt: '2023-04-01T00:00:00Z'
    },
    {
      id: '5',
      email: 'doctor2@clinic2.com',
      username: 'doctor2',
      fullName: '王医生',
      role: 'doctor',
      phone: '13800138004',
      clinicId: 'clinic2',
      clinicName: '儿童口腔诊所',
      status: 'active',
      lastLoginAt: '2024-01-14T16:45:00Z',
      createdAt: '2023-05-01T00:00:00Z'
    }
  ]

  // 获取用户列表 (Mock数据)
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => Promise.resolve(mockUsers),
    staleTime: 5 * 60 * 1000 // 5分钟缓存
  })

  // 获取门诊列表
  const { data: clinics = [] } = useQuery({
    queryKey: ['clinics'],
    queryFn: () => api.get('/clinics').then(res => res.data.data || []),
    initialData: []
  })

  // 创建用户
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => api.post('/users', userData),
    onSuccess: () => {
      toast.success('用户创建成功')
      setShowCreateDialog(false)
      setNewUser({
        email: '',
        username: '',
        fullName: '',
        role: 'doctor',
        phone: '',
        clinicId: '',
        password: ''
      })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => {
      toast.error('用户创建失败')
    }
  })

  // 过滤数据
  const filteredData = users?.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesClinic = clinicFilter === 'all' || user.clinicId === clinicFilter
    
    return matchesSearch && matchesRole && matchesStatus && matchesClinic
  }) || []

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.fullName || !newUser.password) {
      toast.error('请填写必填字段')
      return
    }
    createUserMutation.mutate(newUser)
  }

  const columns = [
    {
      header: '用户信息',
      accessorKey: 'user',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={row.original.avatarUrl} />
            <AvatarFallback>
              {row.original.fullName.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.original.fullName}</div>
            <div className="text-sm text-gray-500">{row.original.username}</div>
          </div>
        </div>
      )
    },
    {
      header: '联系方式',
      accessorKey: 'contact',
      cell: ({ row }: { row: any }) => (
        <div>
          <div className="flex items-center text-sm">
            <Mail className="w-3 h-3 mr-1 text-gray-400" />
            {row.original.email}
          </div>
          {row.original.phone && (
            <div className="flex items-center text-sm text-gray-500">
              <Phone className="w-3 h-3 mr-1 text-gray-400" />
              {row.original.phone}
            </div>
          )}
        </div>
      )
    },
    {
      header: '角色',
      accessorKey: 'role',
      cell: ({ row }: { row: any }) => {
        const role = row.original.role
        const config = roleConfig[role as keyof typeof roleConfig]
        const Icon = config.icon
        return (
          <Badge className={`${config.color} text-white`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        )
      }
    },
    {
      header: '所属门诊',
      accessorKey: 'clinicName',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center">
          {row.original.clinicName ? (
            <>
              <Building2 className="w-3 h-3 mr-1 text-gray-400" />
              <span className="text-sm">{row.original.clinicName}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">未分配</span>
          )}
        </div>
      )
    },
    {
      header: '状态',
      accessorKey: 'status',
      cell: ({ row }: { row: any }) => {
        const status = row.original.status
        const config = statusConfig[status as keyof typeof statusConfig]
        return (
          <Badge className={`${config.color} text-white`}>
            {config.label}
          </Badge>
        )
      }
    },
    {
      header: '最后登录',
      accessorKey: 'lastLoginAt',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm text-gray-600">
          {row.original.lastLoginAt ? 
            format(new Date(row.original.lastLoginAt), 'yyyy-MM-dd HH:mm', { locale: zhCN }) :
            '从未登录'
          }
        </div>
      )
    },
    {
      header: '创建时间',
      accessorKey: 'createdAt',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm text-gray-600">
          {format(new Date(row.original.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
        </div>
      )
    },
    {
      header: '操作',
      id: 'actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Edit className="w-4 h-4 mr-1" />
            编辑
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            <UserX className="w-4 h-4 mr-1" />
            停用
          </Button>
        </div>
      )
    }
  ]

  return (
    <MedicalLayout
      title="用户管理"
      description="系统用户的创建、编辑和权限管理"
    >
      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700">总用户数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{mockStats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700">活跃用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{mockStats.active}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-700">未激活</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{mockStats.inactive}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-700">医生</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{mockStats.doctors}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-700">护士</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-900">{mockStats.nurses}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-indigo-700">管理员</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">{mockStats.admins}</div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选和操作栏 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="flex flex-col lg:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="搜索用户姓名、邮箱或用户名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部角色</SelectItem>
                      <SelectItem value="super_admin">超级管理员</SelectItem>
                      <SelectItem value="admin">门诊管理员</SelectItem>
                      <SelectItem value="doctor">医生</SelectItem>
                      <SelectItem value="nurse">护士</SelectItem>
                      <SelectItem value="patient">患者</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="active">正常</SelectItem>
                      <SelectItem value="inactive">未激活</SelectItem>
                      <SelectItem value="suspended">已停用</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={clinicFilter} onValueChange={setClinicFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="门诊" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部门诊</SelectItem>
                      {clinics?.map((clinic: any) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    新建用户
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>新建用户</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">姓名 *</Label>
                        <Input
                          id="fullName"
                          value={newUser.fullName}
                          onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                          placeholder="输入用户姓名"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">用户名</Label>
                        <Input
                          id="username"
                          value={newUser.username}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          placeholder="输入用户名"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">邮箱 *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="输入邮箱地址"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password">密码 *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="输入初始密码"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role">角色</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="doctor">医生</SelectItem>
                            <SelectItem value="nurse">护士</SelectItem>
                            <SelectItem value="admin">门诊管理员</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">手机号</Label>
                        <Input
                          id="phone"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                          placeholder="输入手机号"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="clinic">所属门诊</Label>
                      <Select value={newUser.clinicId} onValueChange={(value) => setNewUser({...newUser, clinicId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择门诊" />
                        </SelectTrigger>
                        <SelectContent>
                          {clinics?.map((clinic: any) => (
                            <SelectItem key={clinic.id} value={clinic.id}>
                              {clinic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-6">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        取消
                      </Button>
                      <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? '创建中...' : '创建用户'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* 数据表格 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              用户列表
              <Badge variant="secondary" className="ml-2">
                {filteredData.length} 个用户
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={filteredData}
              searchKey="fullName"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </MedicalLayout>
  )
}
