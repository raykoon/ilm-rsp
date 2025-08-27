import { createClient, RedisClientType } from 'redis'
import { config } from '@/config'
import { logger } from '@/utils/logger'

// Redis客户端实例
let redisClient: RedisClientType | null = null

// 创建Redis客户端
export function createRedisClient(): RedisClientType {
  const client = createClient({
    url: config.redis.url,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          logger.error('Redis重连次数过多，停止重连')
          return false
        }
        const delay = Math.min(retries * 50, 3000)
        logger.warn(`Redis连接失败，${delay}ms后重试 (第${retries}次)`)
        return delay
      },
      connectTimeout: 10000,
      lazyConnect: true,
    },
  })

  // 错误处理
  client.on('error', (error) => {
    logger.error('Redis连接错误:', error)
  })

  client.on('connect', () => {
    logger.info('Redis连接中...')
  })

  client.on('ready', () => {
    logger.info('Redis连接就绪')
  })

  client.on('end', () => {
    logger.warn('Redis连接已断开')
  })

  client.on('reconnecting', () => {
    logger.info('Redis重新连接中...')
  })

  return client
}

// 连接Redis
export async function connectRedis(): Promise<void> {
  try {
    if (!redisClient) {
      redisClient = createRedisClient()
    }

    if (!redisClient.isOpen) {
      await redisClient.connect()
    }

    // 测试连接
    await redisClient.ping()
    logger.info('Redis连接测试通过')
    
  } catch (error) {
    logger.error('Redis连接失败:', error)
    throw error
  }
}

// 断开Redis连接
export async function disconnectRedis(): Promise<void> {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit()
      logger.info('Redis连接已断开')
    }
  } catch (error) {
    logger.error('断开Redis连接时出错:', error)
    throw error
  }
}

// 获取Redis客户端
export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis客户端未初始化，请先调用connectRedis()')
  }
  return redisClient
}

// Redis健康检查
export async function checkRedisHealth() {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return {
        status: 'disconnected',
        timestamp: new Date().toISOString()
      }
    }

    const start = Date.now()
    await redisClient.ping()
    const end = Date.now()

    return {
      status: 'healthy',
      responseTime: end - start,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Redis健康检查失败:', error)
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// Redis工具类
export class RedisService {
  private client: RedisClientType

  constructor() {
    this.client = getRedisClient()
  }

  // 设置缓存
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue)
      } else {
        await this.client.set(key, serializedValue)
      }
    } catch (error) {
      logger.error(`设置Redis缓存失败 [${key}]:`, error)
      throw error
    }
  }

  // 获取缓存
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      logger.error(`获取Redis缓存失败 [${key}]:`, error)
      return null
    }
  }

  // 删除缓存
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      logger.error(`删除Redis缓存失败 [${key}]:`, error)
      throw error
    }
  }

  // 批量删除缓存（通过模式匹配）
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0
      return await this.client.del(keys)
    } catch (error) {
      logger.error(`批量删除Redis缓存失败 [${pattern}]:`, error)
      throw error
    }
  }

  // 检查key是否存在
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error(`检查Redis key存在性失败 [${key}]:`, error)
      return false
    }
  }

  // 设置过期时间
  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds)
    } catch (error) {
      logger.error(`设置Redis key过期时间失败 [${key}]:`, error)
      throw error
    }
  }

  // 获取剩余过期时间
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key)
    } catch (error) {
      logger.error(`获取Redis key过期时间失败 [${key}]:`, error)
      return -1
    }
  }

  // Hash操作
  async hSet(key: string, field: string, value: any): Promise<void> {
    try {
      await this.client.hSet(key, field, JSON.stringify(value))
    } catch (error) {
      logger.error(`设置Redis Hash失败 [${key}:${field}]:`, error)
      throw error
    }
  }

  async hGet<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.client.hGet(key, field)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      logger.error(`获取Redis Hash失败 [${key}:${field}]:`, error)
      return null
    }
  }

  async hDel(key: string, field: string): Promise<void> {
    try {
      await this.client.hDel(key, field)
    } catch (error) {
      logger.error(`删除Redis Hash失败 [${key}:${field}]:`, error)
      throw error
    }
  }

  // List操作
  async lPush(key: string, ...values: any[]): Promise<void> {
    try {
      const serializedValues = values.map(v => JSON.stringify(v))
      await this.client.lPush(key, serializedValues)
    } catch (error) {
      logger.error(`Redis List推入失败 [${key}]:`, error)
      throw error
    }
  }

  async lPop<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.lPop(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      logger.error(`Redis List弹出失败 [${key}]:`, error)
      return null
    }
  }

  async lLen(key: string): Promise<number> {
    try {
      return await this.client.lLen(key)
    } catch (error) {
      logger.error(`获取Redis List长度失败 [${key}]:`, error)
      return 0
    }
  }

  // 原子递增
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key)
    } catch (error) {
      logger.error(`Redis递增失败 [${key}]:`, error)
      throw error
    }
  }

  // 原子递减
  async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key)
    } catch (error) {
      logger.error(`Redis递减失败 [${key}]:`, error)
      throw error
    }
  }
}

// 缓存key生成器
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userSessions: (userId: string) => `user:sessions:${userId}`,
  clinic: (id: string) => `clinic:${id}`,
  examination: (id: string) => `examination:${id}`,
  report: (id: string) => `report:${id}`,
  aiAnalysis: (id: string) => `ai_analysis:${id}`,
  stats: (type: string, period?: string) => period ? `stats:${type}:${period}` : `stats:${type}`,
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,
  failedLogin: (ip: string) => `failed_login:${ip}`,
  emailVerification: (email: string) => `email_verify:${email}`,
  passwordReset: (token: string) => `pwd_reset:${token}`,
} as const
