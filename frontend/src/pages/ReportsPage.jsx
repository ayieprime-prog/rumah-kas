import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { ChevronLeft, ChevronRight, BarChart3, Download } from 'lucide-react'
import { PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import BackButton from '../components/BackButton'
import './ListPages.css'
import './ReportsPage.css'

const SWATCHES = ['sw-1', 'sw-2', 'sw-3', 'sw-4', 'sw-5', 'sw-6']

const PERIODS = [
  { key: 'daily', label: 'Harian' },
  { key: 'weekly', label: 'Mingguan' },
  { key: 'monthly', label: 'Bulanan' },
  { key: 'yearly', label: 'Tahunan' }
]

const HERO_LABEL = {
  daily: 'Saldo Hari Ini',
  weekly: 'Saldo Minggu Ini',
  monthly: 'Saldo Bulan Ini',
  yearly: 'Saldo Tahun Ini'
}

const toISODate = (d) => d.toISOString().slice(0, 10)

const getWeekRange = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { monday, sunday }
}

const shiftAnchor = (anchor, period, delta) => {
  const d = new Date(`${anchor}T00:00:00`)
  if (period === 'daily') d.setDate(d.getDate() + delta)
  else if (period === 'weekly') d.setDate(d.getDate() + delta * 7)
  else if (period === 'monthly') d.setMonth(d.getMonth() + delta, 1)
  else if (period === 'yearly') d.setFullYear(d.getFullYear() + delta)
  return toISODate(d)
}

const getApiPath = (period, anchor) => {
  if (period === 'daily') return `/api/reports/daily/${anchor}`
  if (period === 'weekly') return `/api/reports/weekly/${anchor}`
  if (period === 'monthly') return `/api/reports/monthly/${anchor.slice(0, 7)}`
  return `/api/reports/yearly/${anchor.slice(0, 4)}`
}

const getPeriodLabel = (period, anchor) => {
  const d = new Date(`${anchor}T00:00:00`)
  if (period === 'daily') {
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (period === 'weekly') {
    const { monday, sunday } = getWeekRange(anchor)
    const sameMonth = monday.getMonth() === sunday.getMonth()
    const startLabel = monday.toLocaleDateString('id-ID', { day: 'numeric', month: sameMonth ? undefined : 'short' })
    const endLabel = sunday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${startLabel} - ${endLabel}`
  }
  if (period === 'monthly') {
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }
  return anchor.slice(0, 4)
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF6B9D', '#95E1D3', '#A8E6CF', '#FFB6B9', '#FEC8D8', '#C7CEEA', '#B0E0E6']

const ReportsPage = () => {
  const [period, setPeriod] = useState('monthly')
  const [anchor, setAnchor] = useState(toISODate(new Date()))
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const chartContainerRef = useRef(null)

  useEffect(() => { loadData() }, [period, anchor])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get(getApiPath(period, anchor))
      setReport(res.data)
    } catch (err) {
      setError('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  const changePeriod = (newPeriod) => {
    setPeriod(newPeriod)
  }

  const categories = report ? Object.values(report.expense.byCategory) : []
  const periodLabel = getPeriodLabel(period, anchor)

  const pieChartData = categories.map(cat => ({
    name: cat.name,
    value: cat.amount,
    percentage: cat.percentage
  }))

  const loadImageAsDataUrl = (src, size = 800) => new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      canvas.getContext('2d').drawImage(img, 0, 0, size, size)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = src
  })

  const exportPDF = async () => {
    if (!report) return
    setExporting(true)
    try {
      let chartImage = null
      if (categories.length > 0 && chartContainerRef.current) {
        const canvas = await html2canvas(chartContainerRef.current, { scale: 2, backgroundColor: '#ffffff' })
        chartImage = canvas.toDataURL('image/png')
      }
      const watermarkImage = await loadImageAsDataUrl('/pundi-icon.svg').catch(() => null)

      const doc = new jsPDF('p', 'mm', 'a4')
      const margin = 14
      const contentWidth = 182
      const pageWidth = 210
      const pageHeight = 297

      const drawWatermark = () => {
        if (!watermarkImage) return
        const wmSize = 130
        doc.saveGraphicsState()
        doc.setGState(new doc.GState({ opacity: 0.06 }))
        doc.addImage(watermarkImage, 'PNG', (pageWidth - wmSize) / 2, (pageHeight - wmSize) / 2, wmSize, wmSize)
        doc.restoreGraphicsState()
      }

      drawWatermark()

      let yPos = 15

      doc.setFontSize(18)
      doc.setFont(undefined, 'bold')
      doc.text('Laporan Keuangan', margin, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(100)
      doc.text('Keluarga Budi - Test', margin, yPos)
      doc.text(`${PERIODS.find(p => p.key === period).label} - ${periodLabel}`, margin, yPos + 5)
      doc.text(`Dibuat: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, yPos + 10)
      doc.setTextColor(0)
      yPos += 22

      // Ringkasan (kiri) & Distribusi Pengeluaran (kanan), sejajar berdampingan
      const colGap = 12
      const leftColWidth = 85
      const rightColX = margin + leftColWidth + colGap
      const rightColWidth = contentWidth - leftColWidth - colGap
      const colStartY = yPos

      let sYPos = colStartY
      doc.setFillColor(218, 165, 32)
      doc.rect(margin, sYPos, leftColWidth, 6, 'F')
      doc.setTextColor(255)
      doc.setFont(undefined, 'bold')
      doc.setFontSize(9)
      doc.text('Ringkasan', margin + 3, sYPos + 4)
      sYPos += 8
      doc.setTextColor(0)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(8)

      const summaryRows = [
        { label: 'Total Pemasukan', value: `Rp ${report.income.total.toLocaleString('id-ID')}` },
        { label: 'Total Pengeluaran', value: `Rp ${report.expense.total.toLocaleString('id-ID')}` },
        { label: 'Sisa (Tabungan)', value: `Rp ${report.balance.toLocaleString('id-ID')}` }
      ]

      summaryRows.forEach((row) => {
        doc.text(row.label, margin + 3, sYPos)
        sYPos += 4.5
        doc.setFont(undefined, 'bold')
        doc.text(row.value, margin + 3, sYPos)
        doc.setFont(undefined, 'normal')
        sYPos += 6.5
      })

      let chartEndY = colStartY
      doc.setFont(undefined, 'bold')
      doc.setFontSize(10)
      doc.text('Distribusi Pengeluaran', rightColX, colStartY + 4)
      chartEndY = colStartY + 8

      if (chartImage) {
        const imgProps = doc.getImageProperties(chartImage)
        const imgWidth = rightColWidth
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width
        doc.addImage(chartImage, 'PNG', rightColX, chartEndY, imgWidth, imgHeight)
        chartEndY += imgHeight
      } else {
        doc.setFont(undefined, 'normal')
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text('Belum ada pengeluaran', rightColX, chartEndY + 6)
        doc.setTextColor(0)
        chartEndY += 10
      }

      yPos = Math.max(sYPos, chartEndY) + 10

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
          drawWatermark()
          yPos = 15
        }
        doc.text(cat.name.substring(0, 45), margin + 3, yPos)
        doc.text(`Rp ${cat.amount.toLocaleString('id-ID')}`, margin + contentWidth * 0.6, yPos)
        doc.text(`${cat.percentage}%`, margin + contentWidth - 3, yPos, { align: 'right' })
        yPos += 5
      })

      doc.save(`Laporan-${period}-${anchor}.pdf`)
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

      <div className="period-tabs">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className={`period-tab-btn ${period === p.key ? 'active' : ''}`}
            onClick={() => changePeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="month-nav">
        <button onClick={() => setAnchor(shiftAnchor(anchor, period, -1))}><ChevronLeft size={18} /></button>
        <span className="month-label">{periodLabel}</span>
        <button onClick={() => setAnchor(shiftAnchor(anchor, period, 1))}><ChevronRight size={18} /></button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Memuat laporan...</div>}

      {!loading && report && (
        <>
          <div className="card-hero" style={{ marginBottom: 16 }}>
            <div className="hero-label">{HERO_LABEL[period]}</div>
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
                <p>Belum ada pengeluaran pada periode ini</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ReportsPage
