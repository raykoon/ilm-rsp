'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Shield,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Key,
  UserCheck,
  Users,
  Stethoscope,
  Building2,
  BarChart3,
  Lock,
  Unlock
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsItem } from '@/components/ui/tabs'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { MedicalCard } from '@/components/ui/medical-card'
import { api } from '@/lib/api'

// 模拟用户详情数据
const mockUser = {
  id: '1',
  username: 'dr_li_ming',
  email: 'li.ming@clinic.com',
  fullName: '李明',
  firstName: '明',
  lastName: '李',
  phone: '+86 138-0000-0001',
  address: '北京市朝阳区医院街123号',
  avatar: null,
  role: 'doctor',
  
  // 账户信息
  status: 'active',
  emailVerified: true,
  phoneVerified: true,
  twoFactorEnabled: true,
  lastLogin: '2024-01-15 14:30:25',
  createdAt: '2023-03-15 09:00:00',
  lastUpdated: '2024-01-10 16:45:30',
  
  // 职业信息
  professional: {
    licenseNumber: 'MD20230315001',
    specialization: '儿童口腔医学',
    experience: '8年',
    education: '北京大学口腔医学院',
    certifications: [
      '口腔医师执业证书',
      '儿童口腔专科医师资格',
      'AI辅助诊疗认证'
    ],
    joinDate: '2023-03-15'
  },

  // 关联机构
  clinics: [
    {
      id: '1',
      name: '北京儿童口腔诊所',
      role: '主治医师',
      department: '口腔科',
      startDate: '2023-03-15',
      status: 'active'
    },
    {
      id: '2', 
      name: '朝阳区口腔医院',
      role: '兼职医师',
      department: '儿科口腔',
      startDate: '2023-06-01',
      status: 'active'
    }
  ],

  // 权限设置
  permissions: {
    system: ['read', 'write'],
    patients: ['read', 'write', 'create'],
    examinations: ['read', 'write', 'create', 'delete'],
    reports: ['read', 'write', 'create'],
    settings: ['read'],
    users: ['read'],
    analytics: ['read']
  },

  // 活动统计
  statistics: {
    totalPatients: 156,
    totalExaminations: 234,
    reportsGenerated: 198,
    loginCount: 89,
    avgSessionDuration: '45分钟',
    lastActivityDate: '2024-01-15'
  },

  // 近期活动
  recentActivities: [
    {
      id: '1',
      action: '创建检查',
      target: '张小明 - 口腔全景检查',
      timestamp: '2024-01-15 14:25',
      ip: '192.168.1.101',
      device: 'Chrome on Windows'
    },
    {
      id: '2',
      action: '生成报告',
      target: '患者ID: P001',
      timestamp: '2024-01-15 11:30',
      ip: '192.168.1.101',
      device: 'Chrome on Windows'
    },
    {
      id: '3',
      action: '登录系统',
      target: '系统登录',
      timestamp: '2024-01-15 09:00',
      ip: '192.168.1.101',
      device: 'Chrome on Windows'
    },
    {
      id: '4',
      action: '更新患者信息',
      target: '李小美 - 基本信息',
      timestamp: '2024-01-14 16:45',
      ip: '192.168.1.101',
      device: 'Chrome on Windows'
    }
  ],

  // 系统设置
  preferences: {
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD',
    notifications: {
      email: true,
      sms: false,
      push: true,
      reports: true,
      appointments: true,
      system: false
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
      statsVisible: true
    }
  }
}

export default function AdminUserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: user = mockUser, isLoading } = useQuery({
    queryKey: ['admin-user', params.id],
    queryFn: () => Promise.resolve(mockUser),
    initialData: mockUser
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'admin': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'doctor': return 'text-green-600 bg-green-50 border-green-200'
      case 'nurse': return 'text-cyan-600 bg-cyan-50 border-cyan-200'
      case 'patient': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'super_admin': return '超级管理员'
      case 'admin': return '管理员'
      case 'doctor': return '医生'
      case 'nurse': return '护士'
      case 'patient': return '患者'
      default: return '未知'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200'
      case 'inactive': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'suspended': return 'text-red-600 bg-red-50 border-red-200'
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃'
      case 'inactive': return '非活跃'
      case 'suspended': return '已暂停'
      case 'pending': return '待激活'
      default: return '未知'
    }
  }

  if (isLoading) {
    return (
      <MedicalLayout title="用户详情" description="加载中...">
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MedicalLayout>
    )
  }

  return (
    <MedicalLayout
      title="用户档案管理"
      description={`${user.fullName} - 完整用户档案和权限管理`}
      headerActions={
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <Lock className="w-4 h-4 mr-2" />
            重置密码
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            权限设置
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑用户
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
          返回用户列表
        </Button>

        {/* 用户基本信息卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
                      <div className="flex items-center space-x-3 text-gray-600 mt-1">
                        <span>@{user.username}</span>
                        <span>•</span>
                        <span>用户ID: U{user.id.padStart(6, '0')}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={`border text-sm ${getRoleColor(user.role)}`}>
                          {getRoleText(user.role)}
                        </Badge>
                        <Badge className={`border text-sm ${getStatusColor(user.status)}`}>
                          {getStatusText(user.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">邮箱</p>
                      <div className="flex items-center space-x-1">
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        {user.emailVerified && <CheckCircle className="w-3 h-3 text-green-500" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">手机号</p>
                      <div className="flex items-center space-x-1">
                        <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                        {user.phoneVerified && <CheckCircle className="w-3 h-3 text-green-500" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">注册时间</p>
                      <p className="text-sm font-medium text-gray-900">{user.createdAt.split(' ')[0]}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">最后登录</p>
                      <p className="text-sm font-medium text-gray-900">{user.lastLogin.split(' ')[0]}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 统计指标卡片 */}
          <div className="space-y-4">
            <MedicalCard
              title="管理患者"
              value={`${user.statistics.totalPatients}`}
              description="负责患者总数"
              icon={Users}
              variant="primary"
            />
            <MedicalCard
              title="检查次数"
              value={`${user.statistics.totalExaminations}`}
              description="执行检查总数"
              icon={Stethoscope}
              variant="secondary"
            />
          </div>
        </div>

        {/* 详细信息tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100">
            <TabsItem value="overview" className="data-[state=active]:bg-white">
              基本信息
            </TabsItem>
            <TabsItem value="professional" className="data-[state=active]:bg-white">
              职业信息
            </TabsItem>
            <TabsItem value="permissions" className="data-[state=active]:bg-white">
              权限管理
            </TabsItem>
            <TabsItem value="activities" className="data-[state=active]:bg-white">
              活动日志
            </TabsItem>
            <TabsItem value="settings" className="data-[state=active]:bg-white">
              系统设置
            </TabsItem>
          </TabsList>

          {/* 基本信息 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 个人信息 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">个人信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">姓名</p>
                      <p className="font-medium text-gray-900">{user.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">用户名</p>
                      <p className="font-medium text-gray-900">@{user.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">角色</p>
                      <Badge className={`border w-fit ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">状态</p>
                      <Badge className={`border w-fit ${getStatusColor(user.status)}`}>
                        {getStatusText(user.status)}
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">联系地址</p>
                    <p className="font-medium text-gray-900">{user.address}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 账户安全 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">账户安全</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">邮箱验证</span>
                    </div>
                    {user.emailVerified ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已验证
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        未验证
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">手机验证</span>
                    </div>
                    {user.phoneVerified ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已验证
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        未验证
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">双重认证</span>
                    </div>
                    {user.twoFactorEnabled ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已启用
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        未启用
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 使用统计 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">使用统计</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-2xl font-bold text-blue-600">{user.statistics.totalPatients}</p>
                      <p className="text-xs text-blue-600">管理患者</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-2xl font-bold text-green-600">{user.statistics.totalExaminations}</p>
                      <p className="text-xs text-green-600">检查次数</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                      <p className="text-2xl font-bold text-purple-600">{user.statistics.reportsGenerated}</p>
                      <p className="text-xs text-purple-600">生成报告</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-2xl font-bold text-amber-600">{user.statistics.loginCount}</p>
                      <p className="text-xs text-amber-600">登录次数</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 关联机构 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">关联机构</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.clinics.map((clinic, index) => (
                      <div key={clinic.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200">
                            <Building2 className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{clinic.name}</p>
                            <p className="text-xs text-gray-500">{clinic.role} • {clinic.department}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          活跃
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 职业信息 */}
          <TabsContent value="professional" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 专业资质 */}
              <Card className="bg-white border-green-200 border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-green-700 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2" />
                    专业资质
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">执业证号</p>
                      <p className="font-medium text-gray-900">{user.professional.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">专业方向</p>
                      <p className="font-medium text-gray-900">{user.professional.specialization}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">从业经验</p>
                      <p className="font-medium text-gray-900">{user.professional.experience}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">入职时间</p>
                      <p className="font-medium text-gray-900">{user.professional.joinDate}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">教育背景</p>
                    <p className="font-medium text-gray-900">{user.professional.education}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 认证证书 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">认证证书</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.professional.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-green-800">{cert}</p>
                          <p className="text-xs text-green-600">已认证</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 权限管理 */}
          <TabsContent value="permissions" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">系统权限</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(user.permissions).map(([module, perms]) => (
                    <div key={module} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">
                        {module === 'system' ? '系统管理' :
                         module === 'patients' ? '患者管理' :
                         module === 'examinations' ? '检查管理' :
                         module === 'reports' ? '报告管理' :
                         module === 'settings' ? '设置管理' :
                         module === 'users' ? '用户管理' :
                         module === 'analytics' ? '数据分析' : module}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((perm) => (
                          <Badge
                            key={perm}
                            variant="outline"
                            className={`text-xs ${
                              perm === 'read' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                              perm === 'write' ? 'border-green-200 text-green-700 bg-green-50' :
                              perm === 'create' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                              perm === 'delete' ? 'border-red-200 text-red-700 bg-red-50' :
                              'border-gray-200 text-gray-700 bg-gray-50'
                            }`}
                          >
                            {perm === 'read' ? '读取' :
                             perm === 'write' ? '编辑' :
                             perm === 'create' ? '创建' :
                             perm === 'delete' ? '删除' : perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 活动日志 */}
          <TabsContent value="activities" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">最近活动</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <span className="text-xs text-gray-500">{activity.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{activity.target}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>IP: {activity.ip}</span>
                          <span>•</span>
                          <span>{activity.device}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 系统设置 */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 偏好设置 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">偏好设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">语言</p>
                      <p className="font-medium text-gray-900">
                        {user.preferences.language === 'zh-CN' ? '简体中文' : user.preferences.language}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">时区</p>
                      <p className="font-medium text-gray-900">{user.preferences.timezone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">日期格式</p>
                      <p className="font-medium text-gray-900">{user.preferences.dateFormat}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 通知设置 */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">通知设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(user.preferences.notifications).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 capitalize">
                        {type === 'email' ? '邮件通知' :
                         type === 'sms' ? '短信通知' :
                         type === 'push' ? '推送通知' :
                         type === 'reports' ? '报告通知' :
                         type === 'appointments' ? '预约通知' :
                         type === 'system' ? '系统通知' : type}
                      </span>
                      {enabled ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          已启用
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                          已禁用
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MedicalLayout>
  )
}
