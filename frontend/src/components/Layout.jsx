import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home, Wallet, Calendar, Heart, MoreHorizontal, X,
  Wrench, Link2, Settings, LogOut
} from 'lucide-react'
import './Layout.css'

const Layout = ({ user, onLogout, children }) => {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  const tabs = [
    { path: '/', label: 'Beranda', icon: Home },
    { path: '/keuangan', label: 'Keuangan', icon: Wallet, prefix: true },
    { path: '/kalender', label: 'Kalender', icon: Calendar },
    { path: '/berdua', label: 'Berdua', icon: Heart, prefix: true },
  ]

  const moreItems = [
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/links', label: 'Link Penting', icon: Link2 },
    { path: '/settings', label: 'Pengaturan', icon: Settings },
  ]

  const financeSubPaths = ['/expenses', '/income', '/budget', '/goals', '/debt', '/reports']

  const isActive = (item) => {
    if (item.path === '/keuangan') return location.pathname === '/keuangan' || financeSubPaths.includes(location.pathname)
    if (item.path === '/berdua') return location.pathname === '/berdua' || location.pathname === '/conversation-cards' || location.pathname === '/journal'
    return location.pathname === item.path
  }
  const isMoreActive = moreItems.some(item => location.pathname === item.path)

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
              className={`bottom-nav-item ${isActive(item) ? 'active' : ''}`}
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
                    className={`more-item ${location.pathname === item.path ? 'active' : ''}`}
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
