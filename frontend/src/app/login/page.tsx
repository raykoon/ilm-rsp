'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  UserCircle2, 
  Stethoscope, 
  Shield, 
  Eye, 
  EyeOff,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface UserRole {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  defaultCredentials: {
    email: string
    password: string
  }
}

const userRoles: UserRole[] = [
  {
    id: 'doctor',
    name: '医生',
    description: '诊断检查、报告分析、患者管理',
    icon: Stethoscope,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-200 hover:border-green-300',
    defaultCredentials: {
      email: 'doctor@clinic.com',
      password: 'doctor123'
    }
  },
  {
    id: 'patient',
    name: '患者',
    description: '查看检查报告、健康档案管理',
    icon: UserCircle2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-200 hover:border-blue-300',
    defaultCredentials: {
      email: 'patient@example.com',
      password: 'patient123'
    }
  },
  {
    id: 'admin',
    name: '管理员',
    description: '系统管理、用户权限、数据统计',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    borderColor: 'border-purple-200 hover:border-purple-300',
    defaultCredentials: {
      email: 'super@admin.com',
      password: 'admin123'
    }
  }
]

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      toast.success('登录成功！')
      
      // 根据用户角色跳转到对应的页面
      if (data.email.includes('admin')) {
        router.push('/admin')
      } else if (data.email.includes('doctor')) {
        router.push('/clinic')
      } else if (data.email.includes('patient')) {
        router.push('/patient')
      } else {
        router.push('/')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '登录失败，请检查您的凭据')
    }
  }

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setValue('email', role.defaultCredentials.email)
    setValue('password', role.defaultCredentials.password)
  }

  const handleBack = () => {
    setSelectedRole(null)
    setValue('email', '')
    setValue('password', '')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {!selectedRole ? (
            // 角色选择页面
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Logo和标题 */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4"
                >
                  <BarChart3 className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  儿童口腔AI筛查平台
                </h1>
                <p className="text-gray-600">
                  请选择您的身份以继续
                </p>
              </div>

              {/* 角色选择卡片 */}
              <div className="space-y-3">
                {userRoles.map((role, index) => (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${role.borderColor} ${role.bgColor}`}
                      onClick={() => handleRoleSelect(role)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200">
                              <role.icon className={`w-6 h-6 ${role.color}`} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {role.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {role.description}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* 底部提示 */}
              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500">
                  选择角色后将自动填入测试账号密码
                </p>
              </div>
            </motion.div>
          ) : (
            // 登录表单页面
            <motion.div
              key="login-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardHeader className="text-center pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      返回
                    </Button>
                    <div className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200">
                        <selectedRole.icon className={`w-5 h-5 ${selectedRole.color}`} />
                      </div>
                      <span className="text-gray-900 font-medium">{selectedRole.name}登录</span>
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    欢迎回来
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    请输入您的账号信息以登录系统
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* 邮箱输入 */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">邮箱地址</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="请输入邮箱地址"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        {...register('email')}
                      />
                      {errors.email && (
                        <p className="text-red-600 text-sm">{errors.email.message}</p>
                      )}
                    </div>

                    {/* 密码输入 */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700">密码</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="请输入密码"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                          {...register('password')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-red-600 text-sm">{errors.password.message}</p>
                      )}
                    </div>

                    {/* 测试账号提示 */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 text-sm">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        测试账号已自动填入，点击登录即可体验
                      </p>
                    </div>

                    {/* 登录按钮 */}
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>登录中...</span>
                        </div>
                      ) : (
                        `以${selectedRole.name}身份登录`
                      )}
                    </Button>
                  </form>

                  {/* 底部链接 */}
                  <div className="mt-6 text-center space-y-2">
                    <p className="text-xs text-gray-500">
                      登录即表示您同意我们的服务条款和隐私政策
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}