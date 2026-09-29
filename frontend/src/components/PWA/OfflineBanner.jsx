import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { offlineStorage, offlineSync } from '../../utils/offlineStorage'
import './OfflineBanner.css'

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
        setSyncStatus(`${result.synced} item tersinkronisasi`)
        setTimeout(() => setSyncStatus(null), 3000)
      } else if (result.total === 0) {
        setSyncStatus(null)
      } else {
        setSyncStatus(`${result.failed} item gagal sinkronisasi`)
      }
      await updatePendingCount()
    } catch (error) {
      setSyncStatus('Sinkronisasi gagal')
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Show the banner while offline, and keep it briefly after reconnecting
  // so the auto-sync result (syncStatus) has a chance to be seen.
  if (isOnline && !syncStatus) return null

  return (
    <div className="offline-banner">
      <div className="offline-banner-inner">
        <div className="offline-banner-message">
          <WifiOff size={18} className="offline-banner-icon" />
          <div>
            <p className="offline-banner-title">Anda sedang offline</p>
            {pendingCount > 0 && (
              <p className="offline-banner-subtitle">{pendingCount} item menunggu sinkronisasi</p>
            )}
          </div>
        </div>

        <div className="offline-banner-actions">
          {syncStatus && <span className="offline-banner-status">{syncStatus}</span>}
          {pendingCount > 0 && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="offline-banner-sync-btn"
            >
              <RefreshCw size={14} className={isSyncing ? 'spinning' : ''} />
              {isSyncing ? 'Sinkronisasi...' : 'Sinkronkan'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfflineBanner
