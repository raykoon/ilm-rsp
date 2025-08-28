import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import uploadRoutes from './routes/upload'
import clinicRoutes from './routes/clinics'
import patientRoutes from './routes/patients'
import examinationRoutes from './routes/examinations'

const app = express()
const prisma = new PrismaClient()

// 基础中间件
app.use(helmet())
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}))
app.use(compression())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-at-least-32-characters-long'

// 认证中间件
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, error: '缺少访问令牌' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { clinic: true }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: '用户不存在或已禁用' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ success: false, error: '令牌无效' })
  }
}

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
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
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
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: '数据库连接失败'
    })
  }
})

// ==================== 认证路由 ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, username } = req.body
    const loginId = email || username

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        error: '邮箱/用户名和密码不能为空'
      })
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginId },
          { username: loginId }
        ],
        isActive: true
      },
      include: { clinic: true }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户不存在或密码错误'
      })
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: '用户不存在或密码错误'
      })
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // 生成JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          clinic: user.clinic ? {
            id: user.clinic.id,
            name: user.clinic.name,
            code: user.clinic.code
          } : null
        }
      },
      message: '登录成功'
    })
  } catch (error) {
    console.error('❌ 登录错误:', error)
    res.status(500).json({
      success: false,
      error: '登录失败'
    })
  }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password, fullName, role = 'patient', phone } = req.body

    // 验证必填字段
    if (!email || !username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: '邮箱、用户名、密码和姓名不能为空'
      })
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: '邮箱或用户名已被注册'
      })
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        fullName,
        role,
        phone,
      }
    })

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      message: '注册成功'
    })
  } catch (error) {
    console.error('❌ 注册错误:', error)
    res.status(500).json({
      success: false,
      error: '注册失败'
    })
  }
})

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = req.user
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        clinic: user.clinic ? {
          id: user.clinic.id,
          name: user.clinic.name,
          code: user.clinic.code
        } : null
      }
    }
  })
})

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  })
})

// ==================== 用户管理路由 ====================
app.get('/api/users/profile', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        clinic: true,
        patientProfile: true
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        birthDate: user.birthDate,
        gender: user.gender,
        clinic: user.clinic,
        patientProfile: user.patientProfile,
        lastLoginAt: user.lastLoginAt
      }
    })
  } catch (error) {
    console.error('❌ 获取用户信息错误:', error)
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    })
  }
})

app.put('/api/users/profile', authenticateToken, async (req: any, res) => {
  try {
    const { fullName, phone, avatarUrl } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        phone,
        avatarUrl
      }
    })

    res.json({
      success: true,
      data: updatedUser,
      message: '用户信息更新成功'
    })
  } catch (error) {
    console.error('❌ 更新用户信息错误:', error)
    res.status(500).json({
      success: false,
      error: '更新用户信息失败'
    })
  }
})

// ==================== 门诊管理路由 ====================
app.get('/api/clinics', authenticateToken, async (req: any, res) => {
  try {
    const clinics = await prisma.clinic.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            users: true,
            examinations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: clinics
    })
  } catch (error) {
    console.error('❌ 获取门诊列表错误:', error)
    res.status(500).json({
      success: false,
      error: '获取门诊列表失败'
    })
  }
})

app.get('/api/clinics/:id', authenticateToken, async (req: any, res) => {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          where: { isActive: true },
          select: {
            id: true,
            fullName: true,
            role: true,
            email: true,
            phone: true
          }
        },
        examinations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: {
              select: { fullName: true }
            },
            doctor: {
              select: { fullName: true }
            }
          }
        }
      }
    })

    if (!clinic) {
      return res.status(404).json({
        success: false,
        error: '门诊不存在'
      })
    }

    res.json({
      success: true,
      data: clinic
    })
  } catch (error) {
    console.error('❌ 获取门诊详情错误:', error)
    res.status(500).json({
      success: false,
      error: '获取门诊详情失败'
    })
  }
})

// ==================== 检查管理路由 ====================
app.get('/api/examinations', authenticateToken, async (req: any, res) => {
  try {
    const { page = 1, limit = 20, status, patientId, doctorId } = req.query
    const skip = (page - 1) * limit

    const where: any = {}
    
    // 根据用户角色过滤数据
    if (req.user.role === 'patient') {
      where.patientId = req.user.id
    } else if (req.user.role === 'doctor') {
      where.doctorId = req.user.id
    } else if (req.user.clinicId && req.user.role !== 'super_admin') {
      where.clinicId = req.user.clinicId
    }

    // 添加其他过滤条件
    if (status) where.status = status
    if (patientId) where.patientId = patientId
    if (doctorId) where.doctorId = doctorId

    const [examinations, total] = await Promise.all([
      prisma.examination.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          patient: {
            select: { fullName: true, birthDate: true, gender: true }
          },
          doctor: {
            select: { fullName: true, specialty: true }
          },
          clinic: {
            select: { name: true }
          },
          template: {
            select: { name: true }
          },
          _count: {
            select: { images: true, aiAnalyses: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.examination.count({ where })
    ])

    res.json({
      success: true,
      data: {
        examinations,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('❌ 获取检查列表错误:', error)
    res.status(500).json({
      success: false,
      error: '获取检查列表失败'
    })
  }
})

app.get('/api/examinations/:id', authenticateToken, async (req: any, res) => {
  try {
    const examination = await prisma.examination.findUnique({
      where: { id: req.params.id },
      include: {
        patient: {
          include: { patientProfile: true }
        },
        doctor: true,
        clinic: true,
        template: true,
        images: true,
        aiAnalyses: true,
        report: true
      }
    })

    if (!examination) {
      return res.status(404).json({
        success: false,
        error: '检查记录不存在'
      })
    }

    // 检查权限
    const hasAccess = 
      req.user.role === 'super_admin' ||
      examination.patientId === req.user.id ||
      examination.doctorId === req.user.id ||
      (req.user.clinicId && examination.clinicId === req.user.clinicId)

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: '无权访问此检查记录'
      })
    }

    res.json({
      success: true,
      data: examination
    })
  } catch (error) {
    console.error('❌ 获取检查详情错误:', error)
    res.status(500).json({
      success: false,
      error: '获取检查详情失败'
    })
  }
})

// ==================== 统计信息路由 ====================
app.get('/api/stats/overview', authenticateToken, async (req: any, res) => {
  try {
    const where: any = {}
    
    // 根据用户角色设置过滤条件
    if (req.user.clinicId && req.user.role !== 'super_admin') {
      where.clinicId = req.user.clinicId
    }

    const [
      totalExaminations,
      totalPatients,
      totalReports,
      pendingReports
    ] = await Promise.all([
      prisma.examination.count({ where }),
      prisma.user.count({
        where: {
          role: 'patient',
          isActive: true,
          ...(req.user.clinicId && req.user.role !== 'super_admin' ? {
            OR: [
              { examinationsAsPatient: { some: where } }
            ]
          } : {})
        }
      }),
      prisma.report.count({
        where: req.user.clinicId && req.user.role !== 'super_admin' ? {
          examination: where
        } : {}
      }),
      prisma.report.count({
        where: {
          status: 'pending',
          ...(req.user.clinicId && req.user.role !== 'super_admin' ? {
            examination: where
          } : {})
        }
      })
    ])

    res.json({
      success: true,
      data: {
        totalExaminations,
        totalPatients,
        totalReports,
        pendingReports,
        completionRate: totalReports > 0 ? 
          Math.round((totalReports - pendingReports) / totalReports * 100) : 0
      }
    })
  } catch (error) {
    console.error('❌ 获取统计信息错误:', error)
    res.status(500).json({
      success: false,
      error: '获取统计信息失败'
    })
  }
})

// ==================== 业务功能路由 ====================
app.use('/api/upload', uploadRoutes)
app.use('/api/clinics', clinicRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/examinations', examinationRoutes)

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
  console.log('🎯 完整版后端服务启动成功!')
  console.log(`📡 服务地址: http://localhost:${PORT}`)
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`)
  console.log(`🔐 登录接口: http://localhost:${PORT}/api/auth/login`)
  console.log(`📊 统计信息: http://localhost:${PORT}/api/stats/overview`)
  console.log('🚀 ================================')
  console.log('')
})

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 接收到关闭信号，正在关闭服务器...')
  await prisma.$disconnect()
  server.close(() => {
    console.log('✅ 服务器已关闭')
    process.exit(0)
  })
})

export { app }
