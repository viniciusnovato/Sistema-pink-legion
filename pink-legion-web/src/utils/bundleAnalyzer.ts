'use client'

// Utilitário para análise de performance e bundle
export class BundleAnalyzer {
  private static instance: BundleAnalyzer
  private performanceEntries: PerformanceEntry[] = []

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer()
    }
    return BundleAnalyzer.instance
  }

  // Medir tempo de carregamento de componentes
  measureComponentLoad(componentName: string, startTime: number) {
    const endTime = performance.now()
    const loadTime = endTime - startTime
    
    console.log(`[Bundle Analyzer] ${componentName} carregado em ${loadTime.toFixed(2)}ms`)
    
    this.performanceEntries.push({
      name: componentName,
      entryType: 'measure',
      startTime,
      duration: loadTime,
      toJSON: () => ({})
    })
  }

  // Analisar recursos carregados
  analyzeResources() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    const analysis = {
      totalResources: resources.length,
      jsFiles: resources.filter(r => r.name.includes('.js')).length,
      cssFiles: resources.filter(r => r.name.includes('.css')).length,
      images: resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)).length,
      largeResources: resources.filter(r => r.transferSize > 100000), // > 100KB
      slowResources: resources.filter(r => r.duration > 1000), // > 1s
      totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
    }

    console.log('[Bundle Analyzer] Análise de recursos:', analysis)
    return analysis
  }

  // Detectar componentes não utilizados
  detectUnusedComponents() {
    const usedComponents = new Set<string>()
    
    // Analisar DOM para componentes utilizados
    document.querySelectorAll('[data-component]').forEach(el => {
      const componentName = el.getAttribute('data-component')
      if (componentName) {
        usedComponents.add(componentName)
      }
    })

    console.log('[Bundle Analyzer] Componentes utilizados:', Array.from(usedComponents))
    return usedComponents
  }

  // Medir Core Web Vitals
  measureCoreWebVitals() {
    const vitals = {
      FCP: 0, // First Contentful Paint
      LCP: 0, // Largest Contentful Paint
      FID: 0, // First Input Delay
      CLS: 0  // Cumulative Layout Shift
    }

    // FCP
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
    if (fcpEntry) {
      vitals.FCP = fcpEntry.startTime
    }

    // LCP
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
      vitals.LCP = lastEntry.startTime
    })
    observer.observe({ entryTypes: ['largest-contentful-paint'] })

    console.log('[Bundle Analyzer] Core Web Vitals:', vitals)
    return vitals
  }

  // Gerar relatório de otimização
  generateOptimizationReport() {
    const resources = this.analyzeResources()
    const vitals = this.measureCoreWebVitals()
    
    const recommendations = []

    // Recomendações baseadas no tamanho do bundle
    if (resources.totalTransferSize > 1000000) { // > 1MB
      recommendations.push({
        type: 'bundle-size',
        severity: 'high',
        message: 'Bundle muito grande (>1MB). Considere code splitting e lazy loading.',
        impact: 'Alto impacto na performance inicial'
      })
    }

    // Recomendações baseadas em recursos grandes
    if (resources.largeResources.length > 0) {
      recommendations.push({
        type: 'large-resources',
        severity: 'medium',
        message: `${resources.largeResources.length} recursos grandes detectados (>100KB).`,
        impact: 'Impacto médio no tempo de carregamento',
        resources: resources.largeResources.map(r => r.name)
      })
    }

    // Recomendações baseadas em recursos lentos
    if (resources.slowResources.length > 0) {
      recommendations.push({
        type: 'slow-resources',
        severity: 'high',
        message: `${resources.slowResources.length} recursos lentos detectados (>1s).`,
        impact: 'Alto impacto na experiência do usuário',
        resources: resources.slowResources.map(r => r.name)
      })
    }

    // Recomendações baseadas em Core Web Vitals
    if (vitals.FCP > 2500) {
      recommendations.push({
        type: 'fcp',
        severity: 'high',
        message: 'First Contentful Paint muito lento (>2.5s).',
        impact: 'Usuários podem abandonar a página'
      })
    }

    const report = {
      timestamp: new Date().toISOString(),
      resources,
      vitals,
      recommendations,
      score: this.calculatePerformanceScore(resources, vitals)
    }

    console.log('[Bundle Analyzer] Relatório de otimização:', report)
    return report
  }

  // Calcular score de performance
  private calculatePerformanceScore(resources: { totalTransferSize: number; slowResources: unknown[]; largeResources: unknown[] }, vitals: { FCP: number }): number {
    let score = 100

    // Penalizar bundle grande
    if (resources.totalTransferSize > 1000000) score -= 20
    else if (resources.totalTransferSize > 500000) score -= 10

    // Penalizar recursos lentos
    score -= resources.slowResources.length * 5

    // Penalizar FCP lento
    if (vitals.FCP > 2500) score -= 15
    else if (vitals.FCP > 1500) score -= 10

    return Math.max(0, score)
  }

  // Limpar dados coletados
  clearData() {
    this.performanceEntries = []
  }
}

// Hook para usar o bundle analyzer
export function useBundleAnalyzer() {
  const analyzer = BundleAnalyzer.getInstance()

  const measureComponent = (componentName: string) => {
    const startTime = performance.now()
    return () => analyzer.measureComponentLoad(componentName, startTime)
  }

  const generateReport = () => analyzer.generateOptimizationReport()
  const analyzeResources = () => analyzer.analyzeResources()
  const measureVitals = () => analyzer.measureCoreWebVitals()

  return {
    measureComponent,
    generateReport,
    analyzeResources,
    measureVitals
  }
}

// Utilitário para preload de recursos críticos
export function preloadCriticalResources() {
  const criticalResources = [
    '/fonts/inter.woff2',
    '/images/logo.svg'
  ]

  criticalResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = resource
    
    if (resource.includes('.woff')) {
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
    } else if (resource.includes('.svg')) {
      link.as = 'image'
    }
    
    document.head.appendChild(link)
  })
}

// Utilitário para lazy loading de imagens
export function setupImageLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          
          if (src) {
            img.src = src
            img.classList.remove('lazy')
            imageObserver.unobserve(img)
          }
        }
      })
    })

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })
  }
}

// Utilitário para otimização de fontes
export function optimizeFonts() {
  // Preload de fontes críticas
  const fontPreloads = [
    { href: '/fonts/inter-regular.woff2', weight: '400' },
    { href: '/fonts/inter-medium.woff2', weight: '500' },
    { href: '/fonts/inter-semibold.woff2', weight: '600' }
  ]

  fontPreloads.forEach(font => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = font.href
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })
}