import { PrismaClient } from '@prisma/client'
import { config } from '@/config'
import { logger } from '@/utils/logger'

// 扩展PrismaClient类型以包含软删除中间件
declare global {
  var __prisma: PrismaClient | undefined
}

// 创建Prisma客户端实例
const createPrismaClient = () => {
  const prisma = new PrismaClient({
    log: config.isDevelopment 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    datasources: {
      db: {
        url: config.database.url,
      },
    },
  })

  // 添加查询日志中间件
  prisma.$use(async (params, next) => {
    const before = Date.now()
    const result = await next(params)
    const after = Date.now()
    
    if (config.isDevelopment) {
      logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`)
    }
    
    return result
  })

  // 添加审计日志中间件
  prisma.$use(async (params, next) => {
    // 对于写操作，记录审计日志
    if (['create', 'update', 'delete', 'upsert'].includes(params.action)) {
      // 这里可以添加审计日志逻辑
      // 暂时跳过，因为需要避免循环依赖
    }
    
    return next(params)
  })

  // 添加软删除中间件（如果需要）
  prisma.$use(async (params, next) => {
    // 对于具有 isActive 字段的模型，实现软删除
    if (params.action === 'delete') {
      if (['User', 'Clinic', 'ExaminationTemplate', 'SystemConfig'].includes(params.model || '')) {
        // 将删除操作转换为更新操作
        params.action = 'update'
        params.args.data = { isActive: false }
      }
    }
    
    if (params.action === 'deleteMany') {
      if (['User', 'Clinic', 'ExaminationTemplate', 'SystemConfig'].includes(params.model || '')) {
        // 将批量删除操作转换为批量更新操作
        params.action = 'updateMany'
        if (params.args.data) {
          params.args.data.isActive = false
        } else {
          params.args.data = { isActive: false }
        }
      }
    }
    
    return next(params)
  })

  return prisma
}

// 全局Prisma客户端实例
export const prisma = global.__prisma ?? createPrismaClient()

if (!config.isProduction) {
  global.__prisma = prisma
}

// 连接数据库
export async function connectDatabase() {
  try {
    await prisma.$connect()
    logger.info('数据库连接成功')
    
    // 运行数据库连接测试
    await prisma.$queryRaw`SELECT 1`
    logger.info('数据库连接测试通过')
    
  } catch (error) {
    logger.error('数据库连接失败:', error)
    throw error
  }
}

// 断开数据库连接
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    logger.info('数据库连接已断开')
  } catch (error) {
    logger.error('断开数据库连接时出错:', error)
    throw error
  }
}

// 数据库健康检查
export async function checkDatabaseHealth() {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const end = Date.now()
    
    return {
      status: 'healthy',
      responseTime: end - start,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('数据库健康检查失败:', error)
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// 数据库统计信息
export async function getDatabaseStats() {
  try {
    const [
      userCount,
      clinicCount,
      examinationCount,
      reportCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.clinic.count(),
      prisma.examination.count(),
      prisma.report.count()
    ])

    return {
      users: userCount,
      clinics: clinicCount,
      examinations: examinationCount,
      reports: reportCount,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('获取数据库统计信息失败:', error)
    throw error
  }
}

// 清理过期数据
export async function cleanupExpiredData() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    // 清理过期的审计日志
    const deletedLogs = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    })
    
    logger.info(`清理了 ${deletedLogs.count} 条过期审计日志`)
    
    return {
      auditLogsDeleted: deletedLogs.count,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('清理过期数据失败:', error)
    throw error
  }
}

// 数据库事务助手
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback)
}
