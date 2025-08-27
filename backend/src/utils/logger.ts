import winston from 'winston'
import { config } from '@/config'
import fs from 'fs'
import path from 'path'

// 确保日志目录存在
const logDir = path.dirname(config.logging.file)
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// 自定义日志格式
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      log += ' ' + JSON.stringify(meta, null, 2)
    }
    
    return log
  })
)

// 控制台格式（开发环境）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`
    
    // 在开发环境下，简化元数据显示
    if (Object.keys(meta).length > 0) {
      const cleanMeta = { ...meta }
      delete cleanMeta.timestamp
      delete cleanMeta.level
      delete cleanMeta.message
      
      if (Object.keys(cleanMeta).length > 0) {
        log += ' ' + JSON.stringify(cleanMeta, null, 2)
      }
    }
    
    return log
  })
)

// 创建Winston logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  defaultMeta: {
    service: 'ilm-rsp-backend',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // 文件传输
    new winston.transports.File({
      filename: config.logging.file,
      level: config.logging.level,
      maxFiles: config.logging.maxFiles,
      maxsize: 20 * 1024 * 1024, // 20MB
      tailable: true,
      zippedArchive: true,
    }),
    
    // 错误日志单独文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxFiles: config.logging.maxFiles,
      maxsize: 10 * 1024 * 1024, // 10MB
      tailable: true,
      zippedArchive: true,
    })
  ],
  
  // 未捕获异常处理
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxFiles: 3,
      maxsize: 10 * 1024 * 1024,
      tailable: true,
    })
  ],
  
  // 未处理的Promise拒绝
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxFiles: 3,
      maxsize: 10 * 1024 * 1024,
      tailable: true,
    })
  ]
})

// 开发环境添加控制台输出
if (!config.isProduction) {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }))
}

// 日志工具类
export class Logger {
  private context?: string

  constructor(context?: string) {
    this.context = context
  }

  private formatMessage(message: string, meta?: any): [string, any] {
    const formattedMessage = this.context ? `[${this.context}] ${message}` : message
    const formattedMeta = {
      ...meta,
      ...(this.context && { context: this.context })
    }
    return [formattedMessage, formattedMeta]
  }

  error(message: string, meta?: any) {
    const [formattedMessage, formattedMeta] = this.formatMessage(message, meta)
    logger.error(formattedMessage, formattedMeta)
  }

  warn(message: string, meta?: any) {
    const [formattedMessage, formattedMeta] = this.formatMessage(message, meta)
    logger.warn(formattedMessage, formattedMeta)
  }

  info(message: string, meta?: any) {
    const [formattedMessage, formattedMeta] = this.formatMessage(message, meta)
    logger.info(formattedMessage, formattedMeta)
  }

  debug(message: string, meta?: any) {
    const [formattedMessage, formattedMeta] = this.formatMessage(message, meta)
    logger.debug(formattedMessage, formattedMeta)
  }

  // HTTP请求日志
  http(method: string, url: string, statusCode: number, responseTime: number, meta?: any) {
    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`
    const [formattedMessage, formattedMeta] = this.formatMessage(message, {
      ...meta,
      method,
      url,
      statusCode,
      responseTime
    })
    logger.info(formattedMessage, formattedMeta)
  }

  // 数据库查询日志
  query(query: string, duration: number, meta?: any) {
    const message = `Query executed in ${duration}ms`
    const [formattedMessage, formattedMeta] = this.formatMessage(message, {
      ...meta,
      query: query.substring(0, 100), // 截断长查询
      duration
    })
    logger.debug(formattedMessage, formattedMeta)
  }

  // 安全日志
  security(event: string, details: any, meta?: any) {
    const message = `Security Event: ${event}`
    const [formattedMessage, formattedMeta] = this.formatMessage(message, {
      ...meta,
      security: true,
      event,
      details
    })
    logger.warn(formattedMessage, formattedMeta)
  }

  // 业务日志
  business(action: string, details: any, meta?: any) {
    const message = `Business Action: ${action}`
    const [formattedMessage, formattedMeta] = this.formatMessage(message, {
      ...meta,
      business: true,
      action,
      details
    })
    logger.info(formattedMessage, formattedMeta)
  }
}

// 创建带上下文的logger实例
export const createLogger = (context: string): Logger => {
  return new Logger(context)
}

// 默认logger实例
export { logger }

// 审计日志专用logger
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'audit.log'),
      maxFiles: 10,
      maxsize: 50 * 1024 * 1024, // 50MB
      tailable: true,
      zippedArchive: true,
    })
  ]
})

// 性能监控logger
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'performance.log'),
      maxFiles: 5,
      maxsize: 20 * 1024 * 1024, // 20MB
      tailable: true,
      zippedArchive: true,
    })
  ]
})

// 日志清理函数
export const cleanupLogs = () => {
  // Winston会自动处理日志轮转和清理
  logger.info('日志清理检查完成')
}
