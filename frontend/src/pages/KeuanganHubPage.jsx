import React from 'react'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, DollarSign, Target, CreditCard, BarChart3, ChevronRight, Landmark, Building2, ArrowLeftRight, PieChart, Activity } from 'lucide-react'
import './ListPages.css'

const items = [
  { path: '/wallets', label: 'Wallet', desc: 'Kelola Tunai, Rekening Bank, & Dompet Digital', icon: Landmark, sw: 'sw-1' },
  { path: '/expenses', label: 'Pengeluaran', desc: 'Catat & lihat pengeluaran bulanan', icon: Wallet, sw: 'sw-2' },
  { path: '/income', label: 'Pemasukan', desc: 'Catat sumber pemasukan keluarga', icon: TrendingUp, sw: 'sw-4' },
  { path: '/transfers', label: 'Transfer', desc: 'Pindahkan saldo antar wallet & anggota', icon: ArrowLeftRight, sw: 'sw-3' },
  { path: '/budget', label: 'Anggaran', desc: 'Atur batas belanja per kategori', icon: DollarSign, sw: 'sw-3' },
  { path: '/goals', label: 'Tujuan Tabungan', desc: 'Target menabung bersama', icon: Target, sw: 'sw-5' },
  { path: '/debt', label: 'Hutang', desc: 'Pantau cicilan & sisa hutang', icon: CreditCard, sw: 'sw-2' },
  { path: '/assets', label: 'Portfolio Aset', desc: 'Rumah, kendaraan, investasi, & lainnya', icon: Building2, sw: 'sw-6' },
  { path: '/allocation', label: 'Alokasi Pendapatan', desc: 'Lihat kemana pendapatan dialokasikan', icon: PieChart, sw: 'sw-5' },
  { path: '/budget-analytics', label: 'Analitik Anggaran', desc: 'Tren, perbandingan, & prediksi belanja', icon: Activity, sw: 'sw-4' },
  { path: '/reports', label: 'Laporan', desc: 'Ringkasan keuangan bulanan', icon: BarChart3, sw: 'sw-6' },
]

const KeuanganHubPage = () => {
  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Keuangan</h1>
      </div>

      <div className="hub-list">
        {items.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.path} to={item.path} className="hub-item">
              <div className={`icon-square ${item.sw}`}>
                <Icon size={20} />
              </div>
              <div className="hub-item-body">
                <div className="hub-item-title">{item.label}</div>
                <div className="hub-item-desc">{item.desc}</div>
              </div>
              <ChevronRight size={18} className="hub-item-chevron" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default KeuanganHubPage
