import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home, Wallet, DollarSign, Target, MoreHorizontal, X,
  TrendingUp, CreditCard, BarChart3, Settings, LogOut
} from 'lucide-react'
import './Layout.css'

const Layout = ({ user, onLogout, children }) => {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  const tabs = [
    { path: '/', label: 'Beranda', icon: Home },
    { path: '/expenses', label: 'Pengeluaran', icon: Wallet },
    { path: '/budget', label: 'Anggaran', icon: DollarSign },
    { path: '/goals', label: 'Tujuan', icon: Target },
  ]

  const moreItems = [
    { path: '/income', label: 'Pemasukan', icon: TrendingUp },
    { path: '/debt', label: 'Hutang', icon: CreditCard },
    { path: '/reports', label: 'Laporan', icon: BarChart3 },
    { path: '/settings', label: 'Pengaturan', icon: Settings },
  ]

  const isActive = (path) => location.pathname === path
  const isMoreActive = moreItems.some(item => isActive(item.path))

  return (
    <div className="layout">
      <header className="topbar">
        <Link to="/" className="topbar-logo">
          🏠 RumahKas
        </Link>
        <div className="topbar-user">
          <span>{user?.name}</span>
        </div>
      </header>

      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>

      <nav className="bottom-nav">
        {tabs.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMoreOpen(false)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
        <button
          className={`bottom-nav-item ${isMoreActive || moreOpen ? 'active' : ''}`}
          onClick={() => setMoreOpen(true)}
        >
          <MoreHorizontal size={20} />
          <span>Lainnya</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="modal-overlay" onClick={() => setMoreOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lainnya</h2>
              <button className="modal-close" onClick={() => setMoreOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="more-list">
              {moreItems.map(item => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`more-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setMoreOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              <button className="more-item logout" onClick={onLogout}>
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
