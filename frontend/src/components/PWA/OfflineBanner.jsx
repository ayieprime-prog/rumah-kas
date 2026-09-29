import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { offlineStorage, offlineSync } from '../../utils/offlineStorage'

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncStatus, setSyncStatus] = useState(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncStatus(null)
      triggerSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      updatePendingCount()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Get initial pending count
    updatePendingCount()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updatePendingCount = async () => {
    try {
      const pending = await offlineStorage.getPendingActions()
      setPendingCount(pending.length)
    } catch (error) {
      console.error('Error getting pending count:', error)
    }
  }

  const triggerSync = async () => {
    setIsSyncing(true)
    setSyncStatus('Sinkronisasi...')
    try {
      const result = await offlineSync.syncPendingActions()
      if (result.synced > 0) {
        setSyncStatus(`✅ ${result.synced} item tersinkronisasi`)
        setTimeout(() => setSyncStatus(null), 3000)
      } else if (result.total === 0) {
        setSyncStatus(null)
      } else {
        setSyncStatus(`⚠️ ${result.failed} item gagal sinkronisasi`)
      }
      await updatePendingCount()
    } catch (error) {
      setSyncStatus('❌ Sinkronisasi gagal')
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Show the banner while offline, and keep it briefly after reconnecting
  // so the auto-sync result (syncStatus) has a chance to be seen.
  if (isOnline && !syncStatus) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-50 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-700 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Anda sedang offline
              </p>
              {pendingCount > 0 && (
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  {pendingCount} item menunggu sinkronisasi
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncStatus && (
              <span className="text-xs text-yellow-700 dark:text-yellow-300 px-2 py-1 bg-yellow-100 dark:bg-yellow-800 rounded">
                {syncStatus}
              </span>
            )}
            {pendingCount > 0 && (
              <button
                onClick={triggerSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sinkronisasi...' : 'Sinkronkan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfflineBanner
