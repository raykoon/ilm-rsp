/**
 * 门诊管理路由
 * 处理门诊的CRUD操作和相关统计
 */

import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

// 创建门诊的验证Schema
const createClinicSchema = z.object({
  name: z.string().min(1, '门诊名称不能为空'),
  code: z.string().min(1, '门诊编码不能为空'),
  address: z.string().optional(),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  licenseNumber: z.string().optional()
})

// 更新门诊的验证Schema
const updateClinicSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  licenseNumber: z.string().optional(),
  isActive: z.boolean().optional()
})

// 验证用户中间件（简化版）
const requireAuth = async (req: any, res: Response, next: any) => {
  // 这里应该有实际的认证逻辑
  // 暂时模拟用户
  req.user = { 
    id: 'user123', 
    role: 'admin',
    clinicId: 'clinic123'
  }
  next()
}

// 权限检查中间件
const requireAdminOrSuperAdmin = (req: any, res: Response, next: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: '权限不足，需要管理员权限'
    })
  }
  next()
}

// 获取门诊列表
router.get('/', requireAuth, async (req: any, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      isActive 
    } = req.query

    const where: any = {}

    // 搜索条件
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    // 状态筛选
    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // 非超级管理员只能查看自己门诊
    if (req.user.role !== 'super_admin') {
      where.id = req.user.clinicId
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)

    const [clinics, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              examinations: true,
              examinationTemplates: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.clinic.count({ where })
    ])

    const clinicList = clinics.map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      code: clinic.code,
      address: clinic.address,
      phone: clinic.phone,
      contactPerson: clinic.contactPerson,
      licenseNumber: clinic.licenseNumber,
      isActive: clinic.isActive,
      createdAt: clinic.createdAt,
      updatedAt: clinic.updatedAt,
      stats: {
        usersCount: clinic._count.users,
        examinationsCount: clinic._count.examinations,
        templatesCount: clinic._count.examinationTemplates
      }
    }))

    res.json({
      success: true,
      data: {
        clinics: clinicList,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    })

  } catch (error) {
    console.error('获取门诊列表失败:', error)
    res.status(500).json({
      success: false,
      error: '获取门诊列表失败'
    })
  }
})

// 获取单个门诊详情
router.get('/:id', requireAuth, async (req: any, res: Response) => {
  try {
    const { id } = req.params

    // 权限检查：只有超级管理员或本门诊用户可以查看
    if (req.user.role !== 'super_admin' && req.user.clinicId !== id) {
      return res.status(403).json({
        success: false,
        error: '无权限查看此门诊信息'
      })
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        },
        examinations: {
          select: {
            id: true,
            examinationDate: true,
            status: true,
            patient: {
              select: {
                id: true,
                fullName: true
              }
            }
          },
          orderBy: { examinationDate: 'desc' },
          take: 10
        },
        examinationTemplates: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true
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
      data: {
        clinic: {
          id: clinic.id,
          name: clinic.name,
          code: clinic.code,
          address: clinic.address,
          phone: clinic.phone,
          contactPerson: clinic.contactPerson,
          licenseNumber: clinic.licenseNumber,
          isActive: clinic.isActive,
          createdAt: clinic.createdAt,
          updatedAt: clinic.updatedAt,
          users: clinic.users,
          recentExaminations: clinic.examinations,
          templates: clinic.examinationTemplates
        }
      }
    })

  } catch (error) {
    console.error('获取门诊详情失败:', error)
    res.status(500).json({
      success: false,
      error: '获取门诊详情失败'
    })
  }
})

// 创建门诊
router.post('/', requireAuth, requireAdminOrSuperAdmin, async (req: any, res: Response) => {
  try {
    const validatedData = createClinicSchema.parse(req.body)

    // 检查门诊编码是否已存在
    const existingClinic = await prisma.clinic.findUnique({
      where: { code: validatedData.code }
    })

    if (existingClinic) {
      return res.status(400).json({
        success: false,
        error: '门诊编码已存在'
      })
    }

    const clinic = await prisma.clinic.create({
      data: validatedData
    })

    res.status(201).json({
      success: true,
      data: { clinic },
      message: '门诊创建成功'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: error.errors
      })
    }

    console.error('创建门诊失败:', error)
    res.status(500).json({
      success: false,
      error: '创建门诊失败'
    })
  }
})

// 更新门诊信息
router.put('/:id', requireAuth, requireAdminOrSuperAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const validatedData = updateClinicSchema.parse(req.body)

    // 权限检查：只有超级管理员或本门诊管理员可以修改
    if (req.user.role !== 'super_admin' && req.user.clinicId !== id) {
      return res.status(403).json({
        success: false,
        error: '无权限修改此门诊信息'
      })
    }

    const clinic = await prisma.clinic.update({
      where: { id },
      data: validatedData
    })

    res.json({
      success: true,
      data: { clinic },
      message: '门诊信息更新成功'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: error.errors
      })
    }

    console.error('更新门诊失败:', error)
    res.status(500).json({
      success: false,
      error: '更新门诊失败'
    })
  }
})

// 删除门诊
router.delete('/:id', requireAuth, requireAdminOrSuperAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params

    // 只有超级管理员可以删除门诊
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '只有超级管理员可以删除门诊'
      })
    }

    // 检查是否有关联数据
    const relatedData = await prisma.clinic.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            examinations: true
          }
        }
      }
    })

    if (!relatedData) {
      return res.status(404).json({
        success: false,
        error: '门诊不存在'
      })
    }

    if (relatedData._count.users > 0 || relatedData._count.examinations > 0) {
      return res.status(400).json({
        success: false,
        error: '门诊下还有用户或检查记录，无法删除'
      })
    }

    await prisma.clinic.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: '门诊删除成功'
    })

  } catch (error) {
    console.error('删除门诊失败:', error)
    res.status(500).json({
      success: false,
      error: '删除门诊失败'
    })
  }
})

// 获取门诊统计信息
router.get('/:id/stats', requireAuth, async (req: any, res: Response) => {
  try {
    const { id } = req.params

    // 权限检查
    if (req.user.role !== 'super_admin' && req.user.clinicId !== id) {
      return res.status(403).json({
        success: false,
        error: '无权限查看此门诊统计信息'
      })
    }

    const [
      usersCount,
      doctorsCount,
      patientsCount,
      examinationsCount,
      reportsCount,
      templatesCount
    ] = await Promise.all([
      prisma.user.count({ where: { clinicId: id, isActive: true } }),
      prisma.user.count({ where: { clinicId: id, role: 'doctor', isActive: true } }),
      prisma.user.count({ where: { role: 'patient', isActive: true } }),
      prisma.examination.count({ where: { clinicId: id } }),
      prisma.report.count({ 
        where: { 
          examination: { 
            clinicId: id 
          } 
        } 
      }),
      prisma.examinationTemplate.count({ where: { clinicId: id, isActive: true } })
    ])

    // 获取最近30天的检查统计
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentExaminations = await prisma.examination.count({
      where: {
        clinicId: id,
        examinationDate: {
          gte: thirtyDaysAgo
        }
      }
    })

    res.json({
      success: true,
      data: {
        overview: {
          usersCount,
          doctorsCount,
          patientsCount,
          examinationsCount,
          reportsCount,
          templatesCount
        },
        recent: {
          examinationsLast30Days: recentExaminations
        }
      }
    })

  } catch (error) {
    console.error('获取门诊统计失败:', error)
    res.status(500).json({
      success: false,
      error: '获取门诊统计失败'
    })
  }
})

// 获取门诊的用户列表
router.get('/:id/users', requireAuth, async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const { role, page = 1, limit = 20 } = req.query

    // 权限检查
    if (req.user.role !== 'super_admin' && req.user.clinicId !== id) {
      return res.status(403).json({
        success: false,
        error: '无权限查看此门诊用户'
      })
    }

    const where: any = { clinicId: id }
    
    if (role) {
      where.role = role
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          medicalLicense: true,
          specialty: true,
          title: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.user.count({ where })
    ])

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    })

  } catch (error) {
    console.error('获取门诊用户列表失败:', error)
    res.status(500).json({
      success: false,
      error: '获取门诊用户列表失败'
    })
  }
})

export default router