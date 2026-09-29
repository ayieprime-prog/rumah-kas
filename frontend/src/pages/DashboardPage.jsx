import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown } from 'lucide-react'
import GreetingSection from '../components/GreetingSection'
import MenuShortcuts from '../components/MenuShortcuts'
import SummaryToggleTabs from '../components/SummaryToggleTabs'
import FinancialSummarySection from '../components/FinancialSummarySection'
import AgendaSection from '../components/AgendaSection'
import WalletTabs from '../components/WalletTabs'
import BalanceCards from '../components/BalanceCards'
import IncomeExpensesSummary from '../components/IncomeExpensesSummary'
import TransactionHistory from '../components/TransactionHistory'
import AddModal from '../components/AddModal'
import './DashboardPage.css'

const WEATHER_CODES = {
  0: ['Cerah', '☀️'], 1: ['Cerah berawan', '🌤️'], 2: ['Berawan', '⛅'], 3: ['Mendung', '☁️'],
  45: ['Berkabut', '🌫️'], 48: ['Berkabut', '🌫️'],
  51: ['Gerimis', '🌦️'], 53: ['Gerimis', '🌦️'], 55: ['Gerimis', '🌦️'],
  61: ['Hujan ringan', '🌧️'], 63: ['Hujan', '🌧️'], 65: ['Hujan lebat', '🌧️'],
  80: ['Hujan ringan', '🌦️'], 81: ['Hujan', '🌧️'], 82: ['Hujan lebat', '🌧️'],
  95: ['Badai petir', '⛈️'], 96: ['Badai petir', '⛈️'], 99: ['Badai petir', '⛈️'],
}
const FALLBACK_COORDS = { latitude: -6.2088, longitude: 106.8456 }

const FORECAST_POINTS = [
  { hour: 6, label: 'Pagi' },
  { hour: 12, label: 'Siang' },
  { hour: 16, label: 'Sore' },
  { hour: 19, label: 'Malam' }
]

const DashboardPage = ({ user }) => {
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalTab, setAddModalTab] = useState('todo') // 'todo' atau 'keuangan'
  const [summaryTab, setSummaryTab] = useState('agenda') // 'agenda' atau 'ringkasan'
  const [selectedWalletFilter, setSelectedWalletFilter] = useState('semua') // 'semua', 'tunai', 'bank', 'digital'
  const [selectedPosFilter, setSelectedPosFilter] = useState('semua') // 'semua', 'keluarga', 'pribadi'
  useEffect(() => {
    fetchDashboard()
    fetchPortfolio()
    fetchWeather()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleRefreshEvent = async () => {
      try {
        await Promise.all([fetchDashboard(), fetchPortfolio(), fetchWeather()])
      } catch (err) {
        console.error('Refresh failed:', err)
      }
    }
    window.addEventListener('dashboard-refresh', handleRefreshEvent)
    return () => window.removeEventListener('dashboard-refresh', handleRefreshEvent)
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

  const { overview, wallets = [], goals, incomeLocks, walletSummary, debtSummary } = dashboard
  const today = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="dashboard-page">
      <GreetingSection user={user} now={now} weather={weather} />
      <MenuShortcuts />
      <SummaryToggleTabs activeTab={summaryTab} onTabChange={setSummaryTab} />

      {summaryTab === 'ringkasan' && (
        <FinancialSummarySection
          overview={overview}
          goals={goals}
          incomeLocks={incomeLocks}
          wallets={wallets}
          walletSummary={walletSummary}
          debtSummary={debtSummary}
          portfolio={portfolio}
          showBalance={showBalance}
          onToggleBalance={() => setShowBalance(!showBalance)}
          selectedWalletFilter={selectedWalletFilter}
          onWalletFilterChange={setSelectedWalletFilter}
          selectedPosFilter={selectedPosFilter}
          onPosFilterChange={setSelectedPosFilter}
        />
      )}

      {summaryTab === 'agenda' && (
        <>
          <AgendaSection onAddClick={() => setShowAddModal(true)} />
          <WalletTabs
            wallets={wallets}
            selectedWalletId={selectedWalletId}
            onWalletSelect={setSelectedWalletId}
          />
          <BalanceCards
            overview={overview}
            goals={goals}
            incomeLocks={incomeLocks}
            showBalance={showBalance}
            onToggleBalance={() => setShowBalance(!showBalance)}
          />
          <IncomeExpensesSummary overview={overview} />
          <TransactionHistory />
        </>
      )}

      <AddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        today={today}
      />
    </div>
  )
}

export default DashboardPage
