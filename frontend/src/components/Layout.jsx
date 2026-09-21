import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Home, Wallet, TrendingUp, Target, DollarSign, PieChart, Settings, LogOut } from 'lucide-react'
import './Layout.css'

const Layout = ({ user, onLogout, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/expenses', label: 'Pengeluaran', icon: Wallet },
    { path: '/income', label: 'Pemasukan', icon: TrendingUp },
    { path: '/budget', label: 'Anggaran', icon: DollarSign },
    { path: '/goals', label: 'Tujuan', icon: Target },
    { path: '/debt', label: 'Hutang', icon: PieChart },
    { path: '/reports', label: 'Laporan', icon: TrendingUp },
    { path: '/settings', label: 'Pengaturan', icon: Settings },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            🏠 RumahKas
          </Link>

          <div className="navbar-user">
            <span>👋 {user?.name}</span>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-toggle">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <div className="layout-container">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <ul className="nav-menu">
            {menuItems.map(item => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
            <li className="divider"></li>
            <li>
              <button className="nav-link logout" onClick={onLogout}>
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
