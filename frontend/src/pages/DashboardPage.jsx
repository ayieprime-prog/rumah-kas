import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, CreditCard, Target, Sparkles } from 'lucide-react'
import './DashboardPage.css'

const DashboardPage = () => {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDashboard(response.data)
    } catch (err) {
      setError('Gagal mengambil data dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="skeleton skeleton-title"></div>
        <div className="stats-grid">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card"></div>)}
        </div>
        <div className="charts-section">
          <div className="skeleton skeleton-chart"></div>
          <div className="skeleton skeleton-chart"></div>
        </div>
      </div>
    )
  }
  if (error) return <div className="alert alert-error">{error}</div>
  if (!dashboard) return <div className="alert alert-error">Data tidak tersedia</div>

  const { overview, expensesByCategory, budgets, goals, debtSummary } = dashboard

  // Prepare chart data
  const categoryData = Object.entries(expensesByCategory).map(([name, amount]) => ({
    name,
    value: Math.round(amount)
  }))
  const totalExpenseInChart = categoryData.reduce((sum, c) => sum + c.value, 0)

  const COLORS = ['#b8860b', '#2b7fa3', '#b06a2e', '#3a8a4d', '#b23a63', '#6b4fbb']

  return (
    <div className="dashboard-page">
      <h1>Dashboard Keuangan Keluarga</h1>

      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon positive"><TrendingUp size={20} /></div>
          <div className="stat-label">Pemasukan Bulan Ini</div>
          <div className="stat-value positive">Rp {overview.totalIncome.toLocaleString('id-ID')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon negative"><TrendingDown size={20} /></div>
          <div className="stat-label">Pengeluaran Bulan Ini</div>
          <div className="stat-value negative">Rp {overview.totalExpense.toLocaleString('id-ID')}</div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon ${overview.balance >= 0 ? 'positive' : 'negative'}`}><Wallet size={20} /></div>
          <div className="stat-label">Saldo Akhir</div>
          <div className={`stat-value ${overview.balance >= 0 ? 'positive' : 'negative'}`}>
            Rp {overview.balance.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning"><CreditCard size={20} /></div>
          <div className="stat-label">Total Hutang</div>
          <div className="stat-value warning">Rp {debtSummary.totalDebt.toLocaleString('id-ID')}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h2>Pengeluaran Berdasarkan Kategori</h2>
          {categoryData.length > 0 ? (
            <div className="donut-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="legend-label">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <span className="donut-center-label">Total</span>
                <span className="donut-center-value">Rp {totalExpenseInChart.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ) : (
            <div className="no-data">
              <Sparkles size={28} className="no-data-icon" />
              <p>Belum ada pengeluaran bulan ini</p>
              <span>Catat pengeluaran pertama untuk melihat grafiknya di sini</span>
            </div>
          )}
        </div>

        <div className="chart-card">
          <h2>Anggaran vs Pengeluaran</h2>
          {budgets.length > 0 ? (
            <div className="budget-list">
              {budgets.map(budget => (
                <div key={budget.id} className="budget-item">
                  <div className="budget-name">{budget.category.name}</div>
                  <div className="budget-bar">
                    <div
                      className="budget-spent"
                      style={{
                        width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%`,
                        backgroundColor: budget.spent > budget.limit ? '#ef4444' : '#10b981'
                      }}
                    ></div>
                  </div>
                  <div className="budget-info">
                    <span>Rp {budget.spent.toLocaleString('id-ID')}</span>
                    <span>/ Rp {budget.limit.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">
              <Wallet size={28} className="no-data-icon" />
              <p>Belum ada anggaran</p>
              <span>Buat anggaran per kategori supaya pengeluaran lebih terkontrol</span>
            </div>
          )}
        </div>
      </div>

      {/* Goals Section */}
      {goals.length > 0 && (
        <div className="goals-section">
          <h2>Target Tabungan</h2>
          <div className="goals-grid">
            {goals.map(goal => (
              <div key={goal.id} className="goal-card">
                <div className="goal-card-header">
                  <div className="goal-icon"><Target size={16} /></div>
                  <h3>{goal.name}</h3>
                </div>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {Math.round(goal.progress)}% ({new Date(goal.targetDate).toLocaleDateString('id-ID')})
                  </div>
                </div>
                <div className="goal-amounts">
                  <span>Rp {goal.currentAmount.toLocaleString('id-ID')}</span>
                  <span>/ Rp {goal.targetAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
