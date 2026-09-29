/**
 * jsdom doesn't implement the Performance Observer / User Timing APIs at
 * all, so this whole file relies on small mocks defined below rather than
 * a real browser Performance implementation.
 */

let observers

function installPerformanceObserverMock() {
  observers = []
  global.PerformanceObserver = class {
    constructor(callback) {
      this.callback = callback
      this.observedType = null
    }
    observe({ type }) {
      this.observedType = type
      observers.push(this)
    }
    disconnect() {}
  }
}

function fireObserver(type, entries) {
  const observer = observers.find(o => o.observedType === type)
  if (!observer) throw new Error(`No observer registered for type "${type}"`)
  observer.callback({ getEntries: () => entries })
}

function installPerformanceTimingMocks() {
  const marks = new Map()
  performance.mark = jest.fn(name => marks.set(name, performance.now()))
  performance.clearMarks = jest.fn(name => marks.delete(name))
  performance.clearMeasures = jest.fn()
  performance.measure = jest.fn()
  performance.getEntriesByName = jest.fn(() => [{ duration: 12.5 }])
  performance.getEntriesByType = jest.fn(() => [])
}

describe('performanceMonitoring', () => {
  let performanceMonitoring
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.resetModules()
    installPerformanceObserverMock()
    installPerformanceTimingMocks()
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
    // eslint-disable-next-line global-require
    performanceMonitoring = require('../performanceMonitoring')
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  describe('trackWebVitals - LCP', () => {
    it('reports "good" when render time is under the 2500ms threshold', () => {
      const groupSpy = jest.spyOn(console, 'group').mockImplementation(() => {})
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      performanceMonitoring.trackWebVitals()
      fireObserver('largest-contentful-paint', [{ renderTime: 1200, loadTime: 0 }])

      expect(groupSpy).toHaveBeenCalledWith(expect.stringContaining('LCP'))
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('good'))
    })

    it('reports "poor" when render time is over the threshold (regression: operator precedence bug)', () => {
      const groupSpy = jest.spyOn(console, 'group').mockImplementation(() => {})
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      performanceMonitoring.trackWebVitals()
      // A truthy renderTime over 2500 used to short-circuit the `||` before
      // the comparison ever ran, making `rating` become the raw number
      // instead of 'poor'.
      fireObserver('largest-contentful-paint', [{ renderTime: 4000, loadTime: 0 }])

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('poor'))
    })
  })

  describe('trackWebVitals - FID', () => {
    it('computes duration from processingStart - startTime, not a nonexistent processingDuration field', () => {
      const groupSpy = jest.spyOn(console, 'group').mockImplementation(() => {})
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      performanceMonitoring.trackWebVitals()
      fireObserver('first-input', [{ startTime: 100, processingStart: 140, hadRecentInput: false }])

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('40.00ms'))
    })
  })

  describe('trackWebVitals - CLS', () => {
    it('accumulates layout shift values across entries, ignoring ones with recent input', () => {
      const groupSpy = jest.spyOn(console, 'group').mockImplementation(() => {})
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      performanceMonitoring.trackWebVitals()
      fireObserver('layout-shift', [
        { value: 0.05, hadRecentInput: false },
        { value: 0.2, hadRecentInput: true }, // ignored
        { value: 0.03, hadRecentInput: false }
      ])

      // Only the two non-recent-input entries should count: 0.05 + 0.03
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('0.08'))
    })
  })

  describe('apiPerformanceTracker', () => {
    it('returns 0 average for a URL with no completed requests', () => {
      expect(performanceMonitoring.apiPerformanceTracker.getAverageTime('/api/x')).toBe(0)
    })

    it('computes a real average from completed request history (regression: used to always read 0)', () => {
      const tracker = performanceMonitoring.apiPerformanceTracker
      const id1 = tracker.start('/api/expenses')
      tracker.end(id1, 200)
      const id2 = tracker.start('/api/expenses')
      tracker.end(id2, 200)

      const avg = tracker.getAverageTime('/api/expenses')
      expect(avg).toBeGreaterThanOrEqual(0)
      expect(Number.isNaN(avg)).toBe(false)
    })

    it('removes an in-flight request from the pending map once ended', () => {
      const tracker = performanceMonitoring.apiPerformanceTracker
      const id = tracker.start('/api/y')
      expect(tracker.requests.has(id)).toBe(true)
      tracker.end(id, 200)
      expect(tracker.requests.has(id)).toBe(false)
    })

    it('does nothing when ending an unknown request id', () => {
      const tracker = performanceMonitoring.apiPerformanceTracker
      expect(() => tracker.end('does-not-exist', 200)).not.toThrow()
    })
  })

  describe('measureComponentRender', () => {
    it('marks start/end, measures the duration, and cleans up its marks', () => {
      const measure = performanceMonitoring.measureComponentRender('Dashboard')

      measure.start()
      measure.end()

      expect(performance.mark).toHaveBeenCalledWith('Dashboard-start')
      expect(performance.mark).toHaveBeenCalledWith('Dashboard-end')
      expect(performance.measure).toHaveBeenCalledWith('Dashboard-duration', 'Dashboard-start', 'Dashboard-end')
      expect(performance.clearMarks).toHaveBeenCalledWith('Dashboard-start')
      expect(performance.clearMarks).toHaveBeenCalledWith('Dashboard-end')
      expect(performance.clearMeasures).toHaveBeenCalledWith('Dashboard-duration')
    })
  })

  describe('logPerformanceAlert (via reportMetric > 1000)', () => {
    it('posts slow metrics to the backend with credentials included', async () => {
      const measure = performanceMonitoring.measureComponentRender('SlowThing')
      performance.getEntriesByName.mockReturnValue([{ duration: 1500 }])

      measure.start()
      measure.end()

      await Promise.resolve()
      await Promise.resolve()

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/performance/alerts',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      )
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(body).toEqual(expect.objectContaining({ metric: 'Component: SlowThing', value: 1500 }))
    })

    it('does not post metrics under the 1000 threshold', async () => {
      const measure = performanceMonitoring.measureComponentRender('FastThing')
      performance.getEntriesByName.mockReturnValue([{ duration: 5 }])

      measure.start()
      measure.end()
      await Promise.resolve()

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('warns instead of throwing when the alert request fails', async () => {
      global.fetch.mockRejectedValue(new Error('network down'))
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const measure = performanceMonitoring.measureComponentRender('SlowThing2')
      performance.getEntriesByName.mockReturnValue([{ duration: 2000 }])
      measure.start()
      measure.end()

      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()

      expect(warnSpy).toHaveBeenCalledWith('Failed to log performance alert:', expect.any(Error))
    })
  })

  describe('reportBundleMetrics', () => {
    it('reports resource size from the navigation entry', () => {
      const groupSpy = jest.spyOn(console, 'group').mockImplementation(() => {})
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      performance.getEntriesByType.mockImplementation(type =>
        type === 'navigation' ? [{ transferSize: 200 * 1024 }] : []
      )

      performanceMonitoring.reportBundleMetrics()

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ok'))
    })

    it('flags scripts larger than 100KB', () => {
      const groupSpy = jest.spyOn(console, 'group').mockImplementation(() => {})
      jest.spyOn(console, 'log').mockImplementation(() => {})
      performance.getEntriesByType.mockImplementation(type => {
        if (type === 'navigation') return [{ transferSize: 1000 }]
        if (type === 'resource') return [{ name: '/assets/big.js', transferSize: 150 * 1024 }]
        return []
      })

      performanceMonitoring.reportBundleMetrics()

      expect(groupSpy).toHaveBeenCalledWith(expect.stringContaining('Large Script'))
    })

    it('does not throw when there is no navigation entry', () => {
      performance.getEntriesByType.mockReturnValue([])
      expect(() => performanceMonitoring.reportBundleMetrics()).not.toThrow()
    })
  })

  describe('trackMemoryUsage', () => {
    it('warns when the Memory API is unavailable', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      performanceMonitoring.trackMemoryUsage()
      expect(warnSpy).toHaveBeenCalledWith('Memory API not available')
    })

    it('reports heap usage when the Memory API is available', () => {
      performance.memory = { usedJSHeapSize: 50 * 1024 * 1024, jsHeapSizeLimit: 100 * 1024 * 1024 }
      const groupSpy = jest.spyOn(console, 'group').mockImplementation(() => {})
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      performanceMonitoring.trackMemoryUsage()

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ok'))
      delete performance.memory
    })
  })
})
