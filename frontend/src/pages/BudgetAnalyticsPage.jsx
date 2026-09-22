import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const BudgetAnalyticsPage = () => {
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState(null)
  const [categoryTrends, setCategoryTrends] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [month, setMonth] = useState(getCurrentMonth())

  useEffect(() => {
    loadAllData()
  }, [month])

  function getCurrentMonth() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [overviewRes, trendsRes, categoryRes, forecastRes] = await Promise.all([
        axios.get(`/api/budget-analytics/overview?month=${month}`),
        axios.get('/api/budget-analytics/trends?months=6'),
        axios.get('/api/budget-analytics/category-trends?months=6'),
        axios.get('/api/budget-analytics/forecast?months=3')
      ])

      setOverview(overviewRes.data)
      setTrends(trendsRes.data)
      setCategoryTrends(categoryRes.data)
      setForecast(forecastRes.data)
      setError('')
    } catch (err) {
      setError('Gagal memuat data analytics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    const [y, m] = month.split('-')
    const prevDate = new Date(y, parseInt(m) - 2)
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    setMonth(newMonth)
  }

  const handleNextMonth = () => {
    const [y, m] = month.split('-')
    const nextDate = new Date(y, parseInt(m))
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    setMonth(newMonth)
  }

  if (loading) return <div className="loading">Memuat analytics...</div>

  const monthDisplay = month ? new Date(`${month}-01`).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }) : ''

  const getEfficiencyColor = (score) => {
    if (score >= 80) return '#66BB6A'
    if (score >= 60) return '#FFA726'
    return '#EF5350'
  }

  return (
    <div className="list-page">
      <BackButton to="/budget" label="Budget" />

      <div className="page-header">
        <h1>Analytics Budget</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
        <button onClick={handlePrevMonth} className="icon-btn" title="Bulan sebelumnya">
          <ChevronLeft size={20} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, minWidth: 150, textAlign: 'center' }}>
          {monthDisplay}
        </div>
        <button onClick={handleNextMonth} className="icon-btn" title="Bulan berikutnya">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Efficiency Score Card */}
      {overview && (
        <div className="card-hero" style={{
          marginBottom: 20,
          background: `linear-gradient(135deg, ${getEfficiencyColor(overview.summary.efficiencyScore)}20, ${getEfficiencyColor(overview.summary.efficiencyScore)}10)`,
          borderLeft: `4px solid ${getEfficiencyColor(overview.summary.efficiencyScore)}`
        }}>
          <div className="hero-label">Budget Efficiency Score</div>
          <div className="hero-value" style={{ color: getEfficiencyColor(overview.summary.efficiencyScore) }}>
            {overview.summary.efficiencyScore}%
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
            {overview.summary.efficiencyScore >= 80 ? '✨ Excellent' : overview.summary.efficiencyScore >= 60 ? '⚠️ Good' : '❌ Needs improvement'}
          </div>
        </div>
      )}

      {/* Budget vs Actual Comparison */}
      {overview && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="section-title">Budget vs Aktual</h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={overview.categories.slice(0, 8)}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="categoryName"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                <Legend />
                <Bar dataKey="budgetLimit" fill="#29B6F6" name="Budget" />
                <Bar dataKey="actualSpent" name="Aktual">
                  {overview.categories.slice(0, 8).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.status === 'over' ? '#EF5350' : entry.status === 'warning' ? '#FFA726' : '#66BB6A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            marginTop: 20
          }}>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Total Budget</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                Rp {overview.summary.totalBudget.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Total Aktual</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#EF5350' }}>
                Rp {overview.summary.totalSpent.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Variance</div>
              <div style={{
                fontSize: 18,
                fontWeight: 600,
                color: overview.summary.totalVariance >= 0 ? '#66BB6A' : '#EF5350'
              }}>
                Rp {overview.summary.totalVariance.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Category Status */}
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Status Kategori</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{
                padding: 12,
                borderLeft: '4px solid #66BB6A',
                background: '#f5f5f5',
                borderRadius: 4
              }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>On Track</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#66BB6A' }}>
                  {overview.summary.onTrackCategories}
                </div>
              </div>
              <div style={{
                padding: 12,
                borderLeft: '4px solid #FFA726',
                background: '#f5f5f5',
                borderRadius: 4
              }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Warning</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#FFA726' }}>
                  {overview.summary.warningCategories}
                </div>
              </div>
              <div style={{
                padding: 12,
                borderLeft: '4px solid #EF5350',
                background: '#f5f5f5',
                borderRadius: 4
              }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Over Budget</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#EF5350' }}>
                  {overview.summary.overBudgetCategories}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6-Month Trends */}
      {trends && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="section-title">Tren 6 Bulan Terakhir</h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.data}>
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
                <Line type="monotone" dataKey="budget" stroke="#29B6F6" strokeWidth={2} dot={{ r: 4 }} name="Budget" />
                <Line type="monotone" dataKey="actual" stroke="#EF5350" strokeWidth={2} dot={{ r: 4 }} name="Aktual" />
                <Line type="monotone" dataKey="variance" stroke="#66BB6A" strokeWidth={2} dot={{ r: 4 }} name="Variance" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 12,
            marginTop: 20
          }}>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Rata-rata Budget</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                Rp {trends.summary.averageBudget.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Rata-rata Aktual</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                Rp {trends.summary.averageActual.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Tertinggi</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                Rp {trends.summary.highestMonth.actual.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Terendah</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                Rp {trends.summary.lowestMonth.actual.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Trends */}
      {categoryTrends && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="section-title">Tren Kategori</h2>
          {categoryTrends.categories.slice(0, 6).map((cat) => (
            <div key={cat.categoryId} className="list-row">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: cat.categoryColor,
                  opacity: 0.2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {cat.trendDirection === 'up' ? (
                  <TrendingUp size={20} color={cat.categoryColor} />
                ) : cat.trendDirection === 'down' ? (
                  <TrendingDown size={20} color={cat.categoryColor} />
                ) : (
                  <span style={{ fontSize: 16 }}>→</span>
                )}
              </div>
              <div className="list-row-body" style={{ flex: 1 }}>
                <div className="list-row-title">{cat.categoryName}</div>
                <div className="list-row-subtitle">
                  Rata-rata: Rp {cat.average.toLocaleString('id-ID')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: cat.trend > 0 ? '#EF5350' : cat.trend < 0 ? '#66BB6A' : '#999'
                }}>
                  {cat.trend > 0 ? '+' : ''}{cat.trend}%
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {cat.trendDirection === 'up' ? '📈 Naik' : cat.trendDirection === 'down' ? '📉 Turun' : '➡️ Stabil'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Forecast for Next Month */}
      {forecast && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="section-title">Forecast Bulan Depan</h2>
          <div style={{
            padding: 16,
            background: '#f5f5f5',
            borderRadius: 8,
            marginBottom: 16
          }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Prediksi Pengeluaran {forecast.nextMonth}</div>
            <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
              Rp {forecast.summary.forecastedTotal.toLocaleString('id-ID')}
            </div>
            <div style={{ fontSize: 12, color: forecast.summary.difference >= 0 ? '#66BB6A' : '#EF5350' }}>
              {forecast.summary.difference >= 0 ? '✓ Dibawah' : '⚠ Melebihi'} budget sebesar Rp {Math.abs(forecast.summary.difference).toLocaleString('id-ID')}
            </div>
          </div>

          {/* Category Forecasts */}
          {forecast.forecast.map((cat, idx) => (
            <div key={cat.categoryId} style={{
              padding: 12,
              background: idx % 2 === 0 ? '#f5f5f5' : '#fff',
              borderRadius: 4,
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{cat.categoryName}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  Range: Rp {cat.range.low.toLocaleString('id-ID')} - Rp {cat.range.high.toLocaleString('id-ID')}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  Rp {cat.forecasted.toLocaleString('id-ID')}
                </div>
                <div style={{
                  fontSize: 12,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: cat.confidence >= 80 ? '#C8E6C9' : cat.confidence >= 60 ? '#FFE0B2' : '#FFCDD2',
                  color: cat.confidence >= 80 ? '#2E7D32' : cat.confidence >= 60 ? '#E65100' : '#C62828',
                  fontWeight: 500
                }}>
                  {cat.confidence}% confidence
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BudgetAnalyticsPage
