/**
 * 患者管理路由
 * 处理患者的CRUD操作、健康档案和检查记录
 */

import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const router = Router()
const prisma = new PrismaClient()

// 创建患者的验证Schema
const createPatientSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  fullName: z.string().min(1, '姓名不能为空'),
  phone: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  // 健康档案信息
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  familyHistory: z.string().optional()
})

// 更新患者的验证Schema
const updatePatientSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  isActive: z.boolean().optional()
})

// 健康档案更新Schema
const updateHealthProfileSchema = z.object({
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  familyHistory: z.string().optional()
})

// 验证用户中间件（简化版）
const requireAuth = async (req: any, res: Response, next: any) => {
  req.user = { 
    id: 'user123', 
    role: 'doctor',
    clinicId: 'clinic123'
  }
  next()
}

// 权限检查：医生、护士、管理员
const requireMedicalStaff = (req: any, res: Response, next: any) => {
  const allowedRoles = ['doctor', 'nurse', 'admin', 'super_admin']
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: '权限不足，需要医护人员或管理员权限'
    })
  }
  next()
}

// 获取患者列表
router.get('/', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      gender,
      ageRange,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const where: any = { 
      role: 'patient'
    }

    // 搜索条件
    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    // 性别筛选
    if (gender) {
      where.gender = gender
    }

    // 年龄范围筛选
    if (ageRange) {
      const now = new Date()
      const [minAge, maxAge] = (ageRange as string).split('-').map(Number)
      
      if (maxAge) {
        const minBirthDate = new Date(now.getFullYear() - maxAge - 1, 0, 1)
        const maxBirthDate = new Date(now.getFullYear() - minAge, 11, 31)
        where.birthDate = {
          gte: minBirthDate,
          lte: maxBirthDate
        }
      }
    }

    // 状态筛选
    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)

    const orderBy: any = {}
    orderBy[sortBy as string] = sortOrder as string

    const [patients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          patientProfile: true,
          examinationsAsPatient: {
            select: {
              id: true,
              examinationDate: true,
              status: true,
              doctor: {
                select: {
                  fullName: true
                }
              }
            },
            orderBy: { examinationDate: 'desc' },
            take: 5
          },
          _count: {
            select: {
              examinationsAsPatient: true
            }
          }
        },
        orderBy,
        skip,
        take
      }),
      prisma.user.count({ where })
    ])

    const patientList = patients.map(patient => ({
      id: patient.id,
      username: patient.username,
      email: patient.email,
      fullName: patient.fullName,
      phone: patient.phone,
      birthDate: patient.birthDate,
      gender: patient.gender,
      guardianName: patient.guardianName,
      guardianPhone: patient.guardianPhone,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      isActive: patient.isActive,
      createdAt: patient.createdAt,
      lastLoginAt: patient.lastLoginAt,
      age: patient.birthDate ? 
        Math.floor((new Date().getTime() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
        null,
      healthProfile: patient.patientProfile,
      recentExaminations: patient.examinationsAsPatient,
      totalExaminations: patient._count.examinationsAsPatient
    }))

    res.json({
      success: true,
      data: {
        patients: patientList,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    })

  } catch (error) {
    console.error('获取患者列表失败:', error)
    res.status(500).json({
      success: false,
      error: '获取患者列表失败'
    })
  }
})

// 获取患者详情
router.get('/:id', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { id } = req.params

    const patient = await prisma.user.findFirst({
      where: { 
        id, 
        role: 'patient' 
      },
      include: {
        patientProfile: true,
        examinationsAsPatient: {
          include: {
            doctor: {
              select: {
                id: true,
                fullName: true,
                specialty: true
              }
            },
            clinic: {
              select: {
                id: true,
                name: true
              }
            },
            images: {
              select: {
                id: true,
                filename: true,
                imageType: true,
                uploadedAt: true
              }
            },
            report: {
              select: {
                id: true,
                status: true,
                generatedAt: true
              }
            }
          },
          orderBy: { examinationDate: 'desc' }
        },
        uploadedFiles: {
          select: {
            id: true,
            originalName: true,
            fileType: true,
            size: true,
            uploadedAt: true
          },
          orderBy: { uploadedAt: 'desc' },
          take: 10
        }
      }
    })

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: '患者不存在'
      })
    }

    const patientData = {
      id: patient.id,
      username: patient.username,
      email: patient.email,
      fullName: patient.fullName,
      phone: patient.phone,
      birthDate: patient.birthDate,
      gender: patient.gender,
      guardianName: patient.guardianName,
      guardianPhone: patient.guardianPhone,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      isActive: patient.isActive,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      lastLoginAt: patient.lastLoginAt,
      age: patient.birthDate ? 
        Math.floor((new Date().getTime() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
        null,
      healthProfile: patient.patientProfile,
      examinations: patient.examinationsAsPatient,
      recentFiles: patient.uploadedFiles,
      stats: {
        totalExaminations: patient.examinationsAsPatient.length,
        completedReports: patient.examinationsAsPatient.filter(exam => 
          exam.report && exam.report.status === 'completed'
        ).length
      }
    }

    res.json({
      success: true,
      data: { patient: patientData }
    })

  } catch (error) {
    console.error('获取患者详情失败:', error)
    res.status(500).json({
      success: false,
      error: '获取患者详情失败'
    })
  }
})

// 创建患者
router.post('/', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const validatedData = createPatientSchema.parse(req.body)

    // 检查用户名和邮箱是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: validatedData.username },
          { email: validatedData.email }
        ]
      }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '用户名或邮箱已存在'
      })
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // 分离健康档案数据
    const { 
      height, weight, bloodType, allergies, medicalHistory, 
      currentMedications, familyHistory, 
      ...userData 
    } = validatedData

    // 创建患者账户
    const patient = await prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        role: 'patient',
        birthDate: userData.birthDate ? new Date(userData.birthDate) : null
      }
    })

    // 创建健康档案
    let healthProfile = null
    if (height || weight || bloodType || allergies || medicalHistory || currentMedications || familyHistory) {
      healthProfile = await prisma.patientProfile.create({
        data: {
          patientId: patient.id,
          height,
          weight,
          bloodType,
          allergies,
          medicalHistory,
          currentMedications,
          familyHistory
        }
      })
    }

    res.status(201).json({
      success: true,
      data: { 
        patient: {
          ...patient,
          healthProfile
        }
      },
      message: '患者创建成功'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: error.errors
      })
    }

    console.error('创建患者失败:', error)
    res.status(500).json({
      success: false,
      error: '创建患者失败'
    })
  }
})

// 更新患者基本信息
router.put('/:id', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const validatedData = updatePatientSchema.parse(req.body)

    const patient = await prisma.user.update({
      where: { 
        id,
        role: 'patient'
      },
      data: {
        ...validatedData,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : undefined
      },
      include: {
        patientProfile: true
      }
    })

    res.json({
      success: true,
      data: { patient },
      message: '患者信息更新成功'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: error.errors
      })
    }

    console.error('更新患者失败:', error)
    res.status(500).json({
      success: false,
      error: '更新患者失败'
    })
  }
})

// 更新患者健康档案
router.put('/:id/health-profile', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const validatedData = updateHealthProfileSchema.parse(req.body)

    // 检查患者是否存在
    const patient = await prisma.user.findFirst({
      where: { id, role: 'patient' }
    })

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: '患者不存在'
      })
    }

    // 更新或创建健康档案
    const healthProfile = await prisma.patientProfile.upsert({
      where: { patientId: id },
      update: validatedData,
      create: {
        patientId: id,
        ...validatedData
      }
    })

    res.json({
      success: true,
      data: { healthProfile },
      message: '健康档案更新成功'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: error.errors
      })
    }

    console.error('更新健康档案失败:', error)
    res.status(500).json({
      success: false,
      error: '更新健康档案失败'
    })
  }
})

// 获取患者检查历史
router.get('/:id/examinations', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 10, status } = req.query

    const where: any = { 
      patientId: id 
    }

    if (status) {
      where.status = status
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)

    const [examinations, total] = await Promise.all([
      prisma.examination.findMany({
        where,
        include: {
          doctor: {
            select: {
              id: true,
              fullName: true,
              specialty: true
            }
          },
          clinic: {
            select: {
              id: true,
              name: true
            }
          },
          template: {
            select: {
              id: true,
              name: true,
              price: true
            }
          },
          report: {
            select: {
              id: true,
              status: true,
              generatedAt: true
            }
          },
          _count: {
            select: {
              images: true,
              uploadedFiles: true
            }
          }
        },
        orderBy: { examinationDate: 'desc' },
        skip,
        take
      }),
      prisma.examination.count({ where })
    ])

    res.json({
      success: true,
      data: {
        examinations,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    })

  } catch (error) {
    console.error('获取患者检查历史失败:', error)
    res.status(500).json({
      success: false,
      error: '获取患者检查历史失败'
    })
  }
})

// 患者统计信息
router.get('/:id/stats', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { id } = req.params

    const [
      totalExaminations,
      completedReports,
      pendingReports,
      totalFiles,
      recentActivity
    ] = await Promise.all([
      prisma.examination.count({ where: { patientId: id } }),
      prisma.report.count({ 
        where: { 
          examination: { patientId: id },
          status: 'completed'
        }
      }),
      prisma.report.count({ 
        where: { 
          examination: { patientId: id },
          status: 'pending'
        }
      }),
      prisma.uploadedFile.count({ where: { uploadedById: id } }),
      prisma.examination.findMany({
        where: { patientId: id },
        select: {
          id: true,
          examinationDate: true,
          status: true
        },
        orderBy: { examinationDate: 'desc' },
        take: 5
      })
    ])

    res.json({
      success: true,
      data: {
        summary: {
          totalExaminations,
          completedReports,
          pendingReports,
          totalFiles,
          completionRate: totalExaminations > 0 ? 
            Math.round((completedReports / totalExaminations) * 100) : 0
        },
        recentActivity
      }
    })

  } catch (error) {
    console.error('获取患者统计失败:', error)
    res.status(500).json({
      success: false,
      error: '获取患者统计失败'
    })
  }
})

// 删除患者（软删除 - 设置为非活跃状态）
router.delete('/:id', requireAuth, async (req: any, res: Response) => {
  try {
    const { id } = req.params

    // 只有管理员可以删除患者
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '只有管理员可以删除患者'
      })
    }

    await prisma.user.update({
      where: { 
        id,
        role: 'patient'
      },
      data: { 
        isActive: false 
      }
    })

    res.json({
      success: true,
      message: '患者账户已停用'
    })

  } catch (error) {
    console.error('删除患者失败:', error)
    res.status(500).json({
      success: false,
      error: '删除患者失败'
    })
  }
})

export default router
