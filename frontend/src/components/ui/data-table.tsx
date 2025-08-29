'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Column<T> {
  key: keyof T | 'actions'
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  loading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onSearch?: (query: string) => void
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  actions?: {
    view?: boolean
    edit?: boolean
    delete?: boolean
    custom?: Array<{
      label: string
      icon?: React.ComponentType<{ className?: string }>
      onClick: (row: T) => void
      variant?: 'default' | 'destructive'
    }>
  }
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "搜索...",
  loading = false,
  pagination,
  onPageChange,
  onSearch,
  onView,
  onEdit,
  onDelete,
  actions = { view: true, edit: true, delete: true }
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const hasActions = actions.view || actions.edit || actions.delete || (actions.custom && actions.custom.length > 0)

  return (
    <div className="space-y-4">
      {/* 搜索和筛选栏 */}
      {searchable && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </div>
      )}

      {/* 数据表格 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={`${column.width || ''} ${
                    column.key === 'actions' ? 'text-center' : ''
                  }`}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500">加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.key === 'actions' ? (
                        hasActions && (
                          <div className="flex justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {actions.view && (
                                  <DropdownMenuItem onClick={() => onView?.(row)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    查看
                                  </DropdownMenuItem>
                                )}
                                {actions.edit && (
                                  <DropdownMenuItem onClick={() => onEdit?.(row)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    编辑
                                  </DropdownMenuItem>
                                )}
                                {actions.custom?.map((customAction, actionIndex) => (
                                  <DropdownMenuItem 
                                    key={actionIndex}
                                    onClick={() => customAction.onClick(row)}
                                  >
                                    {customAction.icon && (
                                      <customAction.icon className="h-4 w-4 mr-2" />
                                    )}
                                    {customAction.label}
                                  </DropdownMenuItem>
                                ))}
                                {actions.delete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => onDelete?.(row)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      删除
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )
                      ) : column.render ? (
                        column.render(row[column.key], row)
                      ) : (
                        row[column.key]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">每页显示</p>
              <Select
                value={pagination.limit.toString()}
                onValueChange={(value) => {
                  // 这里可以添加每页数量变更的逻辑
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-700">
              显示第 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 项，共 {pagination.total} 项
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              上一页
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNumber
                if (pagination.totalPages <= 5) {
                  pageNumber = i + 1
                } else if (pagination.page <= 3) {
                  pageNumber = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNumber = pagination.totalPages - 4 + i
                } else {
                  pageNumber = pagination.page - 2 + i
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={pagination.page === pageNumber ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8"
                    onClick={() => onPageChange?.(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              下一页
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
