import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { ChevronLeft, ChevronRight, BarChart3, Download } from 'lucide-react'
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import BackButton from '../components/BackButton'
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

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF6B9D', '#95E1D3', '#A8E6CF', '#FFB6B9', '#FEC8D8', '#C7CEEA', '#B0E0E6']

const ReportsPage = () => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const chartContainerRef = useRef(null)

  useEffect(() => { loadData() }, [month])

  const loadData = async () => {
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

  const categories = report ? Object.values(report.expense.byCategory) : []

  const pieChartData = categories.map(cat => ({
    name: cat.name,
    value: cat.amount,
    percentage: cat.percentage
  }))

  const exportPDF = async () => {
    if (!report) return
    setExporting(true)
    try {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Laporan Keuangan', 14, 15)
      doc.setFontSize(10)
      doc.text(`Bulan: ${monthLabel(month)}`, 14, 25)

      doc.setFontSize(11)
      doc.text('Ringkasan', 14, 40)
      doc.setFontSize(9)
      doc.text(`Saldo: Rp ${report.balance.toLocaleString('id-ID')}`, 14, 50)
      doc.text(`Pemasukan: Rp ${report.income.total.toLocaleString('id-ID')}`, 14, 57)
      doc.text(`Pengeluaran: Rp ${report.expense.total.toLocaleString('id-ID')}`, 14, 64)

      if (chartContainerRef.current) {
        const canvas = await html2canvas(chartContainerRef.current, { scale: 2, useCORS: true })
        const imgData = canvas.toDataURL('image/png')
        doc.addImage(imgData, 'PNG', 14, 75, 180, 100)
      }

      let yPos = 185
      doc.setFontSize(11)
      doc.text('Pengeluaran per Kategori', 14, yPos)
      yPos += 10

      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text('Kategori', 14, yPos)
      doc.text('Jumlah', 100, yPos)
      doc.text('Persentase', 150, yPos)
      yPos += 5

      doc.setTextColor(0)
      categories.forEach((cat, idx) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 15
        }
        doc.text(cat.name.substring(0, 30), 14, yPos)
        doc.text(`Rp ${cat.amount.toLocaleString('id-ID')}`, 100, yPos)
        doc.text(`${cat.percentage}%`, 150, yPos)
        yPos += 6
      })

      doc.save(`Laporan-${month}.pdf`)
    } catch (err) {
      setError('Gagal mengekspor PDF')
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

          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 16, marginBottom: 16, alignItems: 'start' }}>
            <div className="card" style={{ padding: '12px' }}>
              <h2 className="section-title" style={{ marginTop: 0, fontSize: '14px', marginBottom: '8px' }}>Ringkasan</h2>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 0', fontWeight: 500 }}>Pemasukan</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>Rp {report.income.total.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 0', fontWeight: 500 }}>Pengeluaran</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>Rp {report.expense.total.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', fontWeight: 500 }}>Sisa</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: report.balance >= 0 ? '#059669' : '#dc2626' }}>Rp {report.balance.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card" style={{ padding: '12px' }}>
              <h2 className="section-title" style={{ marginTop: 0, fontSize: '14px', marginBottom: '8px' }}>Distribusi Pengeluaran</h2>
              <div ref={chartContainerRef} style={{ display: 'flex', justifyContent: 'center' }}>
                {categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} outerRadius={60} fill="#8884d8" dataKey="value">
                        {categories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} contentStyle={{ fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} formatter={(value, entry) => {
                        const data = entry.payload
                        return `${data.name} (${data.percentage}%)`
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ width: '100%' }}>
                    <BarChart3 size={28} className="empty-state-icon" />
                    <p>Belum ada pengeluaran</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button className="btn-pill" onClick={exportPDF} disabled={exporting} style={{ marginBottom: 16 }}>
            <Download size={18} /> {exporting ? 'Mengekspor...' : 'Unduh PDF'}
          </button>

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
