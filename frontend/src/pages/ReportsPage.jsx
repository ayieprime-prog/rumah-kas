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
      const doc = new jsPDF('p', 'mm', 'a4')

      doc.setFontSize(18)
      doc.text('Laporan Keuangan', 14, 15)
      doc.setFontSize(10)
      doc.text(`Keluarga Budi - Test`, 14, 22)
      doc.text(`${monthLabel(month)}`, 14, 28)
      doc.setTextColor(120)
      doc.text(`Dibuat: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 34)
      doc.setTextColor(0)

      let yPos = 42

      doc.setFontSize(10)
      doc.setFillColor(218, 165, 32)
      doc.rect(14, yPos, 182, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, 'bold')
      doc.text('Ringkasan', 18, yPos + 5)
      doc.text('Jumlah', 160, yPos + 5)
      doc.setTextColor(0)
      doc.setFont(undefined, 'normal')

      yPos += 10
      const summaryData = [
        { label: 'Total Pemasukan', value: `Rp ${report.income.total.toLocaleString('id-ID')}` },
        { label: 'Total Pengeluaran', value: `Rp ${report.expense.total.toLocaleString('id-ID')}` },
        { label: 'Sisa (Tabungan)', value: `Rp ${report.balance.toLocaleString('id-ID')}` }
      ]

      summaryData.forEach((row, idx) => {
        doc.setFontSize(10)
        doc.text(row.label, 18, yPos)
        doc.text(row.value, 160, yPos, { align: 'right' })
        if (idx < summaryData.length - 1) {
          doc.setDrawColor(229, 231, 235)
          doc.line(14, yPos + 2, 196, yPos + 2)
        }
        yPos += 8
      })

      yPos += 5

      if (chartContainerRef.current) {
        doc.setFontSize(11)
        doc.setFont(undefined, 'bold')
        doc.text('Distribusi Pengeluaran', 14, yPos)
        yPos += 10

        const canvas = await html2canvas(chartContainerRef.current, { scale: 2, useCORS: true, allowTaint: true })
        const imgData = canvas.toDataURL('image/png')
        doc.addImage(imgData, 'PNG', 60, yPos, 90, 70)
        yPos += 75
      }

      yPos += 5
      doc.setFont(undefined, 'bold')
      doc.setFontSize(10)
      doc.text('Pengeluaran per Kategori', 14, yPos)
      yPos += 7

      doc.setFillColor(218, 165, 32)
      doc.rect(14, yPos - 3, 182, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.text('Kategori', 18, yPos + 2)
      doc.text('Jumlah', 120, yPos + 2)
      doc.text('Persentase', 170, yPos + 2)
      doc.setTextColor(0)
      doc.setFont(undefined, 'normal')
      yPos += 7

      categories.forEach((cat, idx) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 15
        }
        doc.setFontSize(9)
        doc.text(cat.name.substring(0, 35), 18, yPos)
        doc.text(`Rp ${cat.amount.toLocaleString('id-ID')}`, 120, yPos)
        doc.text(`${cat.percentage}%`, 170, yPos)
        doc.setDrawColor(229, 231, 235)
        doc.line(14, yPos + 1.5, 196, yPos + 1.5)
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

          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'nowrap' }}>
            <div style={{ flex: '0 0 35%', backgroundColor: 'white', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h2 style={{ marginTop: 0, fontSize: '13px', fontWeight: 700, marginBottom: 12, color: '#1f2937' }}>Ringkasan</h2>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '5px 0', fontWeight: 500, color: '#4b5563' }}>Pemasukan</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>Rp {report.income.total.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '5px 0', fontWeight: 500, color: '#4b5563' }}>Pengeluaran</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>Rp {report.expense.total.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', fontWeight: 600, color: '#4b5563' }}>Sisa</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: report.balance >= 0 ? '#059669' : '#dc2626', fontSize: '12px' }}>Rp {report.balance.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ flex: '0 0 65%', backgroundColor: 'white', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h2 style={{ marginTop: 0, fontSize: '13px', fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>Distribusi Pengeluaran</h2>
              <div ref={chartContainerRef} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
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
