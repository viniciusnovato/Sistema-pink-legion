'use client'

import React, { Suspense, ComponentType, ReactNode } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Loading padrão
const DefaultLoading = () => <LoadingSpinner />

// Skeleton loaders específicos
const TableSkeleton = () => (
  <div className="space-y-4">
    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
  </div>
)

const CardSkeleton = () => (
  <div className="p-4 border rounded-lg">
    <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
  </div>
)

// Lazy loading para formulários complexos (comentado até os componentes serem criados)
/*
export const LazyClientForm = dynamic(
  () => import('@/components/forms/ClientForm'),
  {
    loading: () => (
      <div className="space-y-4 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    ),
    ssr: false
  }
)

export const LazyCarForm = dynamic(
  () => import('@/components/forms/CarForm'),
  {
    loading: () => (
      <div className="space-y-4 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    ),
    ssr: false
  }
)

// Lazy loading para gráficos e charts (se houver)
export const LazyChart = dynamic(
  () => import('@/components/charts/Chart'),
  {
    loading: () => (
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando gráfico...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

// Lazy loading para componentes de relatórios
export const LazyReportGenerator = dynamic(
  () => import('@/components/reports/ReportGenerator'),
  {
    loading: () => (
      <div className="space-y-4 p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    ),
    ssr: false
  }
)

// Lazy loading para upload de arquivos
export const LazyFileUpload = dynamic(
  () => import('@/components/ui/FileUpload'),
  {
    loading: () => (
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
        <div className="text-center">
          <LoadingSpinner size="md" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando upload...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

// Lazy loading para editor de texto rico (se houver)
export const LazyRichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  {
    loading: () => (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>
    ),
    ssr: false
  }
)

// Lazy loading para calendário/datepicker
export const LazyDatePicker = dynamic(
  () => import('@/components/ui/DatePicker'),
  {
    loading: () => (
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    ),
    ssr: false
  }
)

// Lazy loading para componentes de configurações
export const LazySettingsPanel = dynamic(
  () => import('@/components/settings/SettingsPanel'),
  {
    loading: () => (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    ),
    ssr: false
  }
)
*/

// Hook para lazy loading condicional
export function useLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  condition: boolean,
  LazyComponent: T
): T | null {
  if (condition) {
    return LazyComponent
  }
  return null
}

// Wrapper com error boundary
interface LazyWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function LazyWrapper({ children, fallback = <DefaultLoading /> }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

// Exportar skeletons para uso direto
export { DefaultLoading, TableSkeleton, CardSkeleton }