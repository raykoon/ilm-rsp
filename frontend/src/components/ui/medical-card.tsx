import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface MedicalCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  trend?: {
    value: string
    isPositive: boolean
  }
  variant?: 'primary' | 'secondary' | 'accent' | 'warning'
  className?: string
  children?: React.ReactNode
}

export function MedicalCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'primary',
  className,
  children
}: MedicalCardProps) {
  const variantClasses = {
    primary: "bg-white border-gray-200 hover:shadow-md",
    secondary: "bg-white border-blue-200 hover:shadow-md",
    accent: "bg-white border-purple-200 hover:shadow-md",
    warning: "bg-white border-amber-200 hover:shadow-md"
  }

  const iconColors = {
    primary: "bg-gray-50 text-gray-600",
    secondary: "bg-blue-50 text-blue-600",
    accent: "bg-purple-50 text-purple-600", 
    warning: "bg-amber-50 text-amber-600"
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "border transition-all duration-200",
        variantClasses[variant],
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {Icon && (
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                iconColors[variant]
              )}>
                <Icon className="h-5 w-5" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-3xl font-bold text-gray-900">
              {value}
            </div>
            
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
            
            {trend && (
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-xs border font-medium",
                    trend.isPositive 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-red-50 text-red-700 border-red-200"
                  )}
                >
                  {trend.value}
                </Badge>
                <span className="text-xs text-gray-500">
                  较上期
                </span>
              </div>
            )}

            {children && (
              <div className="mt-4">
                {children}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// 图表卡片组件
interface ChartCardProps {
  title: string
  description?: string
  className?: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent'
}

export function ChartCard({
  title,
  description,
  className,
  children,
  variant = 'primary'
}: ChartCardProps) {
  const variantClasses = {
    primary: "bg-white border-gray-200",
    secondary: "bg-white border-blue-200",
    accent: "bg-white border-purple-200"
  }

  return (
    <Card className={cn(
      "border shadow-sm",
      variantClasses[variant],
      className
    )}>
      <CardHeader>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

// 状态指示器组件
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'error'
  label: string
  className?: string
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  const statusConfig = {
    online: {
      color: "bg-green-500",
      text: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200"
    },
    offline: {
      color: "bg-gray-500",
      text: "text-gray-700", 
      bg: "bg-gray-50",
      border: "border-gray-200"
    },
    warning: {
      color: "bg-amber-500",
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200"
    },
    error: {
      color: "bg-red-500",
      text: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200"
    }
  }

  const config = statusConfig[status]

  return (
    <div className={cn(
      "flex items-center space-x-2 rounded-lg border px-3 py-2",
      config.bg,
      config.border,
      className
    )}>
      <div className={cn("h-2 w-2 rounded-full", config.color)} />
      <span className={cn("text-sm font-medium", config.text)}>{label}</span>
    </div>
  )
}