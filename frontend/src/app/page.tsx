'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Stethoscope, 
  Users, 
  ClipboardList, 
  Brain, 
  Activity, 
  Award,
  ArrowRight,
  Shield,
  Zap,
  HeartHandshake 
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI智能分析',
    description: '先进的人工智能技术，精准分析口腔影像，提供专业诊断建议'
  },
  {
    icon: Zap,
    title: '快速筛查',
    description: '3分钟完成全面筛查，大幅提升门诊效率，减少患者等待时间'
  },
  {
    icon: ClipboardList,
    title: '智能报告',
    description: '自动生成专业报告，包含详细分析和治疗建议，支持多种格式导出'
  },
  {
    icon: Shield,
    title: '数据安全',
    description: '医疗级数据加密，符合HIPAA标准，确保患者隐私和数据安全'
  },
  {
    icon: Users,
    title: '多角色管理',
    description: '支持管理员、医生、护士、患者多种角色，权限分级管理'
  },
  {
    icon: Award,
    title: '专业认证',
    description: '基于循证医学，算法经过大量临床验证，确保诊断准确性'
  }
]

const stats = [
  { value: '50,000+', label: '累计筛查次数' },
  { value: '500+', label: '合作机构' },
  { value: '98.5%', label: '诊断准确率' },
  { value: '3min', label: '平均筛查时长' }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Stethoscope className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">儿童口腔筛查平台</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
            产品特色
          </Link>
          <Link href="/solutions" className="text-gray-600 hover:text-gray-900 transition-colors">
            解决方案
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
            关于我们
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
            联系我们
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI赋能的
            <span className="text-blue-600"> 儿童口腔</span>
            <br />
            快速筛查平台
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            结合人工智能技术与专业医疗知识，为门诊提供高效、准确、智能的
            儿童口腔筛查和报告生成服务，让每个孩子都能获得最好的口腔健康照护。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-4 medical-primary">
              <Link href="/clinic" className="flex items-center">
                门诊入口
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Link href="/patient">患者查询</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-6">平台核心优势</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            我们致力于通过先进的AI技术和专业的医疗知识，
            为儿童口腔健康提供全方位的智能化解决方案
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card className="h-full card-hover border-0 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="medical-gradient py-20">
        <div className="container mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-4xl font-bold mb-6">开始您的智能筛查之旅</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              立即体验我们的AI口腔筛查平台，为您的患者提供更快速、更准确的诊断服务
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100"
              >
                <Link href="/admin" className="flex items-center">
                  <HeartHandshake className="mr-2 w-5 h-5" />
                  管理入口
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600"
              >
                <Link href="/demo">产品演示</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Stethoscope className="w-6 h-6" />
                <span className="text-lg font-semibold">ILM-RSP</span>
              </div>
              <p className="text-gray-400">
                专注于儿童口腔健康的AI智能筛查平台
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">产品服务</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">AI智能分析</Link></li>
                <li><Link href="/reports" className="hover:text-white">报告生成</Link></li>
                <li><Link href="/management" className="hover:text-white">数据管理</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">解决方案</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/clinic-solution" className="hover:text-white">门诊解决方案</Link></li>
                <li><Link href="/hospital-solution" className="hover:text-white">医院解决方案</Link></li>
                <li><Link href="/chain-solution" className="hover:text-white">连锁机构方案</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">联系我们</h3>
              <ul className="space-y-2 text-gray-400">
                <li>电话：400-123-4567</li>
                <li>邮箱：info@ilm-rsp.com</li>
                <li>地址：北京市朝阳区创新大厦</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ILM-RSP 儿童口腔筛查平台. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
