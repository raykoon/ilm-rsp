import { BaseEntity, ReportStatus, AnalysisType } from './common'
import { User } from './auth'

// 机构/门诊
export interface Clinic extends BaseEntity {
  name: string
  code: string
  address?: string
  phone?: string
  contactPerson?: string
  licenseNumber?: string
  isActive: boolean
}

// 患者健康档案
export interface PatientProfile extends BaseEntity {
  patientId: string
  
  // 基本健康信息
  height?: number
  weight?: number
  bloodType?: string
  allergies?: string
  medicalHistory?: string
  medications?: string
  
  // 口腔特殊信息
  dentalHistory?: string
  orthodonticHistory?: string
  habits?: string
}

// 检查项目模板
export interface ExaminationTemplate extends BaseEntity {
  clinicId?: string
  name: string
  description?: string
  requiredImages: {
    required: AnalysisType[]
    optional: AnalysisType[]
  }
  analysisConfig: Record<string, any>
  reportTemplate?: string
  price?: number
  isActive: boolean
}

// 检查记录
export interface Examination extends BaseEntity {
  patientId: string
  doctorId: string
  clinicId?: string
  templateId?: string
  
  // 检查基本信息
  examinationDate: string
  chiefComplaint?: string
  presentIllness?: string
  clinicalFindings?: string
  preliminaryDiagnosis?: string
  
  // 状态信息
  status: ReportStatus
  notes?: string
  
  // 关联数据
  patient?: User
  doctor?: User
  clinic?: Clinic
  template?: ExaminationTemplate
  images?: Image[]
  aiAnalyses?: AIAnalysis[]
  report?: Report
}

// 影像文件
export interface Image extends BaseEntity {
  examinationId: string
  
  // 文件信息
  originalFilename: string
  storedFilename: string
  filePath: string
  fileSize?: number
  mimeType?: string
  
  // 影像信息
  imageType: AnalysisType
  captureDate?: string
  equipmentInfo?: Record<string, any>
  technicalParams?: Record<string, any>
  
  // 标注和预处理信息
  annotations?: Record<string, any>
  preprocessingParams?: Record<string, any>
}

// AI分析结果
export interface AIAnalysis extends BaseEntity {
  examinationId: string
  imageId?: string
  
  // 分析信息
  analysisType: AnalysisType
  modelVersion: string
  confidenceScore?: number
  processingTimeMs?: number
  
  // 分析结果
  rawResults: Record<string, any>
  structuredResults?: Record<string, any>
  keyFindings?: Record<string, any>
  riskAssessment?: Record<string, any>
  recommendations?: Record<string, any>
  
  // 质量控制
  qualityScore?: number
  qualityIssues?: Record<string, any>
}

// 综合报告
export interface Report extends BaseEntity {
  examinationId: string
  
  // 报告基本信息
  reportNumber: string
  reportDate: string
  
  // 报告内容
  executiveSummary?: string
  detailedFindings?: string
  aiAnalysisSummary?: Record<string, any>
  doctorAssessment?: string
  recommendations?: string
  followUpPlan?: string
  
  // 报告状态和审核
  status: ReportStatus
  reviewedBy?: string
  reviewedAt?: string
  reviewComments?: string
  
  // 报告生成信息
  templateUsed?: string
  generatedByAI: boolean
  humanReviewed: boolean
  
  // 关联数据
  examination?: Examination
  attachments?: ReportAttachment[]
}

// 报告附件
export interface ReportAttachment extends BaseEntity {
  reportId: string
  filename: string
  filePath: string
  fileType: string
  fileSize?: number
  description?: string
}

// 系统配置
export interface SystemConfig extends BaseEntity {
  configKey: string
  configValue: Record<string, any>
  configType: string
  description?: string
  isActive: boolean
}

// 操作日志
export interface AuditLog extends BaseEntity {
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  
  user?: User
}

// API请求类型
export interface CreateExaminationRequest {
  patientId: string
  templateId?: string
  chiefComplaint?: string
  presentIllness?: string
  clinicalFindings?: string
  preliminaryDiagnosis?: string
  notes?: string
}

export interface UpdateExaminationRequest {
  chiefComplaint?: string
  presentIllness?: string
  clinicalFindings?: string
  preliminaryDiagnosis?: string
  notes?: string
  status?: ReportStatus
}

export interface UploadImageRequest {
  examinationId: string
  imageType: AnalysisType
  file: File
  captureDate?: string
  equipmentInfo?: Record<string, any>
  technicalParams?: Record<string, any>
}

export interface CreateReportRequest {
  examinationId: string
  executiveSummary?: string
  detailedFindings?: string
  doctorAssessment?: string
  recommendations?: string
  followUpPlan?: string
  templateUsed?: string
}

export interface UpdateReportRequest {
  executiveSummary?: string
  detailedFindings?: string
  doctorAssessment?: string
  recommendations?: string
  followUpPlan?: string
  status?: ReportStatus
  reviewComments?: string
}

// 统计相关
export interface ExaminationStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  reviewed: number
}

export interface ClinicStats {
  totalExaminations: number
  totalPatients: number
  totalDoctors: number
  todayExaminations: number
  monthlyStats: Array<{
    month: string
    examinations: number
    reports: number
  }>
}

// 搜索和过滤
export interface ExaminationFilters {
  patientName?: string
  doctorId?: string
  status?: ReportStatus
  dateRange?: [string, string]
  imageType?: AnalysisType[]
}

export interface ReportFilters {
  reportNumber?: string
  status?: ReportStatus
  dateRange?: [string, string]
  doctorId?: string
  reviewedBy?: string
  generatedByAI?: boolean
}
