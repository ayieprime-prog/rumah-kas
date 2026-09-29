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
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      const value = lastEntry.renderTime || lastEntry.loadTime
      reportMetric({
        name: 'LCP',
        value,
        unit: 'ms',
        rating: value > 2500 ? 'poor' : 'good'
      })
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (e) {
    console.warn('LCP observer not supported')
  }

  // Track First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const value = entry.processingStart - entry.startTime
        reportMetric({
          name: 'FID',
          value,
          unit: 'ms',
          rating: value > 100 ? 'poor' : 'good'
        })
      })
    })
    fidObserver.observe({ type: 'first-input', buffered: true })
  } catch (e) {
    console.warn('FID observer not supported')
  }

  // Track Cumulative Layout Shift (CLS)
  try {
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
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch (e) {
    console.warn('CLS observer not supported')
  }

  // Report Navigation Timing (modern Navigation Timing Level 2 API)
  window.addEventListener('load', () => {
    const [nav] = performance.getEntriesByType('navigation')
    if (!nav) return

    reportMetric({
      name: 'Page Load Time',
      value: nav.loadEventEnd - nav.startTime,
      unit: 'ms',
      rating: (nav.loadEventEnd - nav.startTime) > 3000 ? 'poor' : 'good'
    })

    reportMetric({
      name: 'Connect Time',
      value: nav.responseEnd - nav.requestStart,
      unit: 'ms',
      rating: (nav.responseEnd - nav.requestStart) > 600 ? 'slow' : 'fast'
    })

    reportMetric({
      name: 'Render Time',
      value: nav.domComplete - nav.domInteractive,
      unit: 'ms',
      rating: (nav.domComplete - nav.domInteractive) > 1000 ? 'slow' : 'fast'
    })
  })
}

/**
 * Track API performance
 */
export const apiPerformanceTracker = {
  requests: new Map(),
  history: [],

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
    this.history.push(request)
    if (this.history.length > 200) this.history.shift()

    return duration
  },

  getAverageTime(url) {
    const requests = this.history.filter(r => r.url === url)

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

      performance.clearMarks(startMark)
      performance.clearMarks(endMark)
      performance.clearMeasures(measureName)
    }
  }
}

/**
 * Report metrics to console and to the backend
 */
function reportMetric(metric) {
  if (import.meta.env.DEV) {
    console.group(`\u{1F4CA} ${metric.name}`)
    console.log(`Value: ${metric.value.toFixed(2)}${metric.unit}`)
    console.log(`Rating: ${metric.rating}`)
    if (metric.metadata) {
      console.log('Metadata:', metric.metadata)
    }
    console.groupEnd()
  }

  // Anything slow enough to matter gets logged to the backend so it shows
  // up in Settings > Performa for the household admin, regardless of
  // dev/prod - there's no separate analytics pipeline to send it to here.
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
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        unit: metric.unit,
        url: window.location.pathname
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
  const [navTiming] = performance.getEntriesByType('navigation')

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
