import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChevronLeft, ChevronRight, Calendar, TrendingUp } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const AllocationPage = () => {
  const [allocationData, setAllocationData] = useState(null)
  const [historyData, setHistoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [view, setView] = useState('allocation') // allocation or history

  useEffect(() => {
    loadAllocationData()
  }, [month])

  useEffect(() => {
    if (view === 'history') {
      loadHistoryData()
    }
  }, [year, view])

  function getCurrentMonth() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const loadAllocationData = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/allocation?month=${month}`)
      setAllocationData(res.data)
      setError('')
    } catch (err) {
      setError('Gagal memuat data alokasi')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadHistoryData = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/allocation/history?year=${year}`)
      setHistoryData(res.data)
      setError('')
    } catch (err) {
      setError('Gagal memuat data history')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    const [y, m] = month.split('-')
    const prevDate = new Date(y, parseInt(m) - 2) // -2 because months are 0-indexed
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    setMonth(newMonth)
  }

  const handleNextMonth = () => {
    const [y, m] = month.split('-')
    const nextDate = new Date(y, parseInt(m))
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    setMonth(newMonth)
  }

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE']

  if (loading) return <div className="loading">Memuat data alokasi...</div>

  const monthDisplay = month ? new Date(`${month}-01`).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }) : ''

  return (
    <div className="list-page">
      <BackButton to="/reports" label="Laporan" />

      <div className="page-header">
        <h1>Alokasi Pendapatan</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* View Toggle */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setView('allocation')}
          className={`btn-pill ${view === 'allocation' ? '' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          Bulan Ini
        </button>
        <button
          onClick={() => setView('history')}
          className={`btn-pill ${view === 'history' ? '' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          Sepanjang Tahun
        </button>
      </div>

      {/* Month View */}
      {view === 'allocation' && allocationData && (
        <>
          {/* Month Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 24,
            padding: '12px',
            background: '#f5f5f5',
            borderRadius: 8
          }}>
            <button
              onClick={handlePrevMonth}
              className="icon-btn"
              title="Bulan sebelumnya"
            >
              <ChevronLeft size={20} />
            </button>
            <div style={{ fontSize: 16, fontWeight: 600, minWidth: 150, textAlign: 'center' }}>
              {monthDisplay}
            </div>
            <button
              onClick={handleNextMonth}
              className="icon-btn"
              title="Bulan berikutnya"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Total Income Card */}
          <div className="card-hero" style={{ marginBottom: 20 }}>
            <div className="hero-label">Total Pendapatan Bulan Ini</div>
            <div className="hero-value">Rp {allocationData.totalIncome.toLocaleString('id-ID')}</div>
          </div>

          {/* Allocation Pie Chart */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Distribusi Alokasi</h2>
            <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={allocationData.allocation}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Allocation Table */}
            <div style={{ marginTop: 20 }}>
              {allocationData.allocation.map((item, idx) => (
                <div
                  key={item.category}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: idx < allocationData.allocation.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: COLORS[idx]
                      }}
                    />
                    <span>{item.category}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>Rp {item.amount.toLocaleString('id-ID')}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          {allocationData.breakdown.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 className="section-title">Rincian Pengeluaran per Kategori</h2>
              {allocationData.breakdown.map((cat, idx) => (
                <div key={cat.id} className="list-row">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: cat.color,
                      opacity: 0.2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ fontSize: 16, color: cat.color, fontWeight: 600 }}>■</div>
                  </div>
                  <div className="list-row-body" style={{ flex: 1 }}>
                    <div className="list-row-title">{cat.name}</div>
                    <div className="list-row-subtitle">{cat.percentage}% dari pengeluaran</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="list-row-amount negative">Rp {cat.amount.toLocaleString('id-ID')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <div className="card">
            <h2 className="section-title">Ringkasan</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Pengeluaran</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#EF5350' }}>
                  Rp {allocationData.summary.totalExpenses.toLocaleString('id-ID')}
                </div>
              </div>
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Sisa Pendapatan</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#66BB6A' }}>
                  Rp {allocationData.summary.remainingIncome.toLocaleString('id-ID')}
                </div>
              </div>
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Tabungan Goals</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#29B6F6' }}>
                  Rp {allocationData.summary.totalGoalsSavings.toLocaleString('id-ID')}
                </div>
              </div>
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Saldo Wallet</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#AB47BC' }}>
                  Rp {allocationData.summary.walletBalance.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* History View */}
      {view === 'history' && historyData && (
        <>
          {/* Year Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 24,
            padding: '12px',
            background: '#f5f5f5',
            borderRadius: 8
          }}>
            <button
              onClick={() => setYear(year - 1)}
              className="icon-btn"
              title="Tahun sebelumnya"
            >
              <ChevronLeft size={20} />
            </button>
            <div style={{ fontSize: 16, fontWeight: 600, minWidth: 100, textAlign: 'center' }}>
              {year}
            </div>
            <button
              onClick={() => setYear(year + 1)}
              className="icon-btn"
              title="Tahun berikutnya"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Year Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Total Pendapatan</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#66BB6A' }}>
                Rp {historyData.yearSummary.totalIncome.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Total Pengeluaran</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#EF5350' }}>
                Rp {historyData.yearSummary.totalExpenses.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Total Tabungan</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#29B6F6' }}>
                Rp {historyData.yearSummary.totalSavings.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Rata-rata Pengeluaran</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#FFA726' }}>
                Rp {historyData.yearSummary.averageMonthlyExpenses.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Income vs Expenses Chart */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Tren Pendapatan & Pengeluaran</h2>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historyData.history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(val) => new Date(`${val}-01`).toLocaleDateString('id-ID', { month: 'short' })}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                    labelFormatter={(label) => new Date(`${label}-01`).toLocaleDateString('id-ID', { month: 'long' })}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalIncome"
                    stroke="#66BB6A"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Pendapatan"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalExpenses"
                    stroke="#EF5350"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Pengeluaran"
                  />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="#29B6F6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Tabungan"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="card">
            <h2 className="section-title">Rincian Per Bulan</h2>
            {historyData.history.map((month, idx) => (
              <div key={month.month} className="list-row">
                <TrendingUp size={18} style={{ opacity: 0.5 }} />
                <div className="list-row-body" style={{ flex: 1 }}>
                  <div className="list-row-title">
                    {new Date(`${month.month}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="list-row-subtitle">
                    Tabungan: {month.savingsPercentage}%
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12 }}>
                  <div style={{ color: '#29B6F6', fontWeight: 600 }}>
                    Rp {month.savings.toLocaleString('id-ID')}
                  </div>
                  <div style={{ opacity: 0.7 }}>
                    dari Rp {month.totalIncome.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default AllocationPage
