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

// WMO weather codes (Open-Meteo) collapsed to a simple label + emoji.
const WEATHER_CODES = {
  0: ['Cerah', '☀️'], 1: ['Cerah berawan', '🌤️'], 2: ['Berawan', '⛅'], 3: ['Mendung', '☁️'],
  45: ['Berkabut', '🌫️'], 48: ['Berkabut', '🌫️'],
  51: ['Gerimis', '🌦️'], 53: ['Gerimis', '🌦️'], 55: ['Gerimis', '🌦️'],
  61: ['Hujan ringan', '🌧️'], 63: ['Hujan', '🌧️'], 65: ['Hujan lebat', '🌧️'],
  80: ['Hujan ringan', '🌦️'], 81: ['Hujan', '🌧️'], 82: ['Hujan lebat', '🌧️'],
  95: ['Badai petir', '⛈️'], 96: ['Badai petir', '⛈️'], 99: ['Badai petir', '⛈️'],
}
// Jakarta -- fallback when geolocation is denied/unavailable so the widget
// still shows something instead of just disappearing.
const FALLBACK_COORDS = { latitude: -6.2088, longitude: 106.8456 }

// 4 forecast time points (Pagi, Siang, Sore, Malam)
const FORECAST_POINTS = [
  { hour: 6, label: 'Pagi' },
  { hour: 12, label: 'Siang' },
  { hour: 16, label: 'Sore' },
  { hour: 19, label: 'Malam' }
]

const greetingForHour = (hour) => {
  if (hour < 10) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

// Mock transaction history data
const MOCK_TRANSACTIONS = [
  { id: 1, date: '24 Sep 2026', category: 'Makanan & Minuman', amount: 150000, type: 'expense', icon: '🍔' },
  { id: 2, date: '24 Sep 2026', category: 'Gaji', amount: 5000000, type: 'income', icon: '💰' },
  { id: 3, date: '23 Sep 2026', category: 'Transportasi', amount: 75000, type: 'expense', icon: '🚗' },
  { id: 4, date: '23 Sep 2026', category: 'Utilitas', amount: 250000, type: 'expense', icon: '💡' },
  { id: 5, date: '22 Sep 2026', category: 'Kesehatan', amount: 500000, type: 'expense', icon: '⚕️' },
]

const DashboardPage = ({ user }) => {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBalance, setShowBalance] = useState(true)
  const [selectedWalletId, setSelectedWalletId] = useState(null)
  const [now, setNow] = useState(new Date())
  const [selectedPos, setSelectedPos] = useState('Semua')
  const [selectedTab, setSelectedTab] = useState('Ringkasan')
  const [weather, setWeather] = useState({
    items: [
      { label: 'Pagi', temp: 25, icon: '🌤️' },
      { label: 'Siang', temp: 30, icon: '☀️' },
      { label: 'Sore', temp: 28, icon: '⛅' },
      { label: 'Malam', temp: 23, icon: '☁️' }
    ]
  })

  useEffect(() => {
    fetchDashboard()
    fetchPortfolio()
    fetchWeather()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchWeather = async () => {
    const loadFor = async ({ latitude, longitude, cityName }) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&forecast_days=1&timezone=auto`)
        const data = await res.json()
        if (data?.hourly?.time?.length) {
          const items = FORECAST_POINTS.map(({ hour, label }) => {
            // Parse hour from ISO string (e.g., "2026-09-24T06:00" -> hour 6)
            let idx = data.hourly.time.findIndex(t => parseInt(t.slice(11, 13), 10) === hour)
            if (idx === -1) idx = 0
            const code = data.hourly.weathercode[idx]
            const [, icon] = WEATHER_CODES[code] || ['Cerah', '☀️']
            return { label, temp: Math.round(data.hourly.temperature_2m[idx]), icon }
          })
          setWeather({ items, city: cityName || null })
        }
      } catch (err) {
        // Weather is a nice-to-have -- fail silently, dashboard works without it
      }
    }

    // Prefer the location saved in Profile: skips asking for GPS permission
    // on every visit, and gives us a city name the live-geolocation path
    // doesn't have (that would need its own reverse-geocode call).
    if (user?.weatherLat != null && user?.weatherLon != null) {
      loadFor({ latitude: user.weatherLat, longitude: user.weatherLon, cityName: user.city })
      return
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadFor({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, cityName: null }),
        () => loadFor({ ...FALLBACK_COORDS, cityName: 'Jakarta' }),
        { timeout: 5000 }
      )
    } else {
      loadFor({ ...FALLBACK_COORDS, cityName: 'Jakarta' })
    }
  }

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

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get('/api/assets')
      setPortfolio(response.data)
    } catch (err) {
      console.error('Gagal mengambil data portfolio aset:', err)
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

  const { overview, expensesByCategory, wallets = [], walletSummary = {}, budgets, goals, debtSummary, incomeLocks } = dashboard
  const today = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeLabel = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const headerStyle = user?.wallpaper ? {
    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.6) 100%), url(${user.wallpaper})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : undefined

  // Calculate "uang bebas" (free money) = Saldo Aktif - Tabungan Goals - Pendapatan Terkunci
  const totalGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalLocked = incomeLocks?.totalRemaining || 0
  const uangBebas = overview.balance - totalGoals - totalLocked

  // Get category spending details
  const categoryDetails = budgets.map(budget => ({
    name: budget.category.name,
    spent: budget.spent,
    limit: budget.limit,
    percentage: budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0,
    color: budget.category.color
  })).sort((a, b) => b.spent - a.spent)

  // Mock agenda data (fallback)
  const agendaItems = [
    { id: 1, title: 'Bayar listrik', time: '14:00', status: 'pending' },
    { id: 2, title: 'Belanja groceries', time: '16:00', status: 'pending' },
    { id: 3, title: 'Meeting keluarga', time: '19:00', status: 'pending' }
  ]

  // Filter category details by Pos (scope)
  const filteredCategoryDetails = selectedPos === 'Semua'
    ? categoryDetails
    : categoryDetails.filter(cat => {
        // Filter berdasarkan scope/pos
        // Keluarga: shared expenses, Pribadi: personal expenses
        // Untuk MVP, tunjukkan semua untuk Keluarga, filter untuk Pribadi
        return selectedPos === 'Keluarga' ? true : Math.random() > 0.5 // Mock filter untuk Pribadi
      })

  return (
    <div className="dashboard-page">
      {/* Welcome Header */}
      <div className={`dashboard-header ${user?.wallpaper ? 'has-wallpaper' : ''}`} style={headerStyle}>
        <div className="dashboard-header-brand">
          <img src="/pundi-icon.svg" alt="Pundi" className="dashboard-header-brand-icon" />
          <span>Pundi</span>
        </div>
        <div className="welcome-section">
          <div className="welcome-topline">
            <h1>{greetingForHour(now.getHours())}, Keluarga</h1>
            <span className="welcome-clock">{timeLabel}</span>
          </div>
          <p>{today}</p>
          {weather?.items && (
            <div className="forecast-row">
              {weather.items.map((f, i) => (
                <div key={i} className="forecast-item">
                  <div className="forecast-label">{f.label}</div>
                  <div className="forecast-icon">{f.icon}</div>
                  <div className="forecast-temp">{f.temp}°</div>
                </div>
              ))}
            </div>
          )}
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

      {/* Transaction History */}
      <div className="transaction-history">
        <div className="section-header">
          <h2>Riwayat Transaksi</h2>
          <button className="view-all" onClick={() => navigate('/expenses')}>Lihat semua →</button>
        </div>
        <div className="transaction-list">
          {MOCK_TRANSACTIONS.map(tx => (
            <div key={tx.id} className="transaction-item">
              <div className="tx-icon">{tx.icon}</div>
              <div className="tx-content">
                <div className="tx-category">{tx.category}</div>
                <div className="tx-date">{tx.date}</div>
              </div>
              <div className={`tx-amount ${tx.type}`}>
                {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>
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
