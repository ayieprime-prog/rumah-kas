import { renderHook, waitFor } from '@testing-library/react'
import { backgroundSync, useBackgroundSync } from '../backgroundSync'

function deleteSyncDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('rumahkas-sync')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

describe('BackgroundSyncManager', () => {
  beforeEach(async () => {
    await deleteSyncDb()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    backgroundSync.cleanup()
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  describe('isSupported', () => {
    it('is true when serviceWorker and SyncManager are both available', () => {
      Object.defineProperty(window, 'SyncManager', { value: function () {}, configurable: true })
      Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true })
      expect(backgroundSync.isSupported).toBe(true)
    })

    it('is false when SyncManager is missing', () => {
      delete window.SyncManager
      expect(backgroundSync.isSupported).toBe(false)
    })
  })

  describe('registerSync / registerAllSync', () => {
    it('returns false without registering when unsupported', async () => {
      delete window.SyncManager
      const result = await backgroundSync.registerSync('tag-a')
      expect(result).toBe(false)
    })

    it('registers a tag via the service worker registration', async () => {
      const register = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(window, 'SyncManager', { value: function () {}, configurable: true })
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: Promise.resolve({ sync: { register } }) },
        configurable: true
      })

      const result = await backgroundSync.registerSync('tag-a')

      expect(register).toHaveBeenCalledWith('tag-a')
      expect(result).toBe(true)
    })

    it('returns false instead of throwing when registration rejects', async () => {
      Object.defineProperty(window, 'SyncManager', { value: function () {}, configurable: true })
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: Promise.reject(new Error('no SW')) },
        configurable: true
      })

      const result = await backgroundSync.registerSync('tag-a')
      expect(result).toBe(false)
    })

    it('registerAllSync registers all six sync tags', async () => {
      const register = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(window, 'SyncManager', { value: function () {}, configurable: true })
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: Promise.resolve({ sync: { register } }) },
        configurable: true
      })

      const result = await backgroundSync.registerAllSync()

      expect(register).toHaveBeenCalledTimes(6)
      expect(result).toBe(true)
    })
  })

  describe('setupPeriodicRefresh', () => {
    it('schedules six intervals and replaces any previous ones', () => {
      jest.useFakeTimers()
      const clearSpy = jest.spyOn(global, 'clearInterval')

      backgroundSync.setupPeriodicRefresh()
      expect(backgroundSync.syncIntervals.size).toBe(6)

      backgroundSync.setupPeriodicRefresh()
      // clearInterval called once per interval from the first call before re-scheduling
      expect(clearSpy).toHaveBeenCalledTimes(6)
      expect(backgroundSync.syncIntervals.size).toBe(6)
    })

    it('fires prefetchExpenses on its own interval', () => {
      jest.useFakeTimers()
      const spy = jest.spyOn(backgroundSync, 'prefetchExpenses').mockResolvedValue()

      backgroundSync.setupPeriodicRefresh({ expensesInterval: 1000 })
      jest.advanceTimersByTime(1000)

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('fires prefetchIncome on its own interval (regression: was mis-typed as incomceInterval)', () => {
      jest.useFakeTimers()
      const spy = jest.spyOn(backgroundSync, 'prefetchIncome').mockResolvedValue()

      backgroundSync.setupPeriodicRefresh({ incomeInterval: 1000 })
      jest.advanceTimersByTime(1000)

      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe.each([
    ['prefetchExpenses', '/api/expenses', 'expenses'],
    ['prefetchIncome', '/api/income', 'income'],
    ['prefetchBudgets', '/api/budget', 'budgets'],
    ['prefetchReports', '/api/reports', 'reports']
  ])('%s', (method, expectedPathPrefix, cacheKey) => {
    it(`fetches ${expectedPathPrefix} with credentials included and caches the result`, async () => {
      const payload = { total: 123 }
      global.fetch.mockResolvedValue({ ok: true, json: async () => payload })

      await backgroundSync[method]()

      const [url, options] = global.fetch.mock.calls[0]
      expect(url).toContain(expectedPathPrefix)
      expect(options).toEqual({ credentials: 'include' })

      const cached = await backgroundSync.getCachedData(cacheKey)
      expect(cached).toEqual(payload)
    })

    it('does not cache anything when the response is not ok', async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 500 })

      await backgroundSync[method]()

      const cached = await backgroundSync.getCachedData(cacheKey)
      expect(cached).toBeNull()
    })

    it('swallows network errors instead of throwing', async () => {
      global.fetch.mockRejectedValue(new Error('offline'))
      await expect(backgroundSync[method]()).resolves.toBeUndefined()
    })
  })

  describe('prefetchGoals / prefetchDashboard (no query params)', () => {
    it('prefetchGoals hits /api/goals and caches the result', async () => {
      global.fetch.mockResolvedValue({ ok: true, json: async () => ([{ id: 1 }]) })
      await backgroundSync.prefetchGoals()

      expect(global.fetch).toHaveBeenCalledWith('/api/goals', { credentials: 'include' })
      expect(await backgroundSync.getCachedData('goals')).toEqual([{ id: 1 }])
    })

    it('prefetchDashboard hits /api/dashboard and caches the result', async () => {
      global.fetch.mockResolvedValue({ ok: true, json: async () => ({ balance: 1000 }) })
      await backgroundSync.prefetchDashboard()

      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard', { credentials: 'include' })
      expect(await backgroundSync.getCachedData('dashboard')).toEqual({ balance: 1000 })
    })
  })

  describe('cacheData / getCachedData / getCacheAge', () => {
    it('round-trips a value through IndexedDB', async () => {
      await backgroundSync.cacheData('foo', { a: 1 })
      expect(await backgroundSync.getCachedData('foo')).toEqual({ a: 1 })
    })

    it('returns null for a key that was never cached', async () => {
      expect(await backgroundSync.getCachedData('missing')).toBeNull()
    })

    it('reports -1 age for a key that was never cached', async () => {
      expect(await backgroundSync.getCacheAge('missing')).toBe(-1)
    })

    it('reports a non-negative age (in minutes) for a cached key', async () => {
      await backgroundSync.cacheData('foo', { a: 1 })
      const age = await backgroundSync.getCacheAge('foo')
      expect(age).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getCacheStats', () => {
    it('summarizes cached records with size and count', async () => {
      await backgroundSync.cacheData('a', { x: 1 })
      await backgroundSync.cacheData('b', { y: 2 })

      const stats = await backgroundSync.getCacheStats()

      expect(stats.totalRecords).toBe(2)
      expect(stats.caches).toHaveLength(2)
      expect(stats.totalSize).toBeGreaterThan(0)
    })

    it('returns an empty summary when nothing is cached', async () => {
      const stats = await backgroundSync.getCacheStats()
      expect(stats).toEqual({ totalRecords: 0, caches: [], totalSize: 0 })
    })
  })

  describe('clearOldCache', () => {
    it('deletes entries older than the cutoff and keeps newer ones', async () => {
      const realNow = Date.now
      Date.now = () => realNow() - 2 * 60 * 60 * 1000 // 2 hours ago
      await backgroundSync.cacheData('old', { a: 1 })
      Date.now = realNow

      await backgroundSync.cacheData('fresh', { z: 1 })

      const deleted = await backgroundSync.clearOldCache(60) // older than 60 minutes

      expect(deleted).toBe(1)
      expect(await backgroundSync.getCachedData('old')).toBeNull()
      expect(await backgroundSync.getCachedData('fresh')).toEqual({ z: 1 })
    }, 10000)
  })

  describe('smartPrefetch', () => {
    it('prefetches only the data types with nonzero access counts', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expenses: 5, budgets: 0, goals: 2, reports: 0, dashboard: 1 })
      })
      const expensesSpy = jest.spyOn(backgroundSync, 'prefetchExpenses').mockResolvedValue()
      const budgetsSpy = jest.spyOn(backgroundSync, 'prefetchBudgets').mockResolvedValue()
      const goalsSpy = jest.spyOn(backgroundSync, 'prefetchGoals').mockResolvedValue()

      await backgroundSync.smartPrefetch('user-1')

      expect(expensesSpy).toHaveBeenCalled()
      expect(budgetsSpy).not.toHaveBeenCalled()
      expect(goalsSpy).toHaveBeenCalled()
    })

    it('no-ops quietly when the access-patterns endpoint 404s', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 404 })
      await expect(backgroundSync.smartPrefetch('user-1')).resolves.toBeUndefined()
    })
  })

  describe('shouldSync (battery-aware)', () => {
    it('returns true when the Battery API is unavailable', async () => {
      delete navigator.getBattery
      expect(await backgroundSync.shouldSync()).toBe(true)
    })

    it('returns false on low battery when not charging', async () => {
      navigator.getBattery = jest.fn().mockResolvedValue({ level: 0.1, charging: false })
      expect(await backgroundSync.shouldSync()).toBe(false)
    })

    it('returns true on low battery while charging', async () => {
      navigator.getBattery = jest.fn().mockResolvedValue({ level: 0.1, charging: true })
      expect(await backgroundSync.shouldSync()).toBe(true)
    })

    it('returns true when battery is above the threshold', async () => {
      navigator.getBattery = jest.fn().mockResolvedValue({ level: 0.9, charging: false })
      expect(await backgroundSync.shouldSync()).toBe(true)
    })
  })

  describe('shouldSyncOnNetwork', () => {
    afterEach(() => {
      delete navigator.connection
    })

    it('returns true when the Network Information API is unavailable', () => {
      expect(backgroundSync.shouldSyncOnNetwork()).toBe(true)
    })

    it('returns false on slow-2g', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: 'slow-2g', saveData: false },
        configurable: true
      })
      expect(backgroundSync.shouldSyncOnNetwork()).toBe(false)
    })

    it('returns false when Save Data is enabled', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '4g', saveData: true },
        configurable: true
      })
      expect(backgroundSync.shouldSyncOnNetwork()).toBe(false)
    })

    it('returns true on a good connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '4g', saveData: false },
        configurable: true
      })
      expect(backgroundSync.shouldSyncOnNetwork()).toBe(true)
    })
  })

  describe('conditionalSync', () => {
    afterEach(() => {
      delete navigator.getBattery
      delete navigator.connection
    })

    it('runs the sync function when battery and network are fine', async () => {
      navigator.getBattery = jest.fn().mockResolvedValue({ level: 0.9, charging: false })
      const syncFn = jest.fn().mockResolvedValue('done')

      const result = await backgroundSync.conditionalSync(syncFn)

      expect(syncFn).toHaveBeenCalled()
      expect(result).toBe('done')
    })

    it('skips the sync function on low battery', async () => {
      navigator.getBattery = jest.fn().mockResolvedValue({ level: 0.05, charging: false })
      const syncFn = jest.fn()

      const result = await backgroundSync.conditionalSync(syncFn)

      expect(syncFn).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })

  describe('cleanup', () => {
    it('clears all scheduled intervals', () => {
      jest.useFakeTimers()
      backgroundSync.setupPeriodicRefresh()
      expect(backgroundSync.syncIntervals.size).toBe(6)

      backgroundSync.cleanup()

      expect(backgroundSync.syncIntervals.size).toBe(0)
    })
  })
})

describe('useBackgroundSync hook', () => {
  beforeEach(async () => {
    await deleteSyncDb()
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    delete window.SyncManager
    Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true })
  })

  afterEach(() => {
    backgroundSync.cleanup()
  })

  it('initializes and exposes cache stats', async () => {
    const { result, unmount } = renderHook(() => useBackgroundSync('user-1'))

    await waitFor(() => expect(result.current.isInitialized).toBe(true))
    expect(result.current.syncStats).toEqual({ totalRecords: 0, caches: [], totalSize: 0 })

    unmount()
  })
})
