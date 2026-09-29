import { renderHook, act } from '@testing-library/react'
import { offlineStorage, offlineSync, useOfflineDetection } from '../offlineStorage'

describe('offlineStorage', () => {
  beforeEach(async () => {
    await offlineStorage.clearAll()
  })

  describe('saveExpense / getExpenses', () => {
    it('saves an expense and assigns a temp id + timestamp when none given', async () => {
      const saved = await offlineStorage.saveExpense({ amount: 15000, category: 'Food' })

      expect(saved.id).toMatch(/^temp-/)
      expect(saved.timestamp).toEqual(expect.any(Number))
      expect(saved.synced).toBe(false)
    })

    it('preserves an explicit id if provided', async () => {
      const saved = await offlineStorage.saveExpense({ id: 'exp-1', amount: 5000 })
      expect(saved.id).toBe('exp-1')
    })

    it('returns all saved expenses via getExpenses', async () => {
      await offlineStorage.saveExpense({ id: 'a', amount: 1000 })
      await offlineStorage.saveExpense({ id: 'b', amount: 2000 })

      const expenses = await offlineStorage.getExpenses()
      const ids = expenses.map(e => e.id).sort()

      expect(ids).toEqual(['a', 'b'])
    })

    it('returns an empty array when nothing has been saved', async () => {
      const expenses = await offlineStorage.getExpenses()
      expect(expenses).toEqual([])
    })
  })

  describe('queueAction / getPendingActions', () => {
    it('queues an action with a generated id and synced=false', async () => {
      const item = await offlineStorage.queueAction({
        url: '/api/expenses',
        method: 'POST',
        body: { amount: 1000 }
      })

      expect(item.id).toMatch(/^sync-/)
      expect(item.synced).toBe(false)
      expect(item.retries).toBe(0)
    })

    it('lists only unsynced actions', async () => {
      const a = await offlineStorage.queueAction({ url: '/a', method: 'POST' })
      await offlineStorage.queueAction({ url: '/b', method: 'POST' })
      await offlineStorage.markAsSynced(a.id)

      const pending = await offlineStorage.getPendingActions()

      expect(pending).toHaveLength(1)
      expect(pending[0].url).toBe('/b')
    })
  })

  describe('markAsSynced', () => {
    it('marks an existing action as synced with a syncedAt timestamp', async () => {
      const item = await offlineStorage.queueAction({ url: '/x', method: 'POST' })
      const updated = await offlineStorage.markAsSynced(item.id)

      expect(updated.synced).toBe(true)
      expect(updated.syncedAt).toEqual(expect.any(Number))
    })

    it('resolves null for an unknown id instead of throwing', async () => {
      const result = await offlineStorage.markAsSynced('does-not-exist')
      expect(result).toBeNull()
    })
  })

  describe('getStats', () => {
    it('reports expense count, pending count and unsynced count', async () => {
      await offlineStorage.saveExpense({ id: 'e1', amount: 1000 })
      const a = await offlineStorage.queueAction({ url: '/a', method: 'POST' })
      await offlineStorage.queueAction({ url: '/b', method: 'POST' })
      await offlineStorage.markAsSynced(a.id)

      const stats = await offlineStorage.getStats()

      expect(stats.expenses).toBe(1)
      expect(stats.pending).toBe(1) // getPendingActions filters to unsynced only
      expect(stats.unsyncedCount).toBe(1)
      expect(stats.storageSize).toBeGreaterThan(0)
    })
  })

  describe('clearAll', () => {
    it('empties every object store', async () => {
      await offlineStorage.saveExpense({ id: 'e1', amount: 1000 })
      await offlineStorage.queueAction({ url: '/a', method: 'POST' })

      await offlineStorage.clearAll()

      expect(await offlineStorage.getExpenses()).toEqual([])
      expect(await offlineStorage.getPendingActions()).toEqual([])
    })
  })
})

describe('offlineSync', () => {
  beforeEach(async () => {
    await offlineStorage.clearAll()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('syncs all pending actions and marks successful ones as synced', async () => {
    await offlineStorage.queueAction({ url: '/api/a', method: 'POST', body: { x: 1 } })
    await offlineStorage.queueAction({ url: '/api/b', method: 'POST', body: { x: 2 } })

    global.fetch.mockResolvedValue({ ok: true })

    const result = await offlineSync.syncPendingActions()

    expect(result).toEqual({ synced: 2, failed: 0, total: 2 })
    expect(await offlineStorage.getPendingActions()).toEqual([])
  })

  it('counts failed responses without throwing and leaves them pending', async () => {
    await offlineStorage.queueAction({ url: '/api/a', method: 'POST' })

    global.fetch.mockResolvedValue({ ok: false, status: 500 })

    const result = await offlineSync.syncPendingActions()

    expect(result).toEqual({ synced: 0, failed: 1, total: 1 })
    expect(await offlineStorage.getPendingActions()).toHaveLength(1)
  })

  it('counts network errors as failures instead of rejecting the whole sync', async () => {
    await offlineStorage.queueAction({ url: '/api/a', method: 'POST' })

    global.fetch.mockRejectedValue(new Error('network down'))

    const result = await offlineSync.syncPendingActions()

    expect(result).toEqual({ synced: 0, failed: 1, total: 1 })
  })

  it('returns zero counts when there is nothing to sync', async () => {
    const result = await offlineSync.syncPendingActions()
    expect(result).toEqual({ synced: 0, failed: 0, total: 0 })
  })
})

describe('useOfflineDetection', () => {
  const originalOnLine = navigator.onLine

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true })
  })

  it('calls onOffline immediately when navigator.onLine is already false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const onOnline = jest.fn()
    const onOffline = jest.fn()

    renderHook(() => useOfflineDetection(onOnline, onOffline))

    expect(onOffline).toHaveBeenCalledTimes(1)
    expect(onOnline).not.toHaveBeenCalled()
  })

  it('invokes onOnline when an online event fires', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const onOnline = jest.fn()
    const onOffline = jest.fn()

    renderHook(() => useOfflineDetection(onOnline, onOffline))

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(onOnline).toHaveBeenCalledTimes(1)
  })

  it('invokes onOffline when an offline event fires', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const onOnline = jest.fn()
    const onOffline = jest.fn()

    renderHook(() => useOfflineDetection(onOnline, onOffline))

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(onOffline).toHaveBeenCalledTimes(1)
  })

  it('removes its listeners on unmount', () => {
    const onOnline = jest.fn()
    const onOffline = jest.fn()

    const { unmount } = renderHook(() => useOfflineDetection(onOnline, onOffline))
    unmount()

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(onOnline).not.toHaveBeenCalled()
  })
})
