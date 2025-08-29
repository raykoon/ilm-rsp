'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MedicalLayout } from '@/components/Layout/MedicalLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import { 
  Settings,
  Brain,
  Shield,
  Database,
  Mail,
  Bell,
  Cloud,
  Key,
  Server,
  Palette,
  Globe,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface SystemSettings {
  // AI服务配置
  aiService: {
    enabled: boolean
    apiUrl: string
    apiKey: string
    timeout: number
    retryTimes: number
  }
  
  // 系统配置
  system: {
    siteName: string
    siteDescription: string
    maintenanceMode: boolean
    allowRegistration: boolean
    maxFileSize: number
    sessionTimeout: number
  }
  
  // 邮件配置
  email: {
    enabled: boolean
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
  }
  
  // 通知配置
  notification: {
    emailNotification: boolean
    smsNotification: boolean
    pushNotification: boolean
    analysisComplete: boolean
    systemAlert: boolean
  }
  
  // 安全配置
  security: {
    passwordMinLength: number
    passwordComplexity: boolean
    twoFactorAuth: boolean
    loginAttempts: number
    lockoutTime: number
  }
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('ai')
  const [settings, setSettings] = useState<SystemSettings>({
    aiService: {
      enabled: true,
      apiUrl: 'https://openapi-lab.ilmsmile.com.cn',
      apiKey: '',
      timeout: 30,
      retryTimes: 3
    },
    system: {
      siteName: '儿童口腔AI筛查平台',
      siteDescription: '专业的儿童口腔健康AI分析和筛查平台',
      maintenanceMode: false,
      allowRegistration: true,
      maxFileSize: 50,
      sessionTimeout: 7200
    },
    email: {
      enabled: false,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: '儿童口腔AI筛查平台'
    },
    notification: {
      emailNotification: true,
      smsNotification: false,
      pushNotification: true,
      analysisComplete: true,
      systemAlert: true
    },
    security: {
      passwordMinLength: 8,
      passwordComplexity: true,
      twoFactorAuth: false,
      loginAttempts: 5,
      lockoutTime: 900
    }
  })

  const queryClient = useQueryClient()

  // 保存设置
  const saveSettingsMutation = useMutation({
    mutationFn: (settings: SystemSettings) => api.put('/admin/settings', settings),
    onSuccess: () => {
      toast.success('设置保存成功')
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
    onError: () => {
      toast.error('设置保存失败')
    }
  })

  // 测试AI连接
  const testAIConnectionMutation = useMutation({
    mutationFn: () => api.post('/admin/settings/test-ai'),
    onSuccess: () => {
      toast.success('AI服务连接测试成功')
    },
    onError: () => {
      toast.error('AI服务连接失败')
    }
  })

  // 测试邮件配置
  const testEmailMutation = useMutation({
    mutationFn: () => api.post('/admin/settings/test-email'),
    onSuccess: () => {
      toast.success('邮件服务测试成功')
    },
    onError: () => {
      toast.error('邮件服务测试失败')
    }
  })

  const handleSave = () => {
    saveSettingsMutation.mutate(settings)
  }

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  return (
    <MedicalLayout
      title="系统设置"
      description="系统配置、AI服务、安全设置等全局配置管理"
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="ai" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>AI服务</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>系统配置</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>邮件设置</span>
            </TabsTrigger>
            <TabsTrigger value="notification" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>通知配置</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>安全设置</span>
            </TabsTrigger>
          </TabsList>

          {/* AI服务配置 */}
          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-600" />
                  AI服务配置
                  <Badge variant={settings.aiService.enabled ? "default" : "secondary"} className="ml-2">
                    {settings.aiService.enabled ? "已启用" : "已禁用"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">启用AI分析服务</Label>
                    <p className="text-sm text-gray-500">开启后将使用AI服务进行图像分析</p>
                  </div>
                  <Switch
                    checked={settings.aiService.enabled}
                    onCheckedChange={(checked) => updateSettings('aiService', 'enabled', checked)}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ai-url">AI服务地址</Label>
                      <Input
                        id="ai-url"
                        value={settings.aiService.apiUrl}
                        onChange={(e) => updateSettings('aiService', 'apiUrl', e.target.value)}
                        placeholder="https://api.example.com"
                        disabled={!settings.aiService.enabled}
                      />
                    </div>

                    <div>
                      <Label htmlFor="ai-key">API密钥</Label>
                      <Input
                        id="ai-key"
                        type="password"
                        value={settings.aiService.apiKey}
                        onChange={(e) => updateSettings('aiService', 'apiKey', e.target.value)}
                        placeholder="输入API密钥"
                        disabled={!settings.aiService.enabled}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ai-timeout">请求超时 (秒)</Label>
                      <Input
                        id="ai-timeout"
                        type="number"
                        value={settings.aiService.timeout}
                        onChange={(e) => updateSettings('aiService', 'timeout', parseInt(e.target.value))}
                        disabled={!settings.aiService.enabled}
                      />
                    </div>

                    <div>
                      <Label htmlFor="ai-retry">重试次数</Label>
                      <Input
                        id="ai-retry"
                        type="number"
                        value={settings.aiService.retryTimes}
                        onChange={(e) => updateSettings('aiService', 'retryTimes', parseInt(e.target.value))}
                        disabled={!settings.aiService.enabled}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">AI服务说明</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        本平台集成了以下AI分析服务：
                        <br />• 口内照片分类和病变检测
                        <br />• 全景X光片分割分析
                        <br />• 头颅侧位片57点分析
                        <br />• 3D模型降采样和特征计算
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => testAIConnectionMutation.mutate()}
                    disabled={testAIConnectionMutation.isPending || !settings.aiService.enabled}
                    variant="outline"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${testAIConnectionMutation.isPending ? 'animate-spin' : ''}`} />
                    {testAIConnectionMutation.isPending ? '测试中...' : '测试连接'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 系统配置 */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-blue-600" />
                  系统配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="site-name">站点名称</Label>
                      <Input
                        id="site-name"
                        value={settings.system.siteName}
                        onChange={(e) => updateSettings('system', 'siteName', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="site-desc">站点描述</Label>
                      <Textarea
                        id="site-desc"
                        value={settings.system.siteDescription}
                        onChange={(e) => updateSettings('system', 'siteDescription', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-file-size">最大文件上传大小 (MB)</Label>
                      <Input
                        id="max-file-size"
                        type="number"
                        value={settings.system.maxFileSize}
                        onChange={(e) => updateSettings('system', 'maxFileSize', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="session-timeout">会话超时时间 (秒)</Label>
                      <Input
                        id="session-timeout"
                        type="number"
                        value={settings.system.sessionTimeout}
                        onChange={(e) => updateSettings('system', 'sessionTimeout', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">维护模式</Label>
                        <p className="text-sm text-gray-500">开启后用户无法访问系统</p>
                      </div>
                      <Switch
                        checked={settings.system.maintenanceMode}
                        onCheckedChange={(checked) => updateSettings('system', 'maintenanceMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">允许用户注册</Label>
                        <p className="text-sm text-gray-500">允许新用户自主注册账号</p>
                      </div>
                      <Switch
                        checked={settings.system.allowRegistration}
                        onCheckedChange={(checked) => updateSettings('system', 'allowRegistration', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 邮件设置 */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-green-600" />
                  邮件设置
                  <Badge variant={settings.email.enabled ? "default" : "secondary"} className="ml-2">
                    {settings.email.enabled ? "已启用" : "已禁用"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">启用邮件服务</Label>
                    <p className="text-sm text-gray-500">用于发送通知邮件和系统消息</p>
                  </div>
                  <Switch
                    checked={settings.email.enabled}
                    onCheckedChange={(checked) => updateSettings('email', 'enabled', checked)}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="smtp-host">SMTP服务器</Label>
                      <Input
                        id="smtp-host"
                        value={settings.email.smtpHost}
                        onChange={(e) => updateSettings('email', 'smtpHost', e.target.value)}
                        placeholder="smtp.example.com"
                        disabled={!settings.email.enabled}
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtp-port">SMTP端口</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e) => updateSettings('email', 'smtpPort', parseInt(e.target.value))}
                        disabled={!settings.email.enabled}
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtp-user">SMTP用户名</Label>
                      <Input
                        id="smtp-user"
                        value={settings.email.smtpUser}
                        onChange={(e) => updateSettings('email', 'smtpUser', e.target.value)}
                        disabled={!settings.email.enabled}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="smtp-password">SMTP密码</Label>
                      <Input
                        id="smtp-password"
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => updateSettings('email', 'smtpPassword', e.target.value)}
                        disabled={!settings.email.enabled}
                      />
                    </div>

                    <div>
                      <Label htmlFor="from-email">发件人邮箱</Label>
                      <Input
                        id="from-email"
                        type="email"
                        value={settings.email.fromEmail}
                        onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                        disabled={!settings.email.enabled}
                      />
                    </div>

                    <div>
                      <Label htmlFor="from-name">发件人姓名</Label>
                      <Input
                        id="from-name"
                        value={settings.email.fromName}
                        onChange={(e) => updateSettings('email', 'fromName', e.target.value)}
                        disabled={!settings.email.enabled}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => testEmailMutation.mutate()}
                    disabled={testEmailMutation.isPending || !settings.email.enabled}
                    variant="outline"
                  >
                    <Mail className={`w-4 h-4 mr-2`} />
                    {testEmailMutation.isPending ? '发送中...' : '发送测试邮件'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 通知配置 */}
          <TabsContent value="notification">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-orange-600" />
                  通知配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">邮件通知</Label>
                      <p className="text-sm text-gray-500">通过邮件发送系统通知</p>
                    </div>
                    <Switch
                      checked={settings.notification.emailNotification}
                      onCheckedChange={(checked) => updateSettings('notification', 'emailNotification', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">短信通知</Label>
                      <p className="text-sm text-gray-500">通过短信发送重要通知</p>
                    </div>
                    <Switch
                      checked={settings.notification.smsNotification}
                      onCheckedChange={(checked) => updateSettings('notification', 'smsNotification', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">推送通知</Label>
                      <p className="text-sm text-gray-500">浏览器推送通知</p>
                    </div>
                    <Switch
                      checked={settings.notification.pushNotification}
                      onCheckedChange={(checked) => updateSettings('notification', 'pushNotification', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">AI分析完成通知</Label>
                      <p className="text-sm text-gray-500">AI分析完成后自动通知相关人员</p>
                    </div>
                    <Switch
                      checked={settings.notification.analysisComplete}
                      onCheckedChange={(checked) => updateSettings('notification', 'analysisComplete', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">系统警告通知</Label>
                      <p className="text-sm text-gray-500">系统异常和错误警告通知</p>
                    </div>
                    <Switch
                      checked={settings.notification.systemAlert}
                      onCheckedChange={(checked) => updateSettings('notification', 'systemAlert', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 安全设置 */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-red-600" />
                  安全设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="password-length">密码最小长度</Label>
                      <Input
                        id="password-length"
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="login-attempts">登录失败次数限制</Label>
                      <Input
                        id="login-attempts"
                        type="number"
                        value={settings.security.loginAttempts}
                        onChange={(e) => updateSettings('security', 'loginAttempts', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">密码复杂度要求</Label>
                        <p className="text-sm text-gray-500">要求包含大小写字母、数字和特殊字符</p>
                      </div>
                      <Switch
                        checked={settings.security.passwordComplexity}
                        onCheckedChange={(checked) => updateSettings('security', 'passwordComplexity', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="lockout-time">账号锁定时间 (秒)</Label>
                      <Input
                        id="lockout-time"
                        type="number"
                        value={settings.security.lockoutTime}
                        onChange={(e) => updateSettings('security', 'lockoutTime', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">双重验证</Label>
                        <p className="text-sm text-gray-500">启用短信或邮件验证码</p>
                      </div>
                      <Switch
                        checked={settings.security.twoFactorAuth}
                        onCheckedChange={(checked) => updateSettings('security', 'twoFactorAuth', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900">安全建议</h4>
                      <p className="text-sm text-red-700 mt-1">
                        • 定期更新管理员密码
                        <br />• 启用双重验证以提高安全性
                        <br />• 监控异常登录活动
                        <br />• 定期备份系统数据
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 保存按钮 */}
        <div className="flex justify-end space-x-4 sticky bottom-0 bg-white p-4 border-t">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            重置
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveSettingsMutation.isPending ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>
    </MedicalLayout>
  )
}
