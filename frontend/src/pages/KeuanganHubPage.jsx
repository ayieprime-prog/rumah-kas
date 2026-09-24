import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, DollarSign, Target, CreditCard, BarChart3, ChevronRight, Landmark, Building2, ArrowLeftRight, PieChart, Activity, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import './KeuanganPage.css'

const items = [
  { path: '/wallets', label: 'Wallet', desc: 'Kelola Tunai, Rekening Bank, & Dompet Digital', icon: Landmark },
  { path: '/expenses', label: 'Pengeluaran', desc: 'Catat & lihat pengeluaran bulanan', icon: Wallet },
  { path: '/income', label: 'Pemasukan', desc: 'Catat sumber pemasukan keluarga', icon: TrendingUp },
  { path: '/transfers', label: 'Transfer', desc: 'Pindahkan saldo antar wallet & anggota', icon: ArrowLeftRight },
  { path: '/budget', label: 'Anggaran', desc: 'Atur batas belanja per kategori', icon: DollarSign },
  { path: '/goals', label: 'Tujuan Tabungan', desc: 'Target menabung bersama', icon: Target },
  { path: '/debt', label: 'Hutang', desc: 'Pantau cicilan & sisa hutang', icon: CreditCard },
  { path: '/assets', label: 'Portfolio Aset', desc: 'Rumah, kendaraan, investasi, & lainnya', icon: Building2 },
  { path: '/allocation', label: 'Alokasi Pendapatan', desc: 'Lihat kemana pendapatan dialokasikan', icon: PieChart },
  { path: '/budget-analytics', label: 'Analitik Anggaran', desc: 'Tren, perbandingan, & prediksi belanja', icon: Activity },
  { path: '/reports', label: 'Laporan', desc: 'Ringkasan keuangan bulanan', icon: BarChart3 },
]

const KeuanganHubPage = () => {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/dashboard')
      setDashboard(response.data)
    } catch (err) {
      console.error('Error fetching dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalGoals = dashboard?.goals?.reduce((sum, g) => sum + g.currentAmount, 0) || 0
  const totalLocked = dashboard?.incomeLocks?.totalRemaining || 0
  const uangBebas = dashboard ? dashboard.overview.balance - totalGoals - totalLocked : 0

  return (
    <div className="keuangan-page">
      <div className="page-header">
        <h1>Keuangan</h1>
      </div>

      {/* Balance Summary Cards */}
      {!loading && dashboard && (
        <div className="balance-summary">
          <div className="summary-card primary">
            <div className="card-label">
              Saldo Aktif
              <button className="eye-btn" onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <div className="card-amount">
              {showBalance ? `Rp ${dashboard.overview.balance.toLocaleString('id-ID')}` : '••••••••'}
            </div>
          </div>

          <div className="summary-card secondary">
            <div className="card-label">Uang Bebas</div>
            <div className="card-amount">
              {showBalance ? `Rp ${Math.max(0, uangBebas).toLocaleString('id-ID')}` : '••••••••'}
            </div>
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="menu-grid">
        {items.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.path} to={item.path} className="menu-card">
              <div className="card-icon">
                <Icon size={24} />
              </div>
              <div className="card-body">
                <div className="card-title">{item.label}</div>
                <div className="card-desc">{item.desc}</div>
              </div>
              <ChevronRight size={18} className="card-chevron" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default KeuanganHubPage
