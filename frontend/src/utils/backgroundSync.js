/**
 * Periodic Background Sync Manager
 * Schedule and manage automatic data syncing
 */

import React from 'react'

const SYNC_TAGS = {
  EXPENSES: 'sync-expenses-data',
  INCOME: 'sync-income-data',
  BUDGETS: 'sync-budgets-data',
  GOALS: 'sync-goals-data',
  DASHBOARD: 'sync-dashboard-data',
  REPORTS: 'sync-reports-data'
}

class BackgroundSyncManager {
  constructor() {
    this.syncIntervals = new Map()
  }

  // Getter rather than a value frozen at construction time - see the same
  // note on PushNotificationManager.isSupported in pushNotifications.js.
  get isSupported() {
    return 'serviceWorker' in navigator && 'SyncManager' in window
  }

  /**
   * Register periodic sync tag
   */
  async registerSync(tag, options = {}) {
    try {
      if (!this.isSupported) {
        console.warn('Background Sync not supported')
        return false
      }

      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(tag)

      console.log(`✅ Registered sync: ${tag}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to register sync ${tag}:`, error)
      return false
    }
  }

  /**
   * Register all sync tags
   */
  async registerAllSync() {
    const tags = Object.values(SYNC_TAGS)
    const results = await Promise.all(
      tags.map(tag => this.registerSync(tag))
    )

    const successful = results.filter(r => r).length
    console.log(`✅ Registered ${successful}/${tags.length} sync tags`)

    return successful === tags.length
  }

  /**
   * Setup periodic data refresh
   */
  setupPeriodicRefresh(options = {}) {
    const {
      expensesInterval = 30 * 60 * 1000, // 30 minutes
      incomeInterval = 60 * 60 * 1000,  // 1 hour
      budgetsInterval = 60 * 60 * 1000,  // 1 hour
      goalsInterval = 24 * 60 * 60 * 1000, // 1 day
      dashboardInterval = 15 * 60 * 1000,  // 15 minutes
      reportsInterval = 24 * 60 * 60 * 1000 // 1 day
    } = options

    // Clear existing intervals
    this.syncIntervals.forEach(interval => clearInterval(interval))
    this.syncIntervals.clear()

    // Setup new intervals
    this.syncIntervals.set(
      'expenses',
      setInterval(() => this.prefetchExpenses(), expensesInterval)
    )
    this.syncIntervals.set(
      'income',
      setInterval(() => this.prefetchIncome(), incomeInterval)
    )
    this.syncIntervals.set(
      'budgets',
      setInterval(() => this.prefetchBudgets(), budgetsInterval)
    )
    this.syncIntervals.set(
      'goals',
      setInterval(() => this.prefetchGoals(), goalsInterval)
    )
    this.syncIntervals.set(
      'dashboard',
      setInterval(() => this.prefetchDashboard(), dashboardInterval)
    )
    this.syncIntervals.set(
      'reports',
      setInterval(() => this.prefetchReports(), reportsInterval)
    )

    console.log('✅ Periodic refresh setup complete')
  }

  /**
   * Prefetch expenses data
   */
  async prefetchExpenses() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const response = await fetch(
        `/api/expenses?month=${currentMonth}`,
        { credentials: 'include' }
      )

      if (response.ok) {
        const data = await response.json()
        await this.cacheData('expenses', data)
        console.log('💾 Expenses prefetched')
      }
    } catch (error) {
      console.error('Error prefetching expenses:', error)
    }
  }

  /**
   * Prefetch income data
   */
  async prefetchIncome() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const response = await fetch(
        `/api/income?month=${currentMonth}`,
        { credentials: 'include' }
      )

      if (response.ok) {
        const data = await response.json()
        await this.cacheData('income', data)
        console.log('💾 Income prefetched')
      }
    } catch (error) {
      console.error('Error prefetching income:', error)
    }
  }

  /**
   * Prefetch budgets data
   */
  async prefetchBudgets() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const response = await fetch(
        `/api/budget?month=${currentMonth}`,
        { credentials: 'include' }
      )

      if (response.ok) {
        const data = await response.json()
        await this.cacheData('budgets', data)
        console.log('💾 Budgets prefetched')
      }
    } catch (error) {
      console.error('Error prefetching budgets:', error)
    }
  }

  /**
   * Prefetch goals data
   */
  async prefetchGoals() {
    try {
      const response = await fetch('/api/goals', { credentials: 'include' })

      if (response.ok) {
        const data = await response.json()
        await this.cacheData('goals', data)
        console.log('💾 Goals prefetched')
      }
    } catch (error) {
      console.error('Error prefetching goals:', error)
    }
  }

  /**
   * Prefetch dashboard data
   */
  async prefetchDashboard() {
    try {
      const response = await fetch('/api/dashboard', { credentials: 'include' })

      if (response.ok) {
        const data = await response.json()
        await this.cacheData('dashboard', data)
        console.log('💾 Dashboard prefetched')
      }
    } catch (error) {
      console.error('Error prefetching dashboard:', error)
    }
  }

  /**
   * Prefetch reports data
   */
  async prefetchReports() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const response = await fetch(
        `/api/reports?month=${currentMonth}`,
        { credentials: 'include' }
      )

      if (response.ok) {
        const data = await response.json()
        await this.cacheData('reports', data)
        console.log('💾 Reports prefetched')
      }
    } catch (error) {
      console.error('Error prefetching reports:', error)
    }
  }

  /**
   * Cache data in IndexedDB
   */
  async cacheData(key, data) {
    let db
    try {
      db = await this.openDB()
      const transaction = db.transaction(['sync-cache'], 'readwrite')
      const store = transaction.objectStore('sync-cache')

      const record = {
        key,
        data,
        timestamp: Date.now(),
        version: 1
      }

      await new Promise((resolve, reject) => {
        const request = store.put(record)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.error('Error caching data:', error)
    } finally {
      db?.close()
    }
  }

  /**
   * Get cached data
   */
  async getCachedData(key) {
    let db
    try {
      db = await this.openDB()
      const transaction = db.transaction(['sync-cache'], 'readonly')
      const store = transaction.objectStore('sync-cache')

      return await new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const result = request.result
          if (result) {
            resolve(result.data)
          } else {
            resolve(null)
          }
        }
      })
    } catch (error) {
      console.error('Error getting cached data:', error)
      return null
    } finally {
      db?.close()
    }
  }

  /**
   * Get cache age in minutes
   */
  async getCacheAge(key) {
    let db
    try {
      db = await this.openDB()
      const transaction = db.transaction(['sync-cache'], 'readonly')
      const store = transaction.objectStore('sync-cache')

      return await new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const result = request.result
          if (result) {
            const ageMs = Date.now() - result.timestamp
            const ageMinutes = Math.floor(ageMs / (1000 * 60))
            resolve(ageMinutes)
          } else {
            resolve(-1)
          }
        }
      })
    } catch (error) {
      console.error('Error getting cache age:', error)
      return -1
    } finally {
      db?.close()
    }
  }

  /**
   * Get cache stats
   */
  async getCacheStats() {
    let db
    try {
      db = await this.openDB()
      const transaction = db.transaction(['sync-cache'], 'readonly')
      const store = transaction.objectStore('sync-cache')

      return await new Promise((resolve, reject) => {
        const request = store.getAll()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const records = request.result
          const stats = {
            totalRecords: records.length,
            caches: records.map(r => ({
              key: r.key,
              age: Math.floor((Date.now() - r.timestamp) / 1000 / 60),
              size: JSON.stringify(r.data).length
            })),
            totalSize: records.reduce((sum, r) => sum + JSON.stringify(r.data).length, 0)
          }
          resolve(stats)
        }
      })
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return { totalRecords: 0, caches: [], totalSize: 0 }
    } finally {
      db?.close()
    }
  }

  /**
   * Clear old cache entries
   */
  async clearOldCache(maxAgeMinutes = 24 * 60) {
    let db
    try {
      db = await this.openDB()
      const transaction = db.transaction(['sync-cache'], 'readwrite')
      const store = transaction.objectStore('sync-cache')
      const index = store.index('timestamp')

      const cutoffTime = Date.now() - (maxAgeMinutes * 60 * 1000)

      return await new Promise((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime))
        let deleted = 0

        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            cursor.delete()
            deleted++
            cursor.continue()
          } else {
            console.log(`🧹 Cleared ${deleted} old cache entries`)
            resolve(deleted)
          }
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error clearing old cache:', error)
      return 0
    } finally {
      db?.close()
    }
  }

  /**
   * Smart prefetch based on user behavior
   */
  async smartPrefetch(userId) {
    try {
      // NOTE: this endpoint does not exist on the backend yet (no access-pattern
      // tracking has been built). This call will 404 and the method below will
      // simply no-op until that tracking is implemented.
      const response = await fetch(`/api/users/${userId}/access-patterns`, {
        credentials: 'include'
      })

      if (!response.ok) return

      const patterns = await response.json()

      // Prefetch based on frequency
      if (patterns.expenses > 0) await this.prefetchExpenses()
      if (patterns.budgets > 0) await this.prefetchBudgets()
      if (patterns.goals > 0) await this.prefetchGoals()
      if (patterns.reports > 0) await this.prefetchReports()
      if (patterns.dashboard > 0) await this.prefetchDashboard()

      console.log('✅ Smart prefetch complete')
    } catch (error) {
      console.error('Error with smart prefetch:', error)
    }
  }

  /**
   * Battery-aware syncing
   */
  async shouldSync() {
    if (!('getBattery' in navigator)) return true

    try {
      const battery = await navigator.getBattery()
      // Don't sync if battery < 20% and not charging
      return battery.level > 0.2 || battery.charging
    } catch {
      return true
    }
  }

  /**
   * Network-aware syncing
   */
  shouldSyncOnNetwork() {
    if (!('connection' in navigator)) return true

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (!connection) return true

    // Don't sync on slow or metered connections
    return connection.effectiveType !== 'slow-2g' && !connection.saveData
  }

  /**
   * Conditional sync
   */
  async conditionalSync(syncFn) {
    const hasBattery = await this.shouldSync()
    const hasNetwork = this.shouldSyncOnNetwork()

    if (hasBattery && hasNetwork) {
      return await syncFn()
    } else {
      console.log('⏸️ Skipping sync: battery low or poor network')
      return null
    }
  }

  /**
   * Open IndexedDB
   */
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('rumahkas-sync', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('sync-cache')) {
          const store = db.createObjectStore('sync-cache', { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * Cleanup on logout
   */
  cleanup() {
    this.syncIntervals.forEach(interval => clearInterval(interval))
    this.syncIntervals.clear()
    console.log('✅ Background sync cleaned up')
  }
}

// Singleton instance
export const backgroundSync = new BackgroundSyncManager()

/**
 * React hook for background sync
 */
export function useBackgroundSync(userId) {
  const [syncStats, setSyncStats] = React.useState(null)
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    initializeSync()
    return () => backgroundSync.cleanup()
  }, [userId])

  const initializeSync = async () => {
    try {
      // Register background sync
      await backgroundSync.registerAllSync()

      // Setup periodic refresh
      backgroundSync.setupPeriodicRefresh()

      // Get initial stats
      const stats = await backgroundSync.getCacheStats()
      setSyncStats(stats)
      setIsInitialized(true)

      console.log('✅ Background sync initialized')
    } catch (error) {
      console.error('Error initializing sync:', error)
    }
  }

  const getSyncStats = async () => {
    const stats = await backgroundSync.getCacheStats()
    setSyncStats(stats)
    return stats
  }

  const clearOldCache = async () => {
    await backgroundSync.clearOldCache()
    await getSyncStats()
  }

  return {
    isInitialized,
    syncStats,
    getSyncStats,
    clearOldCache
  }
}

export default {
  backgroundSync,
  useBackgroundSync,
  SYNC_TAGS
}
