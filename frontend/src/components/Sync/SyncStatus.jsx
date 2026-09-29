import { useEffect, useState } from 'react'
import { RefreshCw, Clock, HardDrive, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useBackgroundSync } from '../../utils/backgroundSync'

export function SyncStatus() {
  const { isInitialized, syncStats, getSyncStats, clearOldCache } = useBackgroundSync()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [cacheSize, setCacheSize] = useState(0)
  const [syncErrors, setSyncErrors] = useState([])

  useEffect(() => {
    if (isInitialized) {
      loadSyncStats()
      const interval = setInterval(loadSyncStats, 60000) // Refresh every minute
      return () => clearInterval(interval)
    }
  }, [isInitialized])

  const loadSyncStats = async () => {
    try {
      const stats = await getSyncStats()
      if (stats) {
        setCacheSize(stats.totalSize)
        setLastSync(new Date())
      }
    } catch (error) {
      console.error('Error loading sync stats:', error)
    }
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      await loadSyncStats()
      setLastSync(new Date())
    } catch (error) {
      setSyncErrors([error.message])
    } finally {
      setIsSyncing(false)
    }
  }

  const handleClearCache = async () => {
    if (confirm('Clear old cache entries? This may affect offline experience.')) {
      try {
        await clearOldCache()
        await loadSyncStats()
      } catch (error) {
        setSyncErrors([error.message])
      }
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatTime = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (!isInitialized) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Initializing sync...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sync Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Data Sync Status
            </h3>
          </div>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Last Sync */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Last Sync</p>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatTime(lastSync)}
            </p>
          </div>

          {/* Cache Size */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Cache Size</p>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatBytes(cacheSize)}
            </p>
          </div>

          {/* Status */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</p>
            </div>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              Syncing
            </p>
          </div>
        </div>
      </div>

      {/* Sync Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sync Schedule
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Expenses</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Every 30 minutes</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Income</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Every hour</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Budgets</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Every hour</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Dashboard</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Every 15 minutes</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Reports</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Daily at midnight</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      {/* Cache Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cache Management
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Cache is automatically cleared after 30 days. You can manually clear old entries to free up space.
        </p>

        <button
          onClick={handleClearCache}
          className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium text-sm transition-colors"
        >
          Clear Old Cache
        </button>
      </div>

      {/* Errors */}
      {syncErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 dark:text-red-200">Sync Errors</h4>
              <ul className="mt-2 space-y-1">
                {syncErrors.map((error, i) => (
                  <li key={i} className="text-xs text-red-700 dark:text-red-300">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 <strong>Tip:</strong> Periodic sync keeps your data fresh even when you're not using the app. Syncing respects your device's battery and network conditions.
        </p>
      </div>
    </div>
  )
}

export default SyncStatus
