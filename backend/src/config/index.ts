import { z } from 'zod'

// 环境变量验证schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // 数据库配置
  DATABASE_URL: z.string().min(1, '数据库URL不能为空'),
  
  // Redis配置
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // JWT配置
  JWT_SECRET: z.string().min(32, 'JWT密钥长度至少32个字符'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // 文件存储配置
  UPLOAD_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).default('52428800'), // 50MB
  
  // MinIO配置
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.string().transform(Number).optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET: z.string().default('ilm-rsp-files'),
  
  // AI服务配置
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  AI_SERVICE_API_KEY: z.string().optional(),
  
  // 邮件配置（可选）
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  
  // 日志配置
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('./logs/app.log'),
  
  // API配置
  API_PREFIX: z.string().default('/api'),
  
  // CORS配置
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
})

// 解析和验证环境变量
const env = envSchema.parse(process.env)

// 导出配置对象
export const config = {
  // 基础配置
  env: env.NODE_ENV,
  port: env.PORT,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // 数据库配置
  database: {
    url: env.DATABASE_URL,
  },
  
  // Redis配置
  redis: {
    url: env.REDIS_URL,
  },
  
  // JWT配置
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  // 文件上传配置
  upload: {
    path: env.UPLOAD_PATH,
    maxFileSize: env.MAX_FILE_SIZE,
    allowedTypes: ['jpg', 'jpeg', 'png', 'tiff', 'dcm', 'pdf'],
    allowedMimeTypes: [
      'image/jpeg',
      'image/png', 
      'image/tiff',
      'application/dicom',
      'application/pdf'
    ],
  },
  
  // MinIO配置
  minio: {
    endpoint: env.MINIO_ENDPOINT || 'localhost',
    port: env.MINIO_PORT || 9000,
    accessKey: env.MINIO_ACCESS_KEY || 'admin',
    secretKey: env.MINIO_SECRET_KEY || 'admin123',
    bucket: env.MINIO_BUCKET,
    useSSL: env.NODE_ENV === 'production',
  },
  
  // AI服务配置
  aiService: {
    url: env.AI_SERVICE_URL,
    apiKey: env.AI_SERVICE_API_KEY,
    timeout: 60000, // 60秒超时
  },
  
  // 邮件配置
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: env.SMTP_USER && env.SMTP_PASS ? {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    } : undefined,
    from: env.SMTP_FROM || 'noreply@ilm-rsp.com',
  },
  
  // 日志配置
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
    maxFiles: 5,
    maxSize: '20m',
  },
  
  // API配置
  api: {
    prefix: env.API_PREFIX,
    version: 'v1',
  },
  
  // CORS配置
  cors: {
    origins: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  },
  
  // 安全配置
  security: {
    // 密码复杂度要求
    password: {
      minLength: 8,
      requireNumbers: true,
      requireLetters: true,
      requireSpecialChars: false,
    },
    // 账户锁定配置
    accountLockout: {
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15分钟
    },
    // Session配置
    session: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      cleanupInterval: 60 * 60 * 1000, // 1小时
    }
  },
  
  // 业务配置
  business: {
    // 报告编号生成配置
    reportNumber: {
      prefix: 'RPT',
      dateFormat: 'YYYYMMDD',
      sequence: {
        start: 1,
        pad: 4, // 补零位数
      }
    },
    // AI分析配置
    analysis: {
      maxRetries: 3,
      timeout: 300000, // 5分钟
      qualityThreshold: 0.8, // 质量分数阈值
    },
    // 数据保留配置
    retention: {
      auditLogs: 90, // 审计日志保留90天
      tempFiles: 7,  // 临时文件保留7天
    }
  }
} as const

export type Config = typeof config
