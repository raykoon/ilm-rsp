'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Download, 
  Share2, 
  Printer, 
  FileText, 
  Calendar, 
  User, 
  MapPin,
  Phone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Stethoscope
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReportData {
  id: string
  patientInfo: {
    name: string
    age: number
    gender: string
    patientId: string
    guardianName?: string
    phone?: string
  }
  examinationInfo: {
    date: string
    doctor: string
    clinic: string
    type: string
  }
  findings: {
    summary: string
    details: Array<{
      category: string
      result: string
      severity: 'normal' | 'mild' | 'moderate' | 'severe'
      recommendations?: string[]
    }>
  }
  aiAnalysis: {
    confidence: number
    analysisTypes: string[]
    keyFindings: string[]
  }
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical'
    factors: string[]
  }
  recommendations: {
    immediate: string[]
    followUp: string[]
    preventive: string[]
  }
  nextSteps: string[]
  generatedAt: string
  reportType: 'professional' | 'patient_friendly'
}

interface ReportTemplateProps {
  data: ReportData
  className?: string
}

export default function ReportTemplate({ data, className }: ReportTemplateProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // 风险等级配置
  const getRiskConfig = (level: string) => {
    const configs = {
      low: { 
        color: 'text-green-600', 
        bgColor: 'bg-green-50', 
        borderColor: 'border-green-200',
        label: '低风险',
        icon: CheckCircle
      },
      medium: { 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-50', 
        borderColor: 'border-yellow-200',
        label: '中等风险',
        icon: Clock
      },
      high: { 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-50', 
        borderColor: 'border-orange-200',
        label: '高风险',
        icon: AlertTriangle
      },
      critical: { 
        color: 'text-red-600', 
        bgColor: 'bg-red-50', 
        borderColor: 'border-red-200',
        label: '严重风险',
        icon: AlertTriangle
      }
    }
    return configs[level as keyof typeof configs] || configs.low
  }

  // 严重程度配置
  const getSeverityConfig = (severity: string) => {
    const configs = {
      normal: { color: 'text-green-600', label: '正常' },
      mild: { color: 'text-blue-600', label: '轻微' },
      moderate: { color: 'text-yellow-600', label: '中等' },
      severe: { color: 'text-red-600', label: '严重' }
    }
    return configs[severity as keyof typeof configs] || configs.normal
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      // TODO: 实现PDF生成逻辑
      // 可以使用 jsPDF 或 Puppeteer 等库
      await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟生成时间
      
      // 模拟下载
      const link = document.createElement('a')
      link.href = '#'
      link.download = `口腔检查报告_${data.patientInfo.name}_${data.id}.pdf`
      link.click()
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.patientInfo.name} 的口腔检查报告`,
          text: `AI口腔筛查报告 - ${data.findings.summary}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('分享失败:', error)
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href)
      alert('报告链接已复制到剪贴板')
    }
  }

  const riskConfig = getRiskConfig(data.riskAssessment.level)
  const RiskIcon = riskConfig.icon

  return (
    <div className={className}>
      {/* 报告操作栏 */}
      <div className="flex flex-wrap gap-3 mb-6 print:hidden">
        <Button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>{isGeneratingPDF ? '生成中...' : '下载PDF'}</span>
        </Button>
        
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          打印报告
        </Button>
        
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          分享报告
        </Button>
      </div>

      {/* 报告主体 */}
      <motion.div
        ref={reportRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg rounded-lg overflow-hidden"
      >
        {/* 报告头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">儿童口腔AI筛查报告</h1>
                  <p className="text-blue-100">
                    {data.reportType === 'professional' ? '专业医疗报告' : '患者友好报告'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100">报告编号</p>
              <p className="text-xl font-mono">{data.id}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* 患者信息 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              患者信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-sm text-gray-500">姓名</p>
                <p className="font-medium">{data.patientInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">年龄</p>
                <p className="font-medium">{data.patientInfo.age} 岁</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">性别</p>
                <p className="font-medium">
                  {data.patientInfo.gender === 'male' ? '男' : 
                   data.patientInfo.gender === 'female' ? '女' : '其他'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">患者ID</p>
                <p className="font-medium font-mono">{data.patientInfo.patientId}</p>
              </div>
              {data.patientInfo.guardianName && (
                <div>
                  <p className="text-sm text-gray-500">监护人</p>
                  <p className="font-medium">{data.patientInfo.guardianName}</p>
                </div>
              )}
              {data.patientInfo.phone && (
                <div>
                  <p className="text-sm text-gray-500">联系电话</p>
                  <p className="font-medium">{data.patientInfo.phone}</p>
                </div>
              )}
            </div>
          </section>

          {/* 检查信息 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
              检查信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">检查日期</p>
                  <p className="font-medium">{data.examinationInfo.date}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">检查医生</p>
                  <p className="font-medium">{data.examinationInfo.doctor}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">检查机构</p>
                  <p className="font-medium">{data.examinationInfo.clinic}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">检查类型</p>
                <p className="font-medium">{data.examinationInfo.type}</p>
              </div>
            </div>
          </section>

          {/* 风险评估 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">风险评估</h2>
            <div className={`border-2 rounded-lg p-4 ${riskConfig.borderColor} ${riskConfig.bgColor}`}>
              <div className="flex items-center space-x-3 mb-3">
                <RiskIcon className={`w-6 h-6 ${riskConfig.color}`} />
                <div>
                  <span className={`text-lg font-bold ${riskConfig.color}`}>
                    {riskConfig.label}
                  </span>
                  <p className="text-sm text-gray-600">综合风险评估结果</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-800">主要风险因素：</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {data.riskAssessment.factors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* AI分析结果 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI分析结果</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-blue-900">AI分析可信度</p>
                <span className="text-xl font-bold text-blue-600">
                  {(data.aiAnalysis.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${data.aiAnalysis.confidence * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-800 mb-2">分析类型：</p>
                <div className="flex flex-wrap gap-2">
                  {data.aiAnalysis.analysisTypes.map((type, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-2">关键发现：</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                  {data.aiAnalysis.keyFindings.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 检查结果详情 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">检查结果详情</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-800 mb-2">总体评估：</p>
              <p className="text-gray-600">{data.findings.summary}</p>
            </div>

            <div className="space-y-4">
              {data.findings.details.map((detail, index) => {
                const severityConfig = getSeverityConfig(detail.severity)
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{detail.category}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-100 ${severityConfig.color}`}>
                        {severityConfig.label}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{detail.result}</p>
                    {detail.recommendations && (
                      <div>
                        <p className="font-medium text-gray-800 mb-1">建议：</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {detail.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* 治疗建议 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">治疗建议</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  立即处理
                </h3>
                <ul className="space-y-2">
                  {data.recommendations.immediate.map((item, index) => (
                    <li key={index} className="text-sm text-red-700">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  后续跟进
                </h3>
                <ul className="space-y-2">
                  {data.recommendations.followUp.map((item, index) => (
                    <li key={index} className="text-sm text-yellow-700">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  预防保健
                </h3>
                <ul className="space-y-2">
                  {data.recommendations.preventive.map((item, index) => (
                    <li key={index} className="text-sm text-green-700">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 下一步计划 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">下一步计划</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ol className="list-decimal list-inside space-y-2">
                {data.nextSteps.map((step, index) => (
                  <li key={index} className="text-blue-800">{step}</li>
                ))}
              </ol>
            </div>
          </section>
        </div>

        {/* 报告尾部 */}
        <div className="bg-gray-50 border-t p-6">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              <p>报告生成时间: {data.generatedAt}</p>
              <p className="mt-1">本报告由AI辅助诊断系统生成，仅供参考，最终诊断请咨询专业医生</p>
            </div>
            <div className="text-right">
              <p>儿童口腔筛查平台</p>
              <p className="text-xs mt-1">AI赋能专业筛查</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
