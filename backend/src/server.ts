import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

import { config } from '@/config'
import { logger } from '@/utils/logger'
import { connectDatabase } from '@/config/database'
import { connectRedis } from '@/config/redis'
import { errorHandler } from '@/middleware/errorHandler'
import { requestLogger } from '@/middleware/requestLogger'
import { authMiddleware } from '@/middleware/auth'

// 路由导入
import authRoutes from '@/routes/auth'
import userRoutes from '@/routes/users'
import clinicRoutes from '@/routes/clinics'
import examinationRoutes from '@/routes/examinations'
import reportRoutes from '@/routes/reports'
import uploadRoutes from '@/routes/upload'
import statsRoutes from '@/routes/stats'

const app = express()

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS配置
app.use(cors({
  origin: function (origin, callback) {
    // 允许的源
    const allowedOrigins = config.cors.origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('不被CORS策略允许'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}))

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制每个IP 15分钟内最多1000个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// 严格限流的API（登录、注册等）
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 限制每个IP 15分钟内最多10次
  message: {
    error: '尝试次数过多，请稍后再试'
  },
})

// 基础中间件
app.use(compression())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 请求日志
app.use(requestLogger)

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0',
    database: 'connected',
    redis: 'connected'
  })
})

// API路由
app.use('/api/auth', strictLimiter, authRoutes)
app.use('/api/users', authMiddleware, userRoutes)
app.use('/api/clinics', authMiddleware, clinicRoutes)
app.use('/api/examinations', authMiddleware, examinationRoutes)
app.use('/api/reports', authMiddleware, reportRoutes)
app.use('/api/upload', authMiddleware, uploadRoutes)
app.use('/api/stats', authMiddleware, statsRoutes)

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `接口 ${req.originalUrl} 不存在`
  })
})

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDatabase()
    logger.info('数据库连接成功')

    // 连接Redis
    await connectRedis()
    logger.info('Redis连接成功')

    // 启动HTTP服务器
    const server = app.listen(config.port, () => {
      logger.info(`服务器启动成功 - http://localhost:${config.port}`)
      logger.info(`环境: ${config.env}`)
    })

    // 优雅关闭处理
    const gracefulShutdown = (signal: string) => {
      logger.info(`接收到 ${signal} 信号，开始优雅关闭...`)
      
      server.close((err) => {
        if (err) {
          logger.error('HTTP服务器关闭失败:', err)
          process.exit(1)
        }
        
        logger.info('HTTP服务器已关闭')
        process.exit(0)
      })
    }

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    // 未捕获的异常处理
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error)
      process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', { reason, promise })
      process.exit(1)
    })

  } catch (error) {
    logger.error('服务器启动失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  startServer()
}

export { app }
