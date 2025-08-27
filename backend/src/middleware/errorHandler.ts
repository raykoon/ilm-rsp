import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { logger } from '@/utils/logger'
import { config } from '@/config'

// 自定义错误类
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    
    Error.captureStackTrace(this, this.constructor)
  }
}

// HTTP状态码常量
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

// 错误类型
interface ErrorResponse {
  success: false
  error: string
  message?: string
  details?: any
  timestamp: string
  requestId?: string
}

// 处理Prisma错误
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      // 唯一约束违反
      const field = error.meta?.target as string[]
      return new AppError(
        `${field ? field.join(', ') : '字段'}已存在，请使用其他值`,
        HTTP_STATUS.CONFLICT
      )
    case 'P2014':
      // 外键约束违反
      return new AppError(
        '删除失败：存在关联数据',
        HTTP_STATUS.CONFLICT
      )
    case 'P2003':
      // 外键约束失败
      return new AppError(
        '关联数据不存在',
        HTTP_STATUS.BAD_REQUEST
      )
    case 'P2025':
      // 记录未找到
      return new AppError(
        '请求的资源不存在',
        HTTP_STATUS.NOT_FOUND
      )
    case 'P2021':
      // 表不存在
      return new AppError(
        '数据库表不存在',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    case 'P2022':
      // 列不存在
      return new AppError(
        '数据库列不存在',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    default:
      logger.error('未处理的Prisma错误:', { code: error.code, message: error.message })
      return new AppError(
        '数据库操作失败',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
  }
}

// 处理Zod验证错误
const handleZodError = (error: ZodError): AppError => {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }))

  return new AppError(
    '请求参数验证失败',
    HTTP_STATUS.UNPROCESSABLE_ENTITY
  )
}

// 处理JWT错误
const handleJWTError = (error: Error): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('无效的访问令牌', HTTP_STATUS.UNAUTHORIZED)
  }
  if (error.name === 'TokenExpiredError') {
    return new AppError('访问令牌已过期', HTTP_STATUS.UNAUTHORIZED)
  }
  if (error.name === 'NotBeforeError') {
    return new AppError('访问令牌尚未生效', HTTP_STATUS.UNAUTHORIZED)
  }
  return new AppError('令牌验证失败', HTTP_STATUS.UNAUTHORIZED)
}

// 发送错误响应
const sendErrorResponse = (res: Response, error: AppError, req: Request) => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] as string
  }

  // 在开发环境下提供更多错误信息
  if (config.isDevelopment && error.stack) {
    errorResponse.details = {
      stack: error.stack,
      cause: error.cause
    }
  }

  // 根据错误类型添加特定信息
  if (error instanceof ZodError) {
    errorResponse.details = {
      validationErrors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        received: err.received
      }))
    }
  }

  res.status(error.statusCode).json(errorResponse)
}

// 主要错误处理中间件
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let appError: AppError

  // 根据错误类型进行处理
  if (error instanceof AppError) {
    appError = error
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error)
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    appError = new AppError('数据库查询参数无效', HTTP_STATUS.BAD_REQUEST)
  } else if (error instanceof ZodError) {
    appError = handleZodError(error)
  } else if (error.name?.includes('JWT') || error.name?.includes('Token')) {
    appError = handleJWTError(error)
  } else if (error.name === 'MulterError') {
    // 文件上传错误
    if (error.message.includes('File too large')) {
      appError = new AppError('文件大小超出限制', HTTP_STATUS.BAD_REQUEST)
    } else if (error.message.includes('Unexpected field')) {
      appError = new AppError('上传字段名称不正确', HTTP_STATUS.BAD_REQUEST)
    } else {
      appError = new AppError('文件上传失败', HTTP_STATUS.BAD_REQUEST)
    }
  } else {
    // 未知错误
    appError = new AppError(
      config.isProduction ? '服务器内部错误' : error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      false
    )
  }

  // 记录错误日志
  const logLevel = appError.statusCode >= 500 ? 'error' : 'warn'
  const logMeta = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: appError.statusCode,
      isOperational: appError.isOperational
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      requestId: req.headers['x-request-id']
    }
  }

  logger[logLevel](`${error.name}: ${error.message}`, logMeta)

  // 发送错误响应
  sendErrorResponse(res, appError, req)
}

// 404处理中间件
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `接口 ${req.originalUrl} 不存在`,
    HTTP_STATUS.NOT_FOUND
  )
  next(error)
}

// 异步错误捕获包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 验证错误助手函数
export const createValidationError = (field: string, message: string) => {
  return new AppError(`${field}: ${message}`, HTTP_STATUS.UNPROCESSABLE_ENTITY)
}

// 权限错误助手函数
export const createForbiddenError = (message: string = '权限不足') => {
  return new AppError(message, HTTP_STATUS.FORBIDDEN)
}

// 未找到错误助手函数
export const createNotFoundError = (resource: string = '资源') => {
  return new AppError(`${resource}不存在`, HTTP_STATUS.NOT_FOUND)
}

// 冲突错误助手函数
export const createConflictError = (message: string) => {
  return new AppError(message, HTTP_STATUS.CONFLICT)
}

// 未授权错误助手函数
export const createUnauthorizedError = (message: string = '未授权访问') => {
  return new AppError(message, HTTP_STATUS.UNAUTHORIZED)
}
