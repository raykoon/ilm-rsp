import { Router } from 'express'
import { body } from 'express-validator'
import { AuthController } from '@/controllers/AuthController'
import { asyncHandler } from '@/middleware/errorHandler'
import { authMiddleware, optionalAuth } from '@/middleware/auth'

const router = Router()
const authController = new AuthController()

// 登录验证规则
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('密码不能为空')
]

// 注册验证规则
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名长度为3-50个字符，只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('密码至少8位，必须包含字母和数字'),
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('姓名长度为2-100个字符'),
  body('role')
    .isIn(['admin', 'doctor', 'nurse', 'patient'])
    .withMessage('无效的角色类型'),
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  body('clinicId')
    .optional()
    .isUUID()
    .withMessage('无效的机构ID')
]

// 修改密码验证规则
const changePasswordValidation = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('请输入当前密码'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('新密码至少8位，必须包含字母和数字'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('确认密码与新密码不匹配')
      }
      return true
    })
]

// 重置密码验证规则
const resetPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址')
]

// 更新个人信息验证规则
const updateProfileValidation = [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('姓名长度为2-100个字符'),
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  body('specialty')
    .optional()
    .isLength({ max: 100 })
    .withMessage('专业科室长度不能超过100个字符'),
  body('title')
    .optional()
    .isLength({ max: 50 })
    .withMessage('职称长度不能超过50个字符')
]

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', loginValidation, asyncHandler(authController.login))

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public (或需要管理员权限，根据业务需求)
 */
router.post('/register', registerValidation, asyncHandler(authController.register))

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authMiddleware, asyncHandler(authController.logout))

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新访问令牌
 * @access  Public
 */
router.post('/refresh', asyncHandler(authController.refreshToken))

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authMiddleware, asyncHandler(authController.getCurrentUser))

/**
 * @route   PUT /api/auth/profile
 * @desc    更新个人信息
 * @access  Private
 */
router.put('/profile', authMiddleware, updateProfileValidation, asyncHandler(authController.updateProfile))

/**
 * @route   PUT /api/auth/password
 * @desc    修改密码
 * @access  Private
 */
router.put('/password', authMiddleware, changePasswordValidation, asyncHandler(authController.changePassword))

/**
 * @route   POST /api/auth/forgot-password
 * @desc    申请重置密码
 * @access  Public
 */
router.post('/forgot-password', resetPasswordValidation, asyncHandler(authController.forgotPassword))

/**
 * @route   POST /api/auth/reset-password
 * @desc    重置密码
 * @access  Public
 */
router.post('/reset-password', [
  body('token')
    .isLength({ min: 1 })
    .withMessage('重置令牌不能为空'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('密码至少8位，必须包含字母和数字')
], asyncHandler(authController.resetPassword))

/**
 * @route   POST /api/auth/verify-email
 * @desc    验证邮箱
 * @access  Public
 */
router.post('/verify-email', [
  body('token')
    .isLength({ min: 1 })
    .withMessage('验证令牌不能为空')
], asyncHandler(authController.verifyEmail))

/**
 * @route   POST /api/auth/resend-verification
 * @desc    重新发送邮箱验证
 * @access  Private
 */
router.post('/resend-verification', authMiddleware, asyncHandler(authController.resendVerification))

/**
 * @route   GET /api/auth/sessions
 * @desc    获取用户会话列表
 * @access  Private
 */
router.get('/sessions', authMiddleware, asyncHandler(authController.getUserSessions))

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    终止指定会话
 * @access  Private
 */
router.delete('/sessions/:sessionId', authMiddleware, asyncHandler(authController.terminateSession))

/**
 * @route   DELETE /api/auth/sessions
 * @desc    终止所有其他会话
 * @access  Private
 */
router.delete('/sessions', authMiddleware, asyncHandler(authController.terminateAllSessions))

/**
 * @route   GET /api/auth/check
 * @desc    检查认证状态
 * @access  Public (可选认证)
 */
router.get('/check', optionalAuth, asyncHandler(authController.checkAuth))

export default router
