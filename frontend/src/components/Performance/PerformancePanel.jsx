import { useEffect, useState } from 'react'
import axios from 'axios'
import { Gauge } from 'lucide-react'
import './PerformancePanel.css'

/**
 * Shows a summary of client-side performance alerts logged by
 * utils/performanceMonitoring.js (any metric slower than 1s gets reported
 * to POST /api/performance/alerts). Household-admin only - this is
 * diagnostic data, not something every member needs to see.
 */
export function PerformancePanel() {
  const [summary, setSummary] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    axios.get('/api/performance/alerts')
      .then(res => {
        if (cancelled) return
        setSummary(res.data.summary || [])
        setCount(res.data.count || 0)
      })
      .catch(() => {
        // Diagnostic-only panel - fail quietly rather than showing an
        // error banner for something the user can't act on anyway.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="card">
        <p className="perf-subtitle" style={{ margin: 0 }}>Memuat data performa...</p>
      </div>
    )
  }

  return (
    <div className="card">
      <p className="perf-title"><Gauge size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Performa Aplikasi</p>
      <p className="perf-subtitle">
        {count > 0
          ? `${count} metrik lambat (>1 detik) tercatat sejak server terakhir dimulai`
          : 'Belum ada masalah performa tercatat sejak server terakhir dimulai'}
      </p>

      {summary.map(item => (
        <div key={item.metric} className="perf-row">
          <div>
            <p className="perf-row-name">{item.metric}</p>
            <p className="perf-row-count">{item.count}x tercatat</p>
          </div>
          <span className="perf-row-value">{item.averageValue}ms rata-rata</span>
        </div>
      ))}
    </div>
  )
}

export default PerformancePanel
