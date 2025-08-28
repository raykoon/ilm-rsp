import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { logger, auditLogger } from '../utils/logger'
import { config } from '../config'

// 扩展Request接口以包含请求开始时间
declare global {
  namespace Express {
    interface Request {
      startTime: number
      requestId: string
    }
  }
}

// 敏感字段，在日志中需要脱敏处理
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'currentPassword', 
  'newPassword',
  'confirmPassword',
  'token',
  'refreshToken',
  'authorization',
  'cookie',
  'apiKey',
  'secret'
]

// 需要记录请求体的路径
const LOG_BODY_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/users',
  '/api/examinations',
  '/api/reports'
]

// 需要记录审计日志的操作
const AUDIT_OPERATIONS = {
  POST: ['create', 'register', 'login'],
  PUT: ['update', 'modify'],
  PATCH: ['update', 'modify'],
  DELETE: ['delete', 'remove']
}

// 脱敏处理函数
const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData)
  }

  const sanitized = { ...data }
  
  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = '***'
    }
  }

  // 递归处理嵌套对象
  for (const [key, value] of Object.entries(sanitized)) {
    if (value && typeof value === 'object') {
      sanitized[key] = sanitizeData(value)
    }
  }

  return sanitized
}

// 获取客户端IP
const getClientIp = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

// 判断是否需要记录请求体
const shouldLogBody = (req: Request): boolean => {
  return LOG_BODY_PATHS.some(path => req.originalUrl.startsWith(path))
}

// 获取用户信息
const getUserInfo = (req: Request) => {
  const user = (req as any).user
  if (!user) return null

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    clinicId: user.clinicId
  }
}

// 请求日志中间件
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // 生成请求ID
  req.requestId = uuidv4()
  req.startTime = Date.now()

  // 设置响应头
  res.set('X-Request-ID', req.requestId)

  // 跳过健康检查和静态资源的日志
  const skipPaths = ['/health', '/favicon.ico', '/robots.txt']
  if (skipPaths.some(path => req.originalUrl.startsWith(path))) {
    return next()
  }

  // 收集请求信息
  const requestInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: getClientIp(req),
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString()
  }

  // 在开发环境或需要时记录请求体
  if ((config.isDevelopment || shouldLogBody(req)) && req.body) {
    (requestInfo as any).body = sanitizeData(req.body)
  }

  // 记录请求开始
  logger.info(`${req.method} ${req.originalUrl} - Started`, requestInfo)

  // 重写res.end方法以记录响应
  const originalEnd = res.end
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const responseTime = Date.now() - req.startTime
    const contentLength = res.get('Content-Length') || (chunk ? Buffer.byteLength(chunk) : 0)

    // 响应信息
    const responseInfo = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      contentLength,
      ip: getClientIp(req),
      userAgent: req.get('User-Agent'),
      user: getUserInfo(req),
      timestamp: new Date().toISOString()
    }

    // 根据状态码确定日志级别
    let logLevel: 'info' | 'warn' | 'error' = 'info'
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logLevel = 'warn'
    } else if (res.statusCode >= 500) {
      logLevel = 'error'
    }

    // 记录响应日志
    logger[logLevel](
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`,
      responseInfo
    )

    // 记录审计日志
    if (shouldAuditLog(req, res)) {
      recordAuditLog(req, res, responseTime)
    }

    // 调用原始的end方法
    originalEnd.call(this, chunk, encoding, cb)
  }

  next()
}

// 判断是否需要记录审计日志
const shouldAuditLog = (req: Request, res: Response): boolean => {
  // 只记录成功的写操作
  if (res.statusCode >= 400) return false

  const method = req.method.toUpperCase()
  const operations = AUDIT_OPERATIONS[method as keyof typeof AUDIT_OPERATIONS]
  
  return !!operations && req.originalUrl.startsWith('/api/')
}

// 记录审计日志
const recordAuditLog = (req: Request, res: Response, responseTime: number) => {
  const user = getUserInfo(req)
  const method = req.method.toUpperCase()
  
  // 确定操作类型
  let action = 'unknown'
  if (method === 'POST') action = 'create'
  else if (method === 'PUT' || method === 'PATCH') action = 'update'
  else if (method === 'DELETE') action = 'delete'

  // 从URL推断资源类型
  const urlParts = req.originalUrl.split('/')
  const resourceType = urlParts[2] || 'unknown' // /api/users -> users

  const auditData = {
    requestId: req.requestId,
    userId: user?.id,
    username: user?.username,
    role: user?.role,
    action,
    resourceType,
    resourceUrl: req.originalUrl,
    method: req.method,
    ip: getClientIp(req),
    userAgent: req.get('User-Agent'),
    statusCode: res.statusCode,
    responseTime,
    requestData: shouldLogBody(req) ? sanitizeData(req.body) : undefined,
    timestamp: new Date().toISOString()
  }

  auditLogger.info('User Action', auditData)
}

// 错误日志中间件（用于记录未捕获的错误）
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const errorInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: getClientIp(req),
    userAgent: req.get('User-Agent'),
    user: getUserInfo(req),
    error: {
      name: error.name,
      message: error.message,
      stack: config.isDevelopment ? error.stack : undefined
    },
    timestamp: new Date().toISOString()
  }

  logger.error('Request Error', errorInfo)
  next(error)
}

// 慢请求日志中间件
export const slowRequestLogger = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalEnd = res.end
    
    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      const responseTime = Date.now() - req.startTime
      
      if (responseTime > threshold) {
        const slowRequestInfo = {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          responseTime,
          threshold,
          statusCode: res.statusCode,
          user: getUserInfo(req),
          ip: getClientIp(req),
          timestamp: new Date().toISOString()
        }
        
        logger.warn(`Slow Request Detected - ${responseTime}ms`, slowRequestInfo)
      }
      
      originalEnd.call(this, chunk, encoding, cb)
    }
    
    next()
  }
}
