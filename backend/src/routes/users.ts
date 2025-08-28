import { Router } from 'express'
import { Request, Response } from 'express'

const router = Router()

// 获取当前用户信息
router.get('/profile', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        id: (req as any).user?.id,
        message: '用户信息获取成功'
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    })
  }
})

// 更新用户信息
router.put('/profile', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: '用户信息更新成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新用户信息失败'
    })
  }
})

export default router
