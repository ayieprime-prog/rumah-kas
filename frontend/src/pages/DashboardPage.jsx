import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Wallet, Calendar, Wrench, Heart, BookOpen, Link2, BarChart3, MoreHorizontal, TrendingUp, TrendingDown, Eye, EyeOff, Plus } from 'lucide-react'
import './DashboardPage.css'

const DashboardPage = () => {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNetWorth, setShowNetWorth] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const [activeTab, setActiveTab] = useState('ringkasan')

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/dashboard')
      setDashboard(response.data)
    } catch (err) {
      setError('Gagal mengambil data dashboard')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { path: '/expenses', label: 'Keuangan', icon: Wallet, color: '#b8860b' },
    { path: '/kalender', label: 'Kalender', icon: Calendar, color: '#2b7fa3' },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench, color: '#d17a3f' },
    { path: '/berdua', label: 'Conversation Cards', icon: Heart, color: '#c55a82' },
    { path: '/journal', label: 'Jurnal Keluarga', icon: BookOpen, color: '#c55a82' },
    { path: '/links', label: 'Link Penting', icon: Link2, color: '#2b7fa3' },
    { path: '/reports', label: 'Laporan Keuangan', icon: BarChart3, color: '#5a6fcf' },
    { path: '/', label: 'Lainnya', icon: MoreHorizontal, color: '#3a8a4d' },
  ]

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="skeleton skeleton-header"></div>
        <div className="skeleton skeleton-chart"></div>
      </div>
    )
  }

  if (error) return <div className="alert alert-error">{error}</div>
  if (!dashboard) return <div className="alert alert-error">Data tidak tersedia</div>

  const { overview, expensesByCategory, budgets, goals, debtSummary } = dashboard
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const netWorth = overview.balance + (debtSummary?.totalDebt || 0)

  return (
    <div className="dashboard-page">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Selamat pagi, Keluarga Demo</h1>
          <p>{today}</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="quick-actions">
        {quickActions.map((action, idx) => {
          const Icon = action.icon
          return (
            <button
              key={idx}
              className="action-button"
              onClick={() => navigate(action.path)}
              style={{ '--btn-color': action.color }}
              title={action.label}
            >
              <Icon size={24} />
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>

      {/* Agenda Section */}
      <section className="agenda-section">
        <div className="section-header">
          <h2>Agenda Hari ini</h2>
          <span className="badge">0/1 selesai</span>
        </div>
        <div className="agenda-empty">
          <p>Belum ada agenda untuk hari ini</p>
        </div>
      </section>

      {/* Financial Summary Tabs */}
      <div className="summary-tabs">
        <button
          className={`tab-btn ${activeTab === 'ringkasan' ? 'active' : ''}`}
          onClick={() => setActiveTab('ringkasan')}
        >
          Ringkasan Keuangan
        </button>
        <button
          className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          Semua Wallet
        </button>
        <button
          className={`tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          Semua Pos
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'ringkasan' && (
        <div className="summary-content">
          {/* Net Worth Card */}
          <div className="large-card net-worth-card">
            <div className="card-header">
              <span className="card-label">Kekayaan Bersih Keluarga</span>
              <button
                className="eye-btn"
                onClick={() => setShowNetWorth(!showNetWorth)}
              >
                {showNetWorth ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <div className="card-value">
              {showNetWorth ? `Rp ${netWorth.toLocaleString('id-ID')}` : '••••••••'}
            </div>
            <div className="card-info">
              Harta {showNetWorth ? `Rp ${overview.balance.toLocaleString('id-ID')}` : '••••••••'} – Utang Rp {debtSummary?.totalDebt?.toLocaleString('id-ID') || '0'}
            </div>
            <button className="card-action">Lihat rincian →</button>
          </div>

          {/* Income & Expenses Summary */}
          <div className="summary-grid">
            <div className="summary-card income">
              <div className="summary-label">Pemasukan</div>
              <div className="summary-value">Rp {overview.totalIncome.toLocaleString('id-ID')}</div>
            </div>
            <div className="summary-card expense">
              <div className="summary-label">Belanja</div>
              <div className="summary-value">Rp {overview.totalExpense.toLocaleString('id-ID')}</div>
            </div>
          </div>

          {/* Active Balance Card */}
          <div className="large-card active-balance">
            <div className="card-header">
              <span className="card-label">Saldo Aktif</span>
              <Eye size={16} />
            </div>
            <div className="card-value">
              Rp {overview.balance.toLocaleString('id-ID')}
            </div>
            <div className="card-info">
              Akumulasi dari awal, gak reset tiap bulan • di luar dana Tabungan/Goal
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wallet' && (
        <div className="summary-content">
          <div className="wallet-section">
            <div className="wallet-item">
              <span className="wallet-label">Semua Wallet</span>
            </div>
            <div className="wallet-list">
              <div className="wallet-card">
                <span>💳 Tunai</span>
              </div>
              <div className="wallet-card">
                <span>🏦 BCA</span>
              </div>
              <div className="wallet-card">
                <span>📱 Dompet Digital</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pos' && (
        <div className="summary-content">
          <div className="pos-section">
            <div className="pos-item">
              <span className="pos-label">Semua Pos</span>
            </div>
            <div className="pos-list">
              <div className="pos-card">
                <span>📁 Keluarga</span>
              </div>
              <div className="pos-card">
                <span>👤 Pribadi Andri</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <section className="transactions-section">
        <div className="section-header">
          <h2>Transaksi Terbaru</h2>
          <button className="view-all">Lihat semua transaksi →</button>
        </div>
        {budgets && budgets.length > 0 ? (
          <div className="transaction-list">
            {budgets.slice(0, 3).map((budget, idx) => (
              <div key={idx} className="transaction-item">
                <div className="tx-icon">
                  <Wallet size={16} />
                </div>
                <div className="tx-details">
                  <div className="tx-name">{budget.category.name}</div>
                  <div className="tx-category">Belanja</div>
                </div>
                <div className="tx-amount negative">
                  -Rp {budget.spent.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-transactions">Belum ada transaksi</div>
        )}
      </section>
    </div>
  )
}

export default DashboardPage
