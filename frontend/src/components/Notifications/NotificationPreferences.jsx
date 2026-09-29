import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { usePushNotifications } from '../../utils/pushNotifications'
import './NotificationPreferences.css'

const PREFERENCE_ITEMS = [
  { key: 'expenseReminders', title: 'Pengingat Pengeluaran', desc: 'Ingatkan untuk mencatat pengeluaran' },
  { key: 'budgetAlerts', title: 'Peringatan Anggaran', desc: 'Peringatkan saat anggaran mencapai 80% atau lebih' },
  { key: 'billDueNotifications', title: 'Tagihan Jatuh Tempo', desc: 'Ingatkan saat tagihan mendekati jatuh tempo' },
  { key: 'goalMilestones', title: 'Target Tabungan', desc: 'Rayakan saat target tabungan tercapai' },
  { key: 'weeklyReport', title: 'Laporan Mingguan', desc: 'Ringkasan keuangan setiap hari Senin' }
]

/**
 * `userId` is passed in as a prop rather than pulled from a global auth
 * context, since this project has no such context yet.
 */
export function NotificationPreferences({ userId }) {
  const { isSubscribed, isLoading, preferences, subscribe, unsubscribe, updatePreferences } = usePushNotifications(userId)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [localPrefs, setLocalPrefs] = useState({
    expenseReminders: true,
    budgetAlerts: true,
    billDueNotifications: true,
    goalMilestones: true,
    weeklyReport: false
  })

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        expenseReminders: preferences.expenseReminders ?? true,
        budgetAlerts: preferences.budgetAlerts ?? true,
        billDueNotifications: preferences.billDueNotifications ?? true,
        goalMilestones: preferences.goalMilestones ?? true,
        weeklyReport: preferences.weeklyReport ?? false
      })
    }
  }, [preferences])

  const handleToggleSubscription = async () => {
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      if (isSubscribed) {
        await unsubscribe()
        setSuccess('Notifikasi push dinonaktifkan')
      } else {
        await subscribe()
        setSuccess('Notifikasi push diaktifkan')
      }
    } catch (err) {
      setError(err.message || 'Gagal mengubah status notifikasi')
      console.error('Subscription error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreferenceChange = async (key) => {
    const updated = {
      ...localPrefs,
      [key]: !localPrefs[key]
    }
    setLocalPrefs(updated)

    setError(null)
    setIsSaving(true)

    try {
      await updatePreferences(updated)
      setSuccess('Preferensi tersimpan')
    } catch (err) {
      setError(err.message || 'Gagal menyimpan preferensi')
      if (preferences) setLocalPrefs(preferences)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Loader2 size={16} className="spinning" />
        <span className="notif-tip">Memuat preferensi...</span>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="notif-header">
          <div>
            <p className="notif-status-title">Notifikasi Push</p>
            <p className="notif-status-subtitle">
              {isSubscribed ? 'Aktif - Anda akan menerima notifikasi' : 'Nonaktif - Notifikasi dimatikan'}
            </p>
          </div>
          <button
            onClick={handleToggleSubscription}
            disabled={isSaving}
            className={`notif-toggle-btn ${isSubscribed ? 'disable' : 'enable'}`}
          >
            {isSaving ? (
              <Loader2 size={14} className="spinning" />
            ) : isSubscribed ? (
              <><BellOff size={14} /> Matikan</>
            ) : (
              <><Bell size={14} /> Aktifkan</>
            )}
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginTop: 12, marginBottom: 0 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginTop: 12, marginBottom: 0 }}>{success}</div>}
      </div>

      {isSubscribed && (
        <div className="card">
          <p className="notif-types-title">Jenis Notifikasi</p>
          {PREFERENCE_ITEMS.map(item => (
            <label key={item.key} className="notif-pref-row">
              <input
                type="checkbox"
                checked={localPrefs[item.key]}
                onChange={() => handlePreferenceChange(item.key)}
                disabled={isSaving}
              />
              <div>
                <p className="notif-pref-title">{item.title}</p>
                <p className="notif-pref-desc">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      )}
    </>
  )
}

export default NotificationPreferences
