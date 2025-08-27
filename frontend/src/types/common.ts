export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    current: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface TableColumn<T = any> {
  key: string
  title: string
  dataIndex: keyof T
  width?: number | string
  align?: 'left' | 'center' | 'right'
  sorter?: boolean
  render?: (value: any, record: T, index: number) => React.ReactNode
}

export interface SearchFilters {
  keyword?: string
  status?: string
  dateRange?: [string, string]
  [key: string]: any
}

export interface SortConfig {
  field: string
  order: 'asc' | 'desc'
}

export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'reviewed'
export type AnalysisType = 'intraoral' | 'facial' | 'cephalometric' | 'panoramic' | '3d_model'

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// 通用的表格配置
export interface TableConfig<T = any> {
  columns: TableColumn<T>[]
  pagination: {
    current: number
    pageSize: number
    total: number
    showSizeChanger: boolean
    showQuickJumper: boolean
    showTotal: (total: number, range: [number, number]) => string
  }
  loading: boolean
  rowSelection?: {
    selectedRowKeys: string[]
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void
  }
}

// 通用的表单配置
export interface FormConfig {
  layout: 'horizontal' | 'vertical' | 'inline'
  labelCol?: { span: number }
  wrapperCol?: { span: number }
  requiredMark?: boolean
  colon?: boolean
}

// 文件上传相关
export interface UploadFile {
  id?: string
  name: string
  size: number
  type: string
  url?: string
  status: 'uploading' | 'done' | 'error' | 'removed'
  percent?: number
  response?: any
  error?: any
}

// 统计数据
export interface StatItem {
  title: string
  value: number | string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  precision?: number
  valueStyle?: React.CSSProperties
  trend?: 'up' | 'down'
  trendValue?: number
}

// 图表数据
export interface ChartData {
  name: string
  value: number
  [key: string]: any
}

export interface TimeSeriesData {
  date: string
  value: number
  [key: string]: any
}
