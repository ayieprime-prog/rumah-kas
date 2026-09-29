import { useEffect, useState } from 'react'
import { RefreshCw, Clock, HardDrive, AlertCircle } from 'lucide-react'
import { useBackgroundSync } from '../../utils/backgroundSync'
import './SyncStatus.css'

const SCHEDULE = [
  { name: 'Pengeluaran', freq: 'Setiap 30 menit' },
  { name: 'Pemasukan', freq: 'Setiap jam' },
  { name: 'Anggaran', freq: 'Setiap jam' },
  { name: 'Dashboard', freq: 'Setiap 15 menit' },
  { name: 'Laporan', freq: 'Setiap hari' }
]

export function SyncStatus() {
  const { isInitialized, getSyncStats, clearOldCache } = useBackgroundSync()
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
    } catch (error) {
      setSyncErrors([error.message])
    } finally {
      setIsSyncing(false)
    }
  }

  const handleClearCache = async () => {
    if (window.confirm('Hapus data cache lama? Ini dapat memengaruhi pengalaman offline.')) {
      try {
        await clearOldCache()
        await loadSyncStats()
      } catch (error) {
        setSyncErrors([error.message])
      }
    }
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatTime = (date) => {
    if (!date) return 'Belum pernah'
    const minutes = Math.floor((new Date() - date) / 60000)

    if (minutes < 1) return 'Baru saja'
    if (minutes < 60) return `${minutes} menit lalu`
    if (minutes < 1440) return `${Math.floor(minutes / 60)} jam lalu`
    return date.toLocaleDateString('id-ID')
  }

  if (!isInitialized) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <RefreshCw size={16} className="spinning" />
        <span className="sync-cache-desc" style={{ margin: 0 }}>Menyiapkan sinkronisasi...</span>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="sync-header">
          <p className="sync-title">Status Sinkronisasi Data</p>
          <button onClick={handleManualSync} disabled={isSyncing} className="sync-now-btn">
            <RefreshCw size={14} className={isSyncing ? 'spinning' : ''} />
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}
          </button>
        </div>

        <div className="sync-stats-grid">
          <div className="sync-stat-box">
            <p className="sync-stat-label"><Clock size={13} /> Terakhir</p>
            <p className="sync-stat-value">{formatTime(lastSync)}</p>
          </div>
          <div className="sync-stat-box">
            <p className="sync-stat-label"><HardDrive size={13} /> Ukuran Cache</p>
            <p className="sync-stat-value">{formatBytes(cacheSize)}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="sync-schedule-title">Jadwal Sinkronisasi</p>
        {SCHEDULE.map(item => (
          <div key={item.name} className="sync-schedule-row">
            <div>
              <p className="sync-schedule-name">{item.name}</p>
              <p className="sync-schedule-freq">{item.freq}</p>
            </div>
            <RefreshCw size={16} />
          </div>
        ))}
      </div>

      <div className="card">
        <p className="sync-schedule-title">Kelola Cache</p>
        <p className="sync-cache-desc">
          Cache lama dihapus otomatis setelah 30 hari. Anda dapat menghapusnya secara manual untuk menghemat ruang.
        </p>
        <button onClick={handleClearCache} className="btn-outline" style={{ width: '100%' }}>
          Hapus Cache Lama
        </button>
      </div>

      {syncErrors.length > 0 && (
        <div className="alert alert-error" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            {syncErrors.map((error, i) => <p key={i} style={{ margin: 0 }}>{error}</p>)}
          </div>
        </div>
      )}
    </>
  )
}

export default SyncStatus
