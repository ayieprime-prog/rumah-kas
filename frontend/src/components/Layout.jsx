import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Wallet, Calendar, Heart, Wrench, Link2, Settings } from 'lucide-react'
import './Layout.css'

const Layout = ({ user, children }) => {
  const location = useLocation()

  const tabs = [
    { path: '/', label: 'Beranda', icon: Home },
    { path: '/keuangan', label: 'Keuangan', icon: Wallet },
    { path: '/kalender', label: 'Kalender', icon: Calendar },
    { path: '/berdua', label: 'Berdua', icon: Heart },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/links', label: 'Link Penting', icon: Link2 },
    { path: '/settings', label: 'Pengaturan', icon: Settings },
  ]

  const financeSubPaths = ['/expenses', '/income', '/budget', '/goals', '/debt', '/reports']
  const berduaSubPaths = ['/conversation-cards', '/journal']

  const isActive = (item) => {
    if (item.path === '/keuangan') return location.pathname === '/keuangan' || financeSubPaths.includes(location.pathname)
    if (item.path === '/berdua') return location.pathname === '/berdua' || berduaSubPaths.includes(location.pathname)
    return location.pathname === item.path
  }

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
