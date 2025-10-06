'use client'

import React, { useRef, useMemo } from 'react'
import { useVirtualization } from '@/hooks/useVirtualization'

interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (item: T, index: number) => React.ReactNode
  className?: string
}

interface VirtualizedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  itemHeight?: number
  height?: number
  className?: string
  onRowClick?: (item: T, index: number) => void
  loading?: boolean
  emptyMessage?: string
}

export function VirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  itemHeight = 60,
  height = 400,
  className = '',
  onRowClick,
  loading = false,
  emptyMessage = 'Nenhum item encontrado'
}: VirtualizedTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { virtualItems, totalHeight, containerProps } = useVirtualization({
    itemHeight,
    containerHeight: height,
    items: data,
    overscan: 5
  })

  const renderCell = (item: T, column: Column<T>, index: number) => {
    if (column.render) {
      return column.render(item, index)
    }
    
    const value = item[column.key as keyof T]
    return value?.toString() || '-'
  }

  if (loading) {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
            {columns.map((column, index) => (
              <div key={index} className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="p-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="grid gap-4 py-3" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
              {columns.map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
            {columns.map((column, index) => (
              <div key={index} className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {column.header}
              </div>
            ))}
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="text-gray-500 dark:text-gray-400 text-lg">{emptyMessage}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
          {columns.map((column, index) => (
            <div key={index} className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Body */}
      <div ref={containerRef} {...containerProps}>
        <div style={{ height: totalHeight, position: 'relative' }}>
          {virtualItems.map(({ index, start, item }) => (
            <div
              key={index}
              className={`
                absolute left-0 right-0 px-6 grid gap-4 items-center border-b border-gray-100 dark:border-gray-700
                hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
              style={{
                top: start,
                height: itemHeight,
                gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ')
              }}
              onClick={() => onRowClick?.(item, index)}
            >
              {columns.map((column, colIndex) => (
                <div key={colIndex} className={`text-sm text-gray-900 dark:text-gray-100 ${column.className || ''}`}>
                  {renderCell(item, column, index)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente para lista virtualizada simples
interface VirtualizedListProps<T> {
  data: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight?: number
  height?: number
  className?: string
  loading?: boolean
  emptyMessage?: string
}

export function VirtualizedList<T>({
  data,
  renderItem,
  itemHeight = 80,
  height = 400,
  className = '',
  loading = false,
  emptyMessage = 'Nenhum item encontrado'
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { virtualItems, totalHeight, containerProps } = useVirtualization({
    itemHeight,
    containerHeight: height,
    items: data,
    overscan: 3
  })

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`} style={{ height }}>
        {[...Array(Math.ceil(height / itemHeight))].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-gray-500 dark:text-gray-400 text-lg">{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className} {...containerProps}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index, start, item }) => (
          <div
            key={index}
            className="absolute left-0 right-0"
            style={{
              top: start,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}