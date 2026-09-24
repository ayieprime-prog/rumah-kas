import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Wallet, Calendar, Heart, MoreHorizontal } from 'lucide-react'
import NotificationBell from './NotificationBell'
import './Layout.css'

const Layout = ({ user, children }) => {
  const location = useLocation()

  const tabs = [
    { path: '/', label: 'Beranda', icon: Home },
    { path: '/keuangan', label: 'Keuangan', icon: Wallet },
    { path: '/kalender', label: 'Kalender', icon: Calendar },
    { path: '/berdua', label: 'Berdua', icon: Heart },
    { path: '/lainnya', label: 'Lainnya', icon: MoreHorizontal },
  ]

  const financeSubPaths = ['/expenses', '/income', '/budget', '/goals', '/debt', '/reports']
  const berduaSubPaths = ['/conversation-cards', '/journal']
  const lainnyaSubPaths = ['/maintenance', '/links', '/settings']

  const isActive = (item) => {
    if (item.path === '/keuangan') return location.pathname === '/keuangan' || financeSubPaths.includes(location.pathname)
    if (item.path === '/berdua') return location.pathname === '/berdua' || berduaSubPaths.includes(location.pathname)
    if (item.path === '/lainnya') return location.pathname === '/lainnya' || lainnyaSubPaths.includes(location.pathname)
    return location.pathname === item.path
  }

  return (
    <div className="layout">
      <header className="topbar">
        <Link to="/" className="topbar-logo">
          <img src="/pundi-icon.svg" alt="Pundi" className="topbar-logo-icon" />
          Pundi
        </Link>
        <div className="topbar-right">
          <NotificationBell />
          <Link to="/profile" className="topbar-user">
            <span>{user?.name}</span>
          </Link>
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
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default Layout
