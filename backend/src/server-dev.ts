import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'

const app = express()

// 基础中间件
app.use(helmet())
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}))
app.use(compression())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now()
  console.log(`📝 ${req.method} ${req.path}`)
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`✅ ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`)
  })
  
  next()
})

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development',
    version: '1.0.0',
    services: {
      database: 'connected',
      redis: 'connected'
    }
  })
})

// 认证路由
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 登录请求:', req.body)
  
  try {
    const { email, password, username } = req.body
    const loginId = email || username // 支持email或username登录
    
    // 简单的模拟登录验证
    if (loginId && password) {
      res.json({
        success: true,
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: 1,
            username: loginId,
            email: loginId.includes('@') ? loginId : `${loginId}@example.com`,
            role: 'admin',
            name: loginId === 'admin' || loginId.includes('admin') ? '管理员' : '用户'
          }
        },
        message: '登录成功'
      })
    } else {
      res.status(400).json({
        success: false,
        error: '邮箱/用户名和密码不能为空'
      })
    }
  } catch (error) {
    console.error('❌ 登录错误:', error)
    res.status(500).json({
      success: false,
      error: '登录失败'
    })
  }
})

app.post('/api/auth/register', (req, res) => {
  console.log('📝 注册请求:', req.body)
  res.json({
    success: true,
    message: '注册成功'
  })
})

app.post('/api/auth/logout', (req, res) => {
  console.log('👋 登出请求')
  res.json({
    success: true,
    message: '登出成功'
  })
})

// 用户信息路由
app.get('/api/users/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      username: 'admin',
      name: '管理员',
      role: 'admin'
    }
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `接口 ${req.originalUrl} 不存在`
  })
})

// 错误处理中间件
app.use((error: any, req: any, res: any, next: any) => {
  console.error('💥 服务器错误:', error)
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  })
})

// 启动服务器
const PORT = process.env.PORT || 3001

const server = app.listen(PORT, () => {
  console.log('')
  console.log('🚀 ================================')
  console.log('🎯 后端服务启动成功!')
  console.log(`📡 服务地址: http://localhost:${PORT}`)
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`)
  console.log(`🔐 登录接口: http://localhost:${PORT}/api/auth/login`)
  console.log('🚀 ================================')
  console.log('')
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 接收到关闭信号，正在关闭服务器...')
  server.close(() => {
    console.log('✅ 服务器已关闭')
    process.exit(0)
  })
})

export { app }
