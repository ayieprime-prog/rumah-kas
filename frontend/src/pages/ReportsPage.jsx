import React, { useState, useEffect } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ChevronLeft, ChevronRight, BarChart3, Download } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const SWATCHES = ['sw-1', 'sw-2', 'sw-3', 'sw-4', 'sw-5', 'sw-6']
const MONTH_NAMES_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const rupiah = (n) => `Rp ${(n || 0).toLocaleString('id-ID')}`

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
  const [viewMode, setViewMode] = useState('monthly')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [year, setYear] = useState(new Date().getFullYear())
  const [report, setReport] = useState(null)
  const [yearlyReport, setYearlyReport] = useState(null)
  const [householdName, setHouseholdName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => { loadHousehold() }, [])
  useEffect(() => { if (viewMode === 'monthly') loadMonthly() }, [month, viewMode])
  useEffect(() => { if (viewMode === 'yearly') loadYearly() }, [year, viewMode])

  const loadHousehold = async () => {
    try {
      const res = await axios.get('/api/household')
      setHouseholdName(res.data.name || 'Keluarga')
    } catch (err) {
      setHouseholdName('Keluarga')
    }
  }

  const loadMonthly = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/reports/monthly/${month}`)
      setReport(res.data)
    } catch (err) {
      setError('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  const loadYearly = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/reports/yearly/${year}`)
      setYearlyReport(res.data)
    } catch (err) {
      setError('Gagal memuat laporan tahunan')
    } finally {
      setLoading(false)
    }
  }

  const categories = report ? Object.values(report.expense.byCategory) : []
  // Build Jan-Dec explicitly rather than trusting Object.entries() order --
  // keys "01".."09" sort after "10".."12" in JS objects (bare numeric-looking
  // string keys without a leading zero are enumerated first, in ascending
  // order), so iterating the breakdown object directly renders Oct-Dec
  // before Jan-Sep instead of calendar order.
  const monthlyRows = yearlyReport
    ? Array.from({ length: 12 }, (_, i) => {
        const key = String(i + 1).padStart(2, '0')
        const v = yearlyReport.monthlyBreakdown[key] || { income: 0, expense: 0 }
        return { month: MONTH_NAMES_ID[i], income: v.income, expense: v.expense, balance: v.income - v.expense }
      })
    : []

  const handleExportPdf = () => {
    setExporting(true)
    try {
      const doc = new jsPDF()
      const periodLabel = viewMode === 'monthly' ? monthLabel(month) : `Tahun ${year}`

      doc.setFontSize(16)
      doc.text('Laporan Keuangan', 14, 18)
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(householdName, 14, 25)
      doc.text(periodLabel, 14, 31)
      doc.text(`Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 37)

      const totalIncome = viewMode === 'monthly' ? report.income.total : yearlyReport.totalIncome
      const totalExpense = viewMode === 'monthly' ? report.expense.total : yearlyReport.totalExpense
      const balance = viewMode === 'monthly' ? report.balance : yearlyReport.balance

      autoTable(doc, {
        startY: 44,
        head: [['Ringkasan', 'Jumlah']],
        body: [
          ['Total Pemasukan', rupiah(totalIncome)],
          ['Total Pengeluaran', rupiah(totalExpense)],
          [balance >= 0 ? 'Sisa (Tabungan)' : 'Defisit', rupiah(balance)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [212, 168, 67] }
      })

      const nextY = doc.lastAutoTable.finalY + 10

      if (viewMode === 'monthly') {
        autoTable(doc, {
          startY: nextY,
          head: [['Kategori', 'Jumlah', 'Persentase']],
          body: categories.map(c => [c.name, rupiah(c.amount), `${c.percentage}%`]),
          theme: 'grid',
          headStyles: { fillColor: [212, 168, 67] }
        })
      } else {
        autoTable(doc, {
          startY: nextY,
          head: [['Bulan', 'Pemasukan', 'Pengeluaran', 'Saldo']],
          body: monthlyRows.map(r => [r.month, rupiah(r.income), rupiah(r.expense), rupiah(r.balance)]),
          theme: 'grid',
          headStyles: { fillColor: [212, 168, 67] }
        })
      }

      const filename = viewMode === 'monthly'
        ? `Laporan-${month}.pdf`
        : `Laporan-Tahunan-${year}.pdf`
      doc.save(filename)
    } catch (err) {
      setError('Gagal membuat PDF')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="list-page">
      <BackButton to="/" label="Beranda" />

      <div className="page-header">
        <h1>Laporan</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={`btn-pill ${viewMode === 'monthly' ? '' : 'btn-secondary'}`}
          onClick={() => setViewMode('monthly')}
          style={{ fontSize: 13, padding: '8px 16px' }}
        >
          Bulanan
        </button>
        <button
          className={`btn-pill ${viewMode === 'yearly' ? '' : 'btn-secondary'}`}
          onClick={() => setViewMode('yearly')}
          style={{ fontSize: 13, padding: '8px 16px' }}
        >
          Tahunan
        </button>
      </div>

      {viewMode === 'monthly' ? (
        <div className="month-nav">
          <button onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft size={18} /></button>
          <span className="month-label">{monthLabel(month)}</span>
          <button onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight size={18} /></button>
        </div>
      ) : (
        <div className="month-nav">
          <button onClick={() => setYear(y => y - 1)}><ChevronLeft size={18} /></button>
          <span className="month-label">{year}</span>
          <button onClick={() => setYear(y => y + 1)}><ChevronRight size={18} /></button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Memuat laporan...</div>}

      {!loading && viewMode === 'monthly' && report && (
        <>
          <div className="card-hero" style={{ marginBottom: 16 }}>
            <div className="hero-label">Saldo Bulan Ini</div>
            <div className="hero-value">{rupiah(report.balance)}</div>
            <div className={`pill-badge ${report.balance >= 0 ? 'positive' : 'negative'}`}>
              Tingkat Menabung {report.savingsRate}%
            </div>
          </div>

          <div className="two-col-summary">
            <div className="summary-tile tile-secondary">
              <div className="tile-label">Pemasukan</div>
              <div className="tile-value">{rupiah(report.income.total)}</div>
            </div>
            <div className="summary-tile tile-danger">
              <div className="tile-label">Pengeluaran</div>
              <div className="tile-value">{rupiah(report.expense.total)}</div>
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
                      <div className="list-row-subtitle">{rupiah(cat.amount)} · {cat.percentage}%</div>
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

      {!loading && viewMode === 'yearly' && yearlyReport && (
        <>
          <div className="card-hero" style={{ marginBottom: 16 }}>
            <div className="hero-label">Saldo Tahun {year}</div>
            <div className="hero-value">{rupiah(yearlyReport.balance)}</div>
          </div>

          <div className="two-col-summary">
            <div className="summary-tile tile-secondary">
              <div className="tile-label">Total Pemasukan</div>
              <div className="tile-value">{rupiah(yearlyReport.totalIncome)}</div>
            </div>
            <div className="summary-tile tile-danger">
              <div className="tile-label">Total Pengeluaran</div>
              <div className="tile-value">{rupiah(yearlyReport.totalExpense)}</div>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Rincian per Bulan</h2>
            {monthlyRows.map(r => (
              <div key={r.month} className="list-row">
                <div className="list-row-body" style={{ flex: 1 }}>
                  <div className="list-row-title">{r.month}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12 }}><span className="list-row-amount positive">+{rupiah(r.income)}</span></div>
                  <div style={{ fontSize: 12 }}><span className="list-row-amount negative">-{rupiah(r.expense)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && (report || yearlyReport) && (
        <button className="btn-pill" onClick={handleExportPdf} disabled={exporting} style={{ marginTop: 4 }}>
          <Download size={18} /> {exporting ? 'Membuat PDF...' : 'Unduh PDF'}
        </button>
      )}
    </div>
  )
}

export default ReportsPage
