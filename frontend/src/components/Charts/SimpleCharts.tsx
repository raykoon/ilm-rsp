'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  FileText, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

// 简单统计卡片
interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'blue', 
  className 
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  }

  return (
    <div className={cn(
      'p-6 rounded-lg border-2 transition-all hover:shadow-md',
      colorClasses[color],
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2 space-x-1">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className="text-2xl opacity-80">
          {icon}
        </div>
      </div>
    </div>
  )
}

// 简单进度条
interface ProgressBarProps {
  label: string
  value: number
  max: number
  color?: 'blue' | 'green' | 'yellow' | 'red'
  showPercentage?: boolean
  className?: string
}

export function ProgressBar({ 
  label, 
  value, 
  max, 
  color = 'blue', 
  showPercentage = true,
  className 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={cn('h-2 rounded-full transition-all duration-500', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{value}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

// 简单饼图（使用CSS实现）
interface PieChartData {
  label: string
  value: number
  color: string
}

interface SimplePieChartProps {
  data: PieChartData[]
  title: string
  className?: string
}

export function SimplePieChart({ data, title, className }: SimplePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  return (
    <div className={cn('p-4 bg-white rounded-lg shadow-sm border', className)}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="flex items-center justify-center mb-4">
        {/* 简单的环形图显示 */}
        <div className="relative w-32 h-32">
          <div className="w-full h-full bg-gray-200 rounded-full">
            {/* 这里可以用更复杂的SVG实现，目前用简单的样式 */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(${data.map((item, index) => {
                  const percentage = (item.value / total) * 100
                  const prevPercentage = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 100, 0)
                  return `${item.color} ${prevPercentage}% ${prevPercentage + percentage}%`
                }).join(', ')})`
              }}
            />
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold">{total}</div>
                <div className="text-xs text-gray-500">总数</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 图例 */}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
            <div className="text-sm font-medium">
              {item.value} ({((item.value / total) * 100).toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 简单柱状图
interface BarChartData {
  label: string
  value: number
}

interface SimpleBarChartProps {
  data: BarChartData[]
  title: string
  color?: string
  className?: string
}

export function SimpleBarChart({ data, title, color = '#3B82F6', className }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(item => item.value))
  
  return (
    <div className={cn('p-4 bg-white rounded-lg shadow-sm border', className)}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className="text-sm text-gray-500">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: color
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 状态指示器
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info'
  label: string
  count?: number
  className?: string
}

export function StatusIndicator({ status, label, count, className }: StatusIndicatorProps) {
  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    warning: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    info: {
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  }
  
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <div className={cn(
      'flex items-center space-x-2 px-3 py-2 rounded-lg',
      config.bgColor,
      className
    )}>
      <Icon className={cn('w-4 h-4', config.color)} />
      <span className="text-sm font-medium">{label}</span>
      {count !== undefined && (
        <span className={cn('text-sm font-bold', config.color)}>
          ({count})
        </span>
      )}
    </div>
  )
}

// 简单仪表盘卡片组合
interface DashboardStatsProps {
  stats: {
    totalPatients: number
    totalExaminations: number
    completedReports: number
    pendingReports: number
    completionRate: number
  }
  className?: string
}

export function DashboardStats({ stats, className }: DashboardStatsProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <StatCard
        title="总患者数"
        value={stats.totalPatients}
        icon={<Users />}
        color="blue"
      />
      
      <StatCard
        title="总检查数"
        value={stats.totalExaminations}
        icon={<Activity />}
        color="green"
        trend={stats.totalExaminations > 0 ? { value: 12, isPositive: true } : undefined}
      />
      
      <StatCard
        title="已完成报告"
        value={stats.completedReports}
        icon={<CheckCircle />}
        color="purple"
      />
      
      <StatCard
        title="待处理报告"
        value={stats.pendingReports}
        icon={<Clock />}
        color={stats.pendingReports > 5 ? "red" : "yellow"}
      />
    </div>
  )
}
