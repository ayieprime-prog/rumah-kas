import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Wallet, Calendar, Wrench, Heart, BookOpen, Link2, BarChart3, MoreHorizontal, TrendingUp, TrendingDown, Eye, EyeOff, Plus, ChevronRight, CreditCard, Banknote, Smartphone } from 'lucide-react'
import './DashboardPage.css'

const WALLET_ICONS = {
  Banknote: Banknote,
  CreditCard: CreditCard,
  Smartphone: Smartphone,
  wallet: Wallet
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBalance, setShowBalance] = useState(true)
  const [selectedWalletId, setSelectedWalletId] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/dashboard')
      setDashboard(response.data)
      if (response.data.wallets && response.data.wallets.length > 0) {
        setSelectedWalletId(response.data.wallets[0].id)
      }
    } catch (err) {
      setError('Gagal mengambil data dashboard')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { path: '/keuangan', label: 'Utang', icon: TrendingDown, color: '#ef4444' },
    { path: '/keuangan', label: 'Goal', icon: TrendingUp, color: '#10b981' },
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

  const { overview, expensesByCategory, wallets = [], walletSummary = {}, budgets, goals, debtSummary } = dashboard
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Calculate "uang bebas" (free money) = Saldo Aktif - Tabungan Goals
  const totalGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const uangBebas = overview.balance - totalGoals

  // Get category spending details
  const categoryDetails = budgets.map(budget => ({
    name: budget.category.name,
    spent: budget.spent,
    limit: budget.limit,
    percentage: budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0,
    color: budget.category.color
  })).sort((a, b) => b.spent - a.spent)

  return (
    <div className="dashboard-page">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Selamat pagi, Keluarga</h1>
          <p>{today}</p>
        </div>
      </div>

      {/* Wallet Tabs */}
      {wallets.length > 0 && (
        <div className="wallet-tabs">
          {wallets.map(wallet => {
            const IconComp = WALLET_ICONS[wallet.icon] || Wallet
            return (
              <button
                key={wallet.id}
                className={`wallet-tab ${selectedWalletId === wallet.id ? 'active' : ''}`}
                onClick={() => setSelectedWalletId(wallet.id)}
              >
                <IconComp size={16} />
                <div className="wallet-info">
                  <div className="wallet-name">{wallet.name}</div>
                  <div className="wallet-balance">Rp {wallet.balance.toLocaleString('id-ID')}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Saldo Aktif & Uang Bebas Cards */}
      <div className="balance-cards">
        <div className="balance-card saldo-aktif">
          <div className="card-header">
            <span className="card-label">Saldo Aktif</span>
            <button className="eye-btn" onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          <div className="card-value">
            {showBalance ? `Rp ${overview.balance.toLocaleString('id-ID')}` : '••••••••'}
          </div>
        </div>

        <div className="balance-card uang-bebas">
          <div className="card-header">
            <span className="card-label">Uang Bebas</span>
            <button className="eye-btn" onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          <div className="card-value">
            {showBalance ? `Rp ${Math.max(0, uangBebas).toLocaleString('id-ID')}` : '••••••••'}
          </div>
        </div>
      </div>

      {/* Income & Expenses Summary */}
      <div className="summary-grid">
        <div className="summary-card income">
          <div className="summary-label">Pemasukan Bulan Ini</div>
          <div className="summary-value">Rp {overview.totalIncome.toLocaleString('id-ID')}</div>
        </div>
        <div className="summary-card expense">
          <div className="summary-label">Pengeluaran Bulan Ini</div>
          <div className="summary-value">Rp {overview.totalExpense.toLocaleString('id-ID')}</div>
        </div>
      </div>

      {/* Pengeluaran per Kategori */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Pengeluaran per Kategori</h2>
          <button className="view-all" onClick={() => navigate('/reports')}>Laporan →</button>
        </div>
        {categoryDetails.length > 0 ? (
          <div className="category-cards">
            {categoryDetails.map((cat, idx) => (
              <div key={cat.name} className="category-card">
                <div className="category-header">
                  <div className="category-name">{cat.name}</div>
                  <div className="category-percent">{cat.percentage}%</div>
                </div>
                <div className="category-amount">Rp {cat.spent.toLocaleString('id-ID')}</div>
                <div className="category-limit">Anggaran: Rp {cat.limit.toLocaleString('id-ID')}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, cat.percentage)}%`, background: cat.color }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Belum ada pengeluaran bulan ini</div>
        )}
      </section>

      {/* Quick Action Pills */}
      <div className="action-pills">
        {debtSummary.debtCount > 0 && (
          <button className="action-pill debt-pill" onClick={() => navigate('/keuangan')}>
            <TrendingDown size={16} />
            <span>Utang: {debtSummary.debtCount} • Rp {debtSummary.totalDebt.toLocaleString('id-ID')}</span>
            <ChevronRight size={16} />
          </button>
        )}
        {goals.length > 0 && (
          <button className="action-pill goal-pill" onClick={() => navigate('/keuangan')}>
            <TrendingUp size={16} />
            <span>Goal: {goals.length}</span>
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Quick Actions Menu */}
      <div className="menu-section">
        <div className="menu-header">Menu Cepat</div>
        <div className="menu-grid">
          <button className="menu-item" onClick={() => navigate('/keuangan')} title="Keuangan">
            <Wallet size={24} style={{ color: '#d4a574' }} />
            <span>Keuangan</span>
          </button>
          <button className="menu-item" onClick={() => navigate('/kalender')} title="Kalender">
            <Calendar size={24} style={{ color: '#2b7fa3' }} />
            <span>Kalender</span>
          </button>
          <button className="menu-item" onClick={() => navigate('/reports')} title="Laporan">
            <BarChart3 size={24} style={{ color: '#5a6fcf' }} />
            <span>Laporan</span>
          </button>
          <button className="menu-item" onClick={() => navigate('/berdua')} title="Berdua">
            <Heart size={24} style={{ color: '#c55a82' }} />
            <span>Berdua</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
