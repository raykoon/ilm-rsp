'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md mx-auto"
      >
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-3xl font-bold text-gray-900 mb-4"
        >
          访问被拒绝
        </motion.h1>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-gray-600 mb-8 space-y-2"
        >
          <p>抱歉，您没有访问此页面的权限。</p>
          <p>请联系管理员获取相应的访问权限，或返回到您有权限访问的页面。</p>
        </motion.div>

        {/* Error Code */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-6xl font-bold text-red-200 mb-8"
        >
          403
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回上一页
          </Button>
          
          <Button
            onClick={() => router.push('/')}
            className="medical-primary flex items-center"
          >
            <Home className="w-4 h-4 mr-2" />
            回到首页
          </Button>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 p-4 bg-gray-100 rounded-lg"
        >
          <p className="text-sm text-gray-600 mb-2">
            <strong>需要帮助？</strong>
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>• 联系系统管理员申请权限</p>
            <p>• 发送邮件至: admin@ilm-rsp.com</p>
            <p>• 拨打客服电话: 400-123-4567</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
