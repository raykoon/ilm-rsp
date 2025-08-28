import { Router } from 'express'
import { Request, Response } from 'express'

const router = Router()

// 登录接口
router.post('/login', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 1,
          username: 'admin',
          role: 'admin'
        }
      },
      message: '登录成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登录失败'
    })
  }
})

// 注册接口
router.post('/register', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: '注册成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '注册失败'
    })
  }
})

// 登出接口
router.post('/logout', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: '登出成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登出失败'
    })
  }
})

export default router