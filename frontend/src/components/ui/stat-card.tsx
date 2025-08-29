import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  trend?: {
    value: string
    isPositive: boolean
  }
  variant?: 'default' | 'outline' | 'elevated'
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
  className
}: StatCardProps) {
  const baseClasses = "transition-all duration-200 hover:shadow-md"
  
  const variantClasses = {
    default: "bg-white border border-gray-200",
    outline: "bg-white border-2 border-gray-200",
    elevated: "bg-white shadow-sm border border-gray-100"
  }

  return (
    <Card className={cn(baseClasses, variantClasses[variant], className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
              <Icon className="h-4 w-4 text-gray-600" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-2xl font-semibold text-gray-900">
            {value}
          </div>
          
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
          
          {trend && (
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary"
                className={cn(
                  "text-xs",
                  trend.isPositive 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                )}
              >
                {trend.value}
              </Badge>
              <span className="text-xs text-gray-500">
                {trend.isPositive ? "较上期" : "较上期"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
