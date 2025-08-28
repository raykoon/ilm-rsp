'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 
      className={cn(
        'animate-spin text-blue-600',
        sizeClasses[size],
        className
      )} 
    />
  )
}

interface LoadingCardProps {
  title?: string
  description?: string
  className?: string
}

export function LoadingCard({ title = '加载中', description, className }: LoadingCardProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border',
      className
    )}>
      <LoadingSpinner size="lg" className="mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center">{description}</p>
      )}
    </div>
  )
}

interface LoadingOverlayProps {
  isVisible: boolean
  title?: string
  description?: string
}

export function LoadingOverlay({ isVisible, title = '处理中', description }: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
        <div className="flex flex-col items-center text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// 骨架屏组件
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
      <div className="space-y-2">
        <div className="bg-gray-200 h-4 rounded w-3/4"></div>
        <div className="bg-gray-200 h-4 rounded w-1/2"></div>
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center space-x-4">
          <div className="bg-gray-200 rounded-full h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="bg-gray-200 h-4 rounded w-3/4"></div>
            <div className="bg-gray-200 h-3 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {/* 表头 */}
      <div className="flex space-x-4 mb-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="bg-gray-200 h-4 rounded flex-1"></div>
        ))}
      </div>
      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 mb-2">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="bg-gray-200 h-8 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  )
}
