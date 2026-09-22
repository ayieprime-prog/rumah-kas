import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import KeuanganHubPage from './pages/KeuanganHubPage'
import ExpensesPage from './pages/ExpensesPage'
import IncomePages from './pages/IncomePages'
import BudgetPage from './pages/BudgetPage'
import GoalsPage from './pages/GoalsPage'
import DebtPage from './pages/DebtPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import CalendarPage from './pages/CalendarPage'
import BerduaHubPage from './pages/BerduaHubPage'
import ConversationCardsPage from './pages/ConversationCardsPage'
import JournalPage from './pages/JournalPage'
import MaintenancePage from './pages/MaintenancePage'
import LinksPage from './pages/LinksPage'
import WalletPage from './pages/WalletPage'
import AssetPage from './pages/AssetPage'
import TransferPage from './pages/TransferPage'

// Components
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'

// Styles
import './App.css'

axios.defaults.withCredentials = true

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // The auth token lives in an httpOnly cookie set by the server, so the
  // browser attaches it automatically (withCredentials above) - we just
  // ask the server who we are on load rather than checking localStorage
  useEffect(() => {
    checkAuth()
  }, [])

  // Force logout on any expired/invalid token response, instead of leaving
  // the user stuck on a page with generic "gagal memuat data" errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setUser(null)
        }
        return Promise.reject(error)
      }
    )
    return () => axios.interceptors.response.eject(interceptor)
  }, [])

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setUser(response.data.user)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch (error) {
      // clear client state regardless of whether the request succeeded
    }
    setUser(null)
  }

  if (loading) {
    return <div className="loading-screen">🏠 Pundi sedang dimulai...</div>
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />

          <Route
            path="/*"
            element={
              <PrivateRoute user={user}>
                <Layout user={user}>
                  <ErrorBoundary>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/keuangan" element={<KeuanganHubPage />} />
                      <Route path="/expenses" element={<ExpensesPage />} />
                      <Route path="/income" element={<IncomePages />} />
                      <Route path="/budget" element={<BudgetPage />} />
                      <Route path="/goals" element={<GoalsPage />} />
                      <Route path="/debt" element={<DebtPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/kalender" element={<CalendarPage />} />
                      <Route path="/berdua" element={<BerduaHubPage />} />
                      <Route path="/conversation-cards" element={<ConversationCardsPage />} />
                      <Route path="/journal" element={<JournalPage />} />
                      <Route path="/maintenance" element={<MaintenancePage />} />
                      <Route path="/links" element={<LinksPage />} />
                      <Route path="/wallets" element={<WalletPage />} />
                      <Route path="/assets" element={<AssetPage />} />
                      <Route path="/transfers" element={<TransferPage />} />
                      <Route path="/settings" element={<SettingsPage onLogout={handleLogout} />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </ErrorBoundary>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App
