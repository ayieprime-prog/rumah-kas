import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { ChevronLeft, ChevronRight, BarChart3, Download } from 'lucide-react'
import { PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import jsPDF from 'jspdf'
import BackButton from '../components/BackButton'
import './ListPages.css'
import './ReportsPage.css'

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

  const exportPDF = () => {
    if (!report) return
    setExporting(true)
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const margin = 14
      const contentWidth = 182
      let yPos = 15

      doc.setFontSize(18)
      doc.setFont(undefined, 'bold')
      doc.text('Laporan Keuangan', margin, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(100)
      doc.text('Keluarga Budi - Test', margin, yPos)
      doc.text(monthLabel(month), margin, yPos + 5)
      doc.text(`Dibuat: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, yPos + 10)
      doc.setTextColor(0)
      yPos += 22

      doc.setFillColor(218, 165, 32)
      doc.rect(margin, yPos, contentWidth, 6, 'F')
      doc.setTextColor(255)
      doc.setFont(undefined, 'bold')
      doc.setFontSize(9)
      doc.text('Ringkasan', margin + 3, yPos + 4)
      doc.text('Jumlah', margin + contentWidth - 3, yPos + 4, { align: 'right' })

      yPos += 8
      doc.setTextColor(0)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(9)

      const summaryRows = [
        { label: 'Total Pemasukan', value: `Rp ${report.income.total.toLocaleString('id-ID')}` },
        { label: 'Total Pengeluaran', value: `Rp ${report.expense.total.toLocaleString('id-ID')}` },
        { label: 'Sisa (Tabungan)', value: `Rp ${report.balance.toLocaleString('id-ID')}` }
      ]

      summaryRows.forEach((row) => {
        doc.text(row.label, margin + 3, yPos)
        doc.text(row.value, margin + contentWidth - 3, yPos, { align: 'right' })
        yPos += 6
      })

      yPos += 10
      doc.setFont(undefined, 'bold')
      doc.setFontSize(10)
      doc.text('Pengeluaran per Kategori', margin, yPos)
      yPos += 8

      doc.setFillColor(218, 165, 32)
      doc.rect(margin, yPos, contentWidth, 6, 'F')
      doc.setTextColor(255)
      doc.setFont(undefined, 'bold')
      doc.setFontSize(9)
      doc.text('Kategori', margin + 3, yPos + 4)
      doc.text('Jumlah', margin + contentWidth * 0.6, yPos + 4)
      doc.text('Persentase', margin + contentWidth - 3, yPos + 4, { align: 'right' })

      yPos += 8
      doc.setTextColor(0)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(8)

      categories.forEach((cat) => {
        if (yPos > 275) {
          doc.addPage()
          yPos = 15
        }
        doc.text(cat.name.substring(0, 45), margin + 3, yPos)
        doc.text(`Rp ${cat.amount.toLocaleString('id-ID')}`, margin + contentWidth * 0.6, yPos)
        doc.text(`${cat.percentage}%`, margin + contentWidth - 3, yPos, { align: 'right' })
        yPos += 5
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

          <div className="reports-summary-chart">
            <div className="reports-summary-table">
              <h2>Ringkasan</h2>
              <table>
                <tbody>
                  <tr>
                    <td>Pemasukan</td>
                    <td>Rp {report.income.total.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td>Pengeluaran</td>
                    <td>Rp {report.expense.total.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td>Sisa</td>
                    <td style={{ color: report.balance >= 0 ? '#059669' : '#dc2626' }}>Rp {report.balance.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="reports-chart-section">
              <h2>Distribusi Pengeluaran</h2>
              <div className="reports-chart-wrapper" ref={chartContainerRef}>
                {categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} outerRadius={55} fill="#8884d8" dataKey="value">
                        {categories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} contentStyle={{ fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', marginTop: '4px' }} formatter={(value, entry) => {
                        const data = entry.payload
                        return `${data.name} (${data.percentage}%)`
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">
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
