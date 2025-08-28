/**
 * 检查系统路由
 * 处理检查预约、记录、AI分析和报告生成
 */

import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

// 创建检查的验证Schema
const createExaminationSchema = z.object({
  patientId: z.string().min(1, '患者ID不能为空'),
  templateId: z.string().optional(),
  chiefComplaint: z.string().optional(),
  presentIllness: z.string().optional(),
  clinicalFindings: z.string().optional(),
  preliminaryDiagnosis: z.string().optional(),
  notes: z.string().optional(),
  examinationDate: z.string().datetime().optional()
})

// 更新检查的验证Schema
const updateExaminationSchema = z.object({
  chiefComplaint: z.string().optional(),
  presentIllness: z.string().optional(),
  clinicalFindings: z.string().optional(),
  preliminaryDiagnosis: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'reviewed']).optional()
})

// AI分析请求Schema
const requestAIAnalysisSchema = z.object({
  imageIds: z.array(z.string()).min(1, '至少需要选择一个图像'),
  analysisTypes: z.array(z.string()).min(1, '至少需要选择一种分析类型')
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

// 获取检查列表
router.get('/', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      patientId,
      doctorId,
      status,
      dateFrom,
      dateTo,
      search = '',
      sortBy = 'examinationDate',
      sortOrder = 'desc'
    } = req.query

    const where: any = {}

    // 门诊过滤（非超级管理员）
    if (req.user.role !== 'super_admin' && req.user.clinicId) {
      where.clinicId = req.user.clinicId
    }

    // 患者过滤
    if (patientId) {
      where.patientId = patientId
    }

    // 医生过滤
    if (doctorId) {
      where.doctorId = doctorId
    }

    // 状态过滤
    if (status) {
      where.status = status
    }

    // 日期范围过滤
    if (dateFrom || dateTo) {
      where.examinationDate = {}
      if (dateFrom) {
        where.examinationDate.gte = new Date(dateFrom as string)
      }
      if (dateTo) {
        where.examinationDate.lte = new Date(dateTo as string)
      }
    }

    // 搜索过滤
    if (search) {
      where.OR = [
        { patient: { fullName: { contains: search as string, mode: 'insensitive' } } },
        { patient: { username: { contains: search as string, mode: 'insensitive' } } },
        { chiefComplaint: { contains: search as string, mode: 'insensitive' } },
        { preliminaryDiagnosis: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)

    const orderBy: any = {}
    orderBy[sortBy as string] = sortOrder as string

    const [examinations, total] = await Promise.all([
      prisma.examination.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              birthDate: true,
              gender: true,
              phone: true
            }
          },
          doctor: {
            select: {
              id: true,
              fullName: true,
              specialty: true,
              title: true
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
          images: {
            select: {
              id: true,
              filename: true,
              imageType: true
            },
            take: 3
          },
          aiAnalyses: {
            select: {
              id: true,
              analysisType: true,
              status: true,
              createdAt: true
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
              uploadedFiles: true,
              aiAnalyses: true
            }
          }
        },
        orderBy,
        skip,
        take
      }),
      prisma.examination.count({ where })
    ])

    const examinationList = examinations.map(exam => ({
      id: exam.id,
      examinationDate: exam.examinationDate,
      status: exam.status,
      chiefComplaint: exam.chiefComplaint,
      preliminaryDiagnosis: exam.preliminaryDiagnosis,
      patient: {
        ...exam.patient,
        age: exam.patient.birthDate ? 
          Math.floor((new Date().getTime() - new Date(exam.patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
          null
      },
      doctor: exam.doctor,
      clinic: exam.clinic,
      template: exam.template,
      previewImages: exam.images,
      aiAnalyses: exam.aiAnalyses,
      report: exam.report,
      stats: {
        imagesCount: exam._count.images,
        filesCount: exam._count.uploadedFiles,
        analysesCount: exam._count.aiAnalyses
      },
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt
    }))

    res.json({
      success: true,
      data: {
        examinations: examinationList,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    })

  } catch (error) {
    console.error('获取检查列表失败:', error)
    res.status(500).json({
      success: false,
      error: '获取检查列表失败'
    })
  }
})

// 获取检查详情
router.get('/:id', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { id } = req.params

    const examination = await prisma.examination.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            patientProfile: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialty: true,
            title: true,
            medicalLicense: true
          }
        },
        clinic: true,
        template: true,
        images: {
          orderBy: { uploadedAt: 'asc' }
        },
        uploadedFiles: {
          orderBy: { uploadedAt: 'desc' }
        },
        aiAnalyses: {
          include: {
            image: {
              select: {
                id: true,
                filename: true,
                imageType: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        report: {
          include: {
            attachments: true
          }
        }
      }
    })

    if (!examination) {
      return res.status(404).json({
        success: false,
        error: '检查记录不存在'
      })
    }

    // 权限检查：确保用户有权限查看此检查
    const hasPermission = req.user.role === 'super_admin' || 
                         req.user.role === 'admin' ||
                         examination.doctorId === req.user.id ||
                         (req.user.clinicId && examination.clinicId === req.user.clinicId)

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: '无权限查看此检查记录'
      })
    }

    res.json({
      success: true,
      data: { examination }
    })

  } catch (error) {
    console.error('获取检查详情失败:', error)
    res.status(500).json({
      success: false,
      error: '获取检查详情失败'
    })
  }
})

// 创建检查记录
router.post('/', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const validatedData = createExaminationSchema.parse(req.body)

    // 验证患者存在
    const patient = await prisma.user.findFirst({
      where: { 
        id: validatedData.patientId,
        role: 'patient',
        isActive: true
      }
    })

    if (!patient) {
      return res.status(400).json({
        success: false,
        error: '患者不存在或已停用'
      })
    }

    // 验证模板存在（如果提供了）
    if (validatedData.templateId) {
      const template = await prisma.examinationTemplate.findFirst({
        where: {
          id: validatedData.templateId,
          isActive: true
        }
      })

      if (!template) {
        return res.status(400).json({
          success: false,
          error: '检查模板不存在或已停用'
        })
      }
    }

    // 创建检查记录
    const examination = await prisma.examination.create({
      data: {
        ...validatedData,
        doctorId: req.user.id,
        clinicId: req.user.clinicId,
        examinationDate: validatedData.examinationDate ? 
          new Date(validatedData.examinationDate) : 
          new Date(),
        status: 'pending'
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            birthDate: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialty: true
          }
        },
        template: true
      }
    })

    res.status(201).json({
      success: true,
      data: { examination },
      message: '检查记录创建成功'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: error.errors
      })
    }

    console.error('创建检查记录失败:', error)
    res.status(500).json({
      success: false,
      error: '创建检查记录失败'
    })
  }
})

// 更新检查记录
router.put('/:id', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const validatedData = updateExaminationSchema.parse(req.body)

    // 检查权限
    const existingExam = await prisma.examination.findUnique({
      where: { id },
      select: {
        doctorId: true,
        clinicId: true
      }
    })

    if (!existingExam) {
      return res.status(404).json({
        success: false,
        error: '检查记录不存在'
      })
    }

    const hasPermission = req.user.role === 'super_admin' || 
                         req.user.role === 'admin' ||
                         existingExam.doctorId === req.user.id ||
                         (req.user.clinicId && existingExam.clinicId === req.user.clinicId)

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: '无权限修改此检查记录'
      })
    }

    const examination = await prisma.examination.update({
      where: { id },
      data: validatedData,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            birthDate: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialty: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: { examination },
      message: '检查记录更新成功'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: error.errors
      })
    }

    console.error('更新检查记录失败:', error)
    res.status(500).json({
      success: false,
      error: '更新检查记录失败'
    })
  }
})

// 请求AI分析
router.post('/:id/ai-analysis', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const validatedData = requestAIAnalysisSchema.parse(req.body)

    // 检查检查记录是否存在
    const examination = await prisma.examination.findUnique({
      where: { id },
      include: {
        images: {
          where: {
            id: { in: validatedData.imageIds }
          }
        }
      }
    })

    if (!examination) {
      return res.status(404).json({
        success: false,
        error: '检查记录不存在'
      })
    }

    // 检查权限
    const hasPermission = req.user.role === 'super_admin' || 
                         req.user.role === 'admin' ||
                         examination.doctorId === req.user.id ||
                         (req.user.clinicId && examination.clinicId === req.user.clinicId)

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: '无权限对此检查进行AI分析'
      })
    }

    if (examination.images.length !== validatedData.imageIds.length) {
      return res.status(400).json({
        success: false,
        error: '部分图像不存在于此检查中'
      })
    }

    // 为每个图像和分析类型创建AI分析任务
    const aiAnalyses = []
    
    for (const imageId of validatedData.imageIds) {
      for (const analysisType of validatedData.analysisTypes) {
        const aiAnalysis = await prisma.aIAnalysis.create({
          data: {
            examinationId: id,
            imageId: imageId,
            analysisType: analysisType as any,
            status: 'pending',
            requestedById: req.user.id
          }
        })
        aiAnalyses.push(aiAnalysis)
      }
    }

    // 更新检查状态为处理中
    await prisma.examination.update({
      where: { id },
      data: { status: 'processing' }
    })

    // TODO: 这里应该调用AI分析服务
    // 暂时返回成功响应

    res.json({
      success: true,
      data: {
        analysisCount: aiAnalyses.length,
        analyses: aiAnalyses
      },
      message: 'AI分析任务创建成功，正在后台处理'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: error.errors
      })
    }

    console.error('请求AI分析失败:', error)
    res.status(500).json({
      success: false,
      error: '请求AI分析失败'
    })
  }
})

// 获取检查的AI分析结果
router.get('/:id/ai-analyses', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { id } = req.params

    const aiAnalyses = await prisma.aIAnalysis.findMany({
      where: { examinationId: id },
      include: {
        image: {
          select: {
            id: true,
            filename: true,
            imageType: true,
            filePath: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: {
        analyses: aiAnalyses,
        summary: {
          total: aiAnalyses.length,
          pending: aiAnalyses.filter(a => a.status === 'pending').length,
          processing: aiAnalyses.filter(a => a.status === 'processing').length,
          completed: aiAnalyses.filter(a => a.status === 'completed').length,
          failed: aiAnalyses.filter(a => a.status === 'failed').length
        }
      }
    })

  } catch (error) {
    console.error('获取AI分析结果失败:', error)
    res.status(500).json({
      success: false,
      error: '获取AI分析结果失败'
    })
  }
})

// 生成检查报告
router.post('/:id/generate-report', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const { id } = req.params

    // 检查是否已存在报告
    const existingReport = await prisma.report.findUnique({
      where: { examinationId: id }
    })

    if (existingReport) {
      return res.status(400).json({
        success: false,
        error: '此检查已生成报告'
      })
    }

    // 检查是否有完成的AI分析
    const completedAnalyses = await prisma.aIAnalysis.findMany({
      where: { 
        examinationId: id,
        status: 'completed'
      }
    })

    if (completedAnalyses.length === 0) {
      return res.status(400).json({
        success: false,
        error: '尚无完成的AI分析，无法生成报告'
      })
    }

    // 创建报告记录
    const report = await prisma.report.create({
      data: {
        examinationId: id,
        status: 'pending',
        generatedById: req.user.id
      }
    })

    // TODO: 这里应该调用报告生成服务
    // 暂时直接设置为完成状态
    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: 'completed',
        generatedAt: new Date(),
        findings: JSON.stringify({
          summary: '基于AI分析的检查报告',
          details: completedAnalyses.map(analysis => ({
            type: analysis.analysisType,
            result: analysis.result
          }))
        })
      }
    })

    // 更新检查状态
    await prisma.examination.update({
      where: { id },
      data: { status: 'completed' }
    })

    res.json({
      success: true,
      data: { report },
      message: '报告生成成功'
    })

  } catch (error) {
    console.error('生成报告失败:', error)
    res.status(500).json({
      success: false,
      error: '生成报告失败'
    })
  }
})

// 获取检查统计
router.get('/stats/overview', requireAuth, requireMedicalStaff, async (req: any, res: Response) => {
  try {
    const where: any = {}

    // 门诊过滤
    if (req.user.role !== 'super_admin' && req.user.clinicId) {
      where.clinicId = req.user.clinicId
    }

    // 医生过滤
    if (req.user.role === 'doctor') {
      where.doctorId = req.user.id
    }

    const [
      totalExaminations,
      pendingExaminations,
      processingExaminations,
      completedExaminations,
      todayExaminations
    ] = await Promise.all([
      prisma.examination.count({ where }),
      prisma.examination.count({ where: { ...where, status: 'pending' } }),
      prisma.examination.count({ where: { ...where, status: 'processing' } }),
      prisma.examination.count({ where: { ...where, status: 'completed' } }),
      prisma.examination.count({ 
        where: { 
          ...where,
          examinationDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        } 
      })
    ])

    res.json({
      success: true,
      data: {
        total: totalExaminations,
        pending: pendingExaminations,
        processing: processingExaminations,
        completed: completedExaminations,
        today: todayExaminations,
        completionRate: totalExaminations > 0 ? 
          Math.round((completedExaminations / totalExaminations) * 100) : 0
      }
    })

  } catch (error) {
    console.error('获取检查统计失败:', error)
    res.status(500).json({
      success: false,
      error: '获取检查统计失败'
    })
  }
})

export default router