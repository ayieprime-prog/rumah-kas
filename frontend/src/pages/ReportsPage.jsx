import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react'
import './ListPages.css'

const SWATCHES = ['sw-1', 'sw-2', 'sw-3', 'sw-4', 'sw-5', 'sw-6']

const monthLabel = (month) => {
  const [y, m] = month.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

const shiftMonth = (month, delta) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const ReportsPage = () => {
  const token = localStorage.getItem('token')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [month])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/reports/monthly/${month}`, { headers: { Authorization: `Bearer ${token}` } })
      setReport(res.data)
    } catch (err) {
      setError('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  const categories = report ? Object.values(report.expense.byCategory) : []

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Laporan</h1>
      </div>

      <div className="month-nav">
        <button onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft size={18} /></button>
        <span className="month-label">{monthLabel(month)}</span>
        <button onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight size={18} /></button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Memuat laporan...</div>}

      {!loading && report && (
        <>
          <div className="card-hero" style={{ marginBottom: 16 }}>
            <div className="hero-label">Saldo Bulan Ini</div>
            <div className="hero-value">Rp {report.balance.toLocaleString('id-ID')}</div>
            <div className={`pill-badge ${report.balance >= 0 ? 'positive' : 'negative'}`}>
              Tingkat Menabung {report.savingsRate}%
            </div>
          </div>

          <div className="two-col-summary">
            <div className="summary-tile tile-secondary">
              <div className="tile-label">Pemasukan</div>
              <div className="tile-value">Rp {report.income.total.toLocaleString('id-ID')}</div>
            </div>
            <div className="summary-tile tile-danger">
              <div className="tile-label">Pengeluaran</div>
              <div className="tile-value">Rp {report.expense.total.toLocaleString('id-ID')}</div>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Pengeluaran per Kategori</h2>
            {categories.length > 0 ? (
              <div>
                {categories.map((cat, i) => (
                  <div key={cat.name} className="list-row" style={{ alignItems: 'flex-start' }}>
                    <div className={`icon-square ${SWATCHES[i % SWATCHES.length]}`} style={{ width: 36, height: 36 }}>
                      <BarChart3 size={16} />
                    </div>
                    <div className="list-row-body">
                      <div className="list-row-title">{cat.name}</div>
                      <div className="progress-track">
                        <div className="progress-track-fill" style={{ width: `${cat.percentage}%`, background: 'var(--accent-color)' }}></div>
                      </div>
                      <div className="list-row-subtitle">Rp {cat.amount.toLocaleString('id-ID')} · {cat.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <BarChart3 size={28} className="empty-state-icon" />
                <p>Belum ada pengeluaran di bulan ini</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ReportsPage
