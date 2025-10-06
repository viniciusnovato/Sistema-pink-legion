'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

interface UseVirtualizationOptions {
  itemHeight: number
  containerHeight: number
  items: unknown[]
  overscan?: number
}

interface VirtualizationResult {
  virtualItems: Array<{
    index: number
    start: number
    end: number
    item: unknown
  }>
  totalHeight: number
  scrollToIndex: (index: number) => void
  containerProps: {
    style: React.CSSProperties
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void
  }
}

export function useVirtualization({
  itemHeight,
  containerHeight,
  items,
  overscan = 5
}: UseVirtualizationOptions): VirtualizationResult {
  const [scrollTop, setScrollTop] = useState(0)

  const totalHeight = items.length * itemHeight

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const virtualItems = useMemo(() => {
    const result = []
    for (let i = startIndex; i <= endIndex; i++) {
      result.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        item: items[i]
      })
    }
    return result
  }, [startIndex, endIndex, itemHeight, items])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const scrollToIndex = useCallback((index: number) => {
    const element = document.querySelector('[data-virtualized-container]') as HTMLElement
    if (element) {
      element.scrollTop = index * itemHeight
    }
  }, [itemHeight])

  const containerProps = {
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const
    },
    onScroll: handleScroll,
    'data-virtualized-container': true
  }

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    containerProps
  }
}

// Hook para lazy loading de dados
interface UseLazyLoadingOptions<T> {
  fetchData: (page: number, limit: number) => Promise<T[]>
  initialPage?: number
  pageSize?: number
  threshold?: number
}

interface LazyLoadingResult<T> {
  data: T[]
  loading: boolean
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
  error: string | null
}

export function useLazyLoading<T>({
  fetchData,
  initialPage = 1,
  pageSize = 20
}: UseLazyLoadingOptions<T>): LazyLoadingResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (page: number, append = false) => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const newData = await fetchData(page, pageSize)
      
      if (newData.length < pageSize) {
        setHasMore(false)
      }

      setData(prevData => append ? [...prevData, ...newData] : newData)
      setCurrentPage(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [fetchData, pageSize, loading])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadData(currentPage + 1, true)
    }
  }, [hasMore, loading, currentPage, loadData])

  const refresh = useCallback(() => {
    setData([])
    setHasMore(true)
    setCurrentPage(initialPage)
    loadData(initialPage, false)
  }, [initialPage, loadData])

  useEffect(() => {
    loadData(initialPage, false)
  }, [initialPage, loadData])

  return {
    data,
    loading,
    hasMore,
    loadMore,
    refresh,
    error
  }
}

// Hook para intersection observer (útil para lazy loading)
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [elementRef, options])

  return isIntersecting
}