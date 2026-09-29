/**
 * Offline Storage Utilities
 *
 * Manage offline-first data with IndexedDB
 * Queue actions for sync when online
 */

class OfflineStorage {
  constructor() {
    this.db = null
    this.isInitialized = false
  }

  /**
   * Initialize IndexedDB database
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('rumahkas-offline', 2)

      request.onerror = () => {
        console.error('IndexedDB error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log('✅ IndexedDB initialized')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Object stores
        const stores = [
          'expenses',
          'income',
          'budgets',
          'goals',
          'pending-sync'
        ]

        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            const objectStore = db.createObjectStore(store, { keyPath: 'id' })
            objectStore.createIndex('timestamp', 'timestamp', { unique: false })
            console.log(`📦 Created store: ${store}`)
          }
        })
      }
    })
  }

  /**
   * Save expense (offline)
   */
  async saveExpense(expense) {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['expenses'], 'readwrite')
      const store = transaction.objectStore('expenses')

      const expenseWithTimestamp = {
        ...expense,
        id: expense.id || `temp-${Date.now()}`,
        timestamp: Date.now(),
        synced: false
      }

      const request = store.put(expenseWithTimestamp)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log('💾 Expense saved offline:', expenseWithTimestamp.id)
        resolve(expenseWithTimestamp)
      }
    })
  }

  /**
   * Get all offline expenses
   */
  async getExpenses() {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['expenses'], 'readonly')
      const store = transaction.objectStore('expenses')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        resolve(request.result || [])
      }
    })
  }

  /**
   * Queue action for sync
   */
  async queueAction(action) {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pending-sync'], 'readwrite')
      const store = transaction.objectStore('pending-sync')

      const item = {
        id: `sync-${Date.now()}-${Math.random()}`,
        ...action,
        timestamp: Date.now(),
        synced: false,
        retries: 0
      }

      const request = store.put(item)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log('⏳ Action queued for sync:', item.id)
        resolve(item)
      }
    })
  }

  /**
   * Get pending actions
   */
  async getPendingActions() {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pending-sync'], 'readonly')
      const store = transaction.objectStore('pending-sync')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const pending = request.result || []
        const unsyncedOnly = pending.filter(item => !item.synced)
        resolve(unsyncedOnly)
      }
    })
  }

  /**
   * Mark action as synced
   */
  async markAsSynced(actionId) {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pending-sync'], 'readwrite')
      const store = transaction.objectStore('pending-sync')
      const getRequest = store.get(actionId)

      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (item) {
          item.synced = true
          item.syncedAt = Date.now()
          const updateRequest = store.put(item)

          updateRequest.onerror = () => reject(updateRequest.error)
          updateRequest.onsuccess = () => {
            console.log('✅ Action marked as synced:', actionId)
            resolve(item)
          }
        } else {
          resolve(null)
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  /**
   * Clear offline data (after sync)
   */
  async clearSyncedData() {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pending-sync'], 'readwrite')
      const store = transaction.objectStore('pending-sync')
      const index = store.index('timestamp')
      const range = IDBKeyRange.upperBound(Date.now() - 24 * 60 * 60 * 1000) // Older than 24h

      const request = index.openCursor(range)
      let deleted = 0

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          if (cursor.value.synced) {
            cursor.delete()
            deleted++
          }
          cursor.continue()
        } else {
          console.log(`🗑️  Cleared ${deleted} synced items`)
          resolve(deleted)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get storage stats
   */
  async getStats() {
    await this.ensureInitialized()

    const expenses = await this.getExpenses()
    const pending = await this.getPendingActions()

    return {
      expenses: expenses.length,
      pending: pending.length,
      unsyncedCount: pending.filter(p => !p.synced).length,
      storageSize: JSON.stringify({ expenses, pending }).length
    }
  }

  /**
   * Ensure database is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * Clear all offline data (for testing or reset)
   */
  async clearAll() {
    await this.ensureInitialized()

    const stores = ['expenses', 'income', 'budgets', 'goals', 'pending-sync']

    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    }

    console.log('🗑️  All offline data cleared')
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage()

/**
 * Offline sync manager
 */
export const offlineSync = {
  async syncPendingActions() {
    try {
      const pending = await offlineStorage.getPendingActions()

      console.log(`🔄 Syncing ${pending.length} pending actions...`)

      let synced = 0
      let failed = 0

      for (const action of pending) {
        try {
          const response = await fetch(action.url, {
            method: action.method,
            headers: {
              'Content-Type': 'application/json',
              ...action.headers
            },
            body: action.body ? JSON.stringify(action.body) : undefined
          })

          if (response.ok) {
            await offlineStorage.markAsSynced(action.id)
            synced++
          } else {
            failed++
            console.warn(`Failed to sync ${action.id}:`, response.status)
          }
        } catch (error) {
          failed++
          console.error(`Error syncing ${action.id}:`, error)
        }
      }

      console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`)

      return { synced, failed, total: pending.length }
    } catch (error) {
      console.error('Sync error:', error)
      throw error
    }
  },

  async triggerSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register('sync-expenses')
        console.log('✅ Background sync registered')
      } catch (error) {
        console.warn('Background sync unavailable, manual sync required')
        // Fallback to manual sync
        return this.syncPendingActions()
      }
    }
  }
}

/**
 * React hook for offline detection
 */
export function useOfflineDetection(onOnline, onOffline) {
  React.useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Back online!')
      onOnline?.()
      offlineSync.triggerSync()
    }

    const handleOffline = () => {
      console.log('📵 Went offline')
      onOffline?.()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial state
    if (!navigator.onLine) {
      onOffline?.()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onOnline, onOffline])
}

export default {
  offlineStorage,
  offlineSync,
  useOfflineDetection
}
