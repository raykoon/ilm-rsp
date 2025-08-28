import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { prisma } from '../config/database'
import { RedisService, CacheKeys } from '../config/redis'
import { AppError, createUnauthorizedError, createForbiddenError } from './errorHandler'
import { logger } from '../utils/logger'
import { UserRole } from '@prisma/client'

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        username: string
        email: string
        role: UserRole
        clinicId?: string
        fullName: string
        isActive: boolean
      }
    }
  }
}

// JWT载荷接口
interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

const redisService = new RedisService()

// 从Redis获取用户信息
const getUserFromCache = async (userId: string) => {
  try {
    const cachedUser = await redisService.get(CacheKeys.user(userId))
    return cachedUser
  } catch (error) {
    logger.warn('从Redis获取用户信息失败:', error)
    return null
  }
}

// 将用户信息存储到Redis
const cacheUser = async (user: any) => {
  try {
    await redisService.set(CacheKeys.user(user.id), user, 3600) // 缓存1小时
  } catch (error) {
    logger.warn('缓存用户信息失败:', error)
  }
}

// 从数据库获取用户信息
const getUserFromDatabase = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        isActive: true 
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        clinicId: true,
        fullName: true,
        isActive: true,
        lastLoginAt: true
      }
    })

    if (user) {
      // 缓存用户信息
      await cacheUser(user)
    }

    return user
  } catch (error) {
    logger.error('从数据库获取用户信息失败:', error)
    throw new AppError('用户验证失败', 500)
  }
}

// 验证JWT令牌
const verifyToken = (token: string): Promise<JWTPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.secret, (error, decoded) => {
      if (error) {
        reject(error)
      } else {
        resolve(decoded as JWTPayload)
      }
    })
  })
}

// 主要认证中间件
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 获取Authorization头
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createUnauthorizedError('未提供访问令牌')
    }

    // 提取令牌
    const token = authHeader.substring(7)
    if (!token) {
      throw createUnauthorizedError('访问令牌格式无效')
    }

    // 检查令牌是否在黑名单中
    const isBlacklisted = await redisService.exists(`blacklist:${token}`)
    if (isBlacklisted) {
      throw createUnauthorizedError('访问令牌已失效')
    }

    // 验证JWT令牌
    const decoded = await verifyToken(token)
    
    // 首先尝试从缓存获取用户信息
    let user = await getUserFromCache(decoded.userId)
    
    // 如果缓存中没有，从数据库获取
    if (!user) {
      user = await getUserFromDatabase(decoded.userId)
    }

    // 用户不存在或已被禁用
    if (!user) {
      throw createUnauthorizedError('用户不存在或已被禁用')
    }

    // 将用户信息附加到请求对象
    req.user = user
    
    // 记录最后活动时间（异步，不阻塞请求）
    setImmediate(async () => {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })
        
        // 更新缓存中的用户信息
        await cacheUser({ ...user, lastLoginAt: new Date() })
      } catch (error) {
        logger.warn('更新用户最后活动时间失败:', error)
      }
    })

    next()
  } catch (error) {
    next(error)
  }
}

// 可选认证中间件（不要求必须登录）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      if (token) {
        const isBlacklisted = await redisService.exists(`blacklist:${token}`)
        if (!isBlacklisted) {
          const decoded = await verifyToken(token)
          let user = await getUserFromCache(decoded.userId)
          
          if (!user) {
            user = await getUserFromDatabase(decoded.userId)
          }
          
          if (user) {
            req.user = user
          }
        }
      }
    }
    
    next()
  } catch (error) {
    // 可选认证失败时不抛出错误，继续处理请求
    logger.debug('可选认证失败:', error)
    next()
  }
}

// 角色权限检查中间件
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createUnauthorizedError())
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error = createForbiddenError(`需要以下角色之一: ${allowedRoles.join(', ')}`)
      return next(error)
    }

    next()
  }
}

// 超级管理员权限检查
export const requireSuperAdmin = requireRole('super_admin')

// 管理员权限检查（包括超级管理员）
export const requireAdmin = requireRole('super_admin', 'admin')

// 医生权限检查（包括管理员）
export const requireDoctor = requireRole('super_admin', 'admin', 'doctor')

// 医护人员权限检查
export const requireMedicalStaff = requireRole('super_admin', 'admin', 'doctor', 'nurse')

// 机构权限检查中间件
export const requireSameClinic = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(createUnauthorizedError())
  }

  // 超级管理员可以访问所有机构
  if (req.user.role === 'super_admin') {
    return next()
  }

  // 检查是否属于同一机构
  const targetClinicId = req.params.clinicId || req.body.clinicId
  if (targetClinicId && req.user.clinicId !== targetClinicId) {
    return next(createForbiddenError('只能访问本机构的数据'))
  }

  next()
}

// 资源所有者权限检查
export const requireOwnership = (resourceType: 'user' | 'examination' | 'report') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(createUnauthorizedError())
      }

      // 超级管理员和管理员可以访问所有资源
      if (['super_admin', 'admin'].includes(req.user.role)) {
        return next()
      }

      const resourceId = req.params.id
      if (!resourceId) {
        return next(createForbiddenError('缺少资源ID'))
      }

      let hasAccess = false

      switch (resourceType) {
        case 'user':
          // 用户只能访问自己的信息
          hasAccess = req.user.id === resourceId
          break

        case 'examination':
          // 检查用户是否为检查的患者或医生
          const examination = await prisma.examination.findUnique({
            where: { id: resourceId },
            select: { patientId: true, doctorId: true, clinicId: true }
          })
          
          if (examination) {
            hasAccess = examination.patientId === req.user.id || 
                       examination.doctorId === req.user.id ||
                       (req.user.clinicId === examination.clinicId && 
                        ['doctor', 'nurse'].includes(req.user.role))
          }
          break

        case 'report':
          // 检查用户是否有访问报告的权限
          const report = await prisma.report.findUnique({
            where: { id: resourceId },
            include: {
              examination: {
                select: { patientId: true, doctorId: true, clinicId: true }
              }
            }
          })
          
          if (report?.examination) {
            hasAccess = report.examination.patientId === req.user.id || 
                       report.examination.doctorId === req.user.id ||
                       (req.user.clinicId === report.examination.clinicId && 
                        ['doctor', 'nurse'].includes(req.user.role))
          }
          break
      }

      if (!hasAccess) {
        return next(createForbiddenError('没有权限访问该资源'))
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// 令牌黑名单管理
export const blacklistToken = async (token: string) => {
  try {
    // 解析令牌获取过期时间
    const decoded = jwt.decode(token) as JWTPayload
    if (decoded && decoded.exp) {
      const expirationTime = decoded.exp * 1000 - Date.now()
      if (expirationTime > 0) {
        // 将令牌加入黑名单，设置过期时间
        await redisService.set(`blacklist:${token}`, true, Math.floor(expirationTime / 1000))
      }
    }
  } catch (error) {
    logger.error('将令牌加入黑名单失败:', error)
  }
}

// 清理用户缓存
export const clearUserCache = async (userId: string) => {
  try {
    await redisService.del(CacheKeys.user(userId))
    await redisService.del(CacheKeys.userSessions(userId))
  } catch (error) {
    logger.warn('清理用户缓存失败:', error)
  }
}
