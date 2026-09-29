/**
 * Performance Monitoring Utilities
 *
 * Track Web Vitals and API performance
 * Monitor and report performance metrics
 */

/**
 * Web Vitals tracking
 */
export function trackWebVitals() {
  // Track Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1]
    reportMetric({
      name: 'LCP',
      value: lastEntry.renderTime || lastEntry.loadTime,
      unit: 'ms',
      rating: lastEntry.renderTime || lastEntry.loadTime > 2500 ? 'poor' : 'good'
    })
  })

  try {
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (e) {
    console.warn('LCP observer not supported')
  }

  // Track First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      reportMetric({
        name: 'FID',
        value: entry.processingDuration,
        unit: 'ms',
        rating: entry.processingDuration > 100 ? 'poor' : 'good'
      })
    })
  })

  try {
    fidObserver.observe({ type: 'first-input', buffered: true })
  } catch (e) {
    console.warn('FID observer not supported')
  }

  // Track Cumulative Layout Shift (CLS)
  let clsValue = 0
  const clsObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value
        reportMetric({
          name: 'CLS',
          value: clsValue,
          unit: 'score',
          rating: clsValue > 0.1 ? 'poor' : 'good'
        })
      }
    })
  })

  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch (e) {
    console.warn('CLS observer not supported')
  }

  // Report Navigation Timing
  window.addEventListener('load', () => {
    const perfData = window.performance.timing
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
    const connectTime = perfData.responseEnd - perfData.requestStart
    const renderTime = perfData.domComplete - perfData.domLoading

    reportMetric({
      name: 'Page Load Time',
      value: pageLoadTime,
      unit: 'ms',
      rating: pageLoadTime > 3000 ? 'poor' : 'good'
    })

    reportMetric({
      name: 'Connect Time',
      value: connectTime,
      unit: 'ms',
      rating: connectTime > 600 ? 'slow' : 'fast'
    })

    reportMetric({
      name: 'Render Time',
      value: renderTime,
      unit: 'ms',
      rating: renderTime > 1000 ? 'slow' : 'fast'
    })
  })
}

/**
 * Track API performance
 */
export const apiPerformanceTracker = {
  requests: new Map(),

  start(url) {
    const id = Math.random().toString(36)
    this.requests.set(id, {
      url,
      startTime: performance.now()
    })
    return id
  },

  end(id, status) {
    const request = this.requests.get(id)
    if (!request) return

    const duration = performance.now() - request.startTime
    request.status = status
    request.duration = duration

    reportMetric({
      name: `API: ${request.url}`,
      value: duration,
      unit: 'ms',
      rating: duration > 500 ? 'slow' : 'fast',
      metadata: { status }
    })

    this.requests.delete(id)
    return duration
  },

  getAverageTime(url) {
    const requests = Array.from(this.requests.values())
      .filter(r => r.url === url)

    if (requests.length === 0) return 0
    const total = requests.reduce((sum, r) => sum + (r.duration || 0), 0)
    return total / requests.length
  }
}

/**
 * Memory usage tracking
 */
export function trackMemoryUsage() {
  if (!performance.memory) {
    console.warn('Memory API not available')
    return
  }

  const memory = performance.memory
  reportMetric({
    name: 'Heap Used',
    value: memory.usedJSHeapSize / (1024 * 1024),
    unit: 'MB',
    rating: memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9 ? 'critical' : 'ok'
  })
}

/**
 * Component render performance
 */
export function measureComponentRender(componentName) {
  const startMark = `${componentName}-start`
  const endMark = `${componentName}-end`
  const measureName = `${componentName}-duration`

  return {
    start() {
      performance.mark(startMark)
    },

    end() {
      performance.mark(endMark)
      performance.measure(measureName, startMark, endMark)

      const measure = performance.getEntriesByName(measureName)[0]
      if (measure) {
        reportMetric({
          name: `Component: ${componentName}`,
          value: measure.duration,
          unit: 'ms',
          rating: measure.duration > 16 ? 'slow' : 'fast'
        })
      }
    }
  }
}

/**
 * Report metrics to console/analytics
 */
function reportMetric(metric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`📊 ${metric.name}`)
    console.log(`Value: ${metric.value.toFixed(2)}${metric.unit}`)
    console.log(`Rating: ${metric.rating}`)
    if (metric.metadata) {
      console.log('Metadata:', metric.metadata)
    }
    console.groupEnd()
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', 'performance', {
      'event_category': 'performance',
      'event_label': metric.name,
      'value': Math.round(metric.value),
      'unit': metric.unit,
      'rating': metric.rating
    })
  }

  // Log to backend for monitoring
  if (metric.value > 1000) {
    logPerformanceAlert(metric)
  }
}

/**
 * Log performance alerts to backend
 */
async function logPerformanceAlert(metric) {
  try {
    await fetch('/api/performance/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    })
  } catch (error) {
    console.warn('Failed to log performance alert:', error)
  }
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitoring(componentName) {
  const measure = measureComponentRender(componentName)

  return {
    startMeasure: measure.start,
    endMeasure: measure.end
  }
}

/**
 * Bundle size monitoring
 */
export function reportBundleMetrics() {
  const navTiming = performance.getEntriesByType('navigation')[0]

  if (navTiming) {
    reportMetric({
      name: 'Resource Size',
      value: navTiming.transferSize / 1024,
      unit: 'KB',
      rating: navTiming.transferSize > 500 * 1024 ? 'large' : 'ok'
    })
  }

  // Report resource timing
  const resources = performance.getEntriesByType('resource')
  const scripts = resources.filter(r => r.name.includes('.js'))
  const stylesheets = resources.filter(r => r.name.includes('.css'))

  scripts.forEach(script => {
    if (script.transferSize > 100 * 1024) {
      reportMetric({
        name: `Large Script: ${script.name.split('/').pop()}`,
        value: script.transferSize / 1024,
        unit: 'KB',
        rating: 'warning'
      })
    }
  })
}

export default {
  trackWebVitals,
  apiPerformanceTracker,
  trackMemoryUsage,
  measureComponentRender,
  reportBundleMetrics,
  usePerformanceMonitoring
}
