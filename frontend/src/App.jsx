import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ExpensesPage from './pages/ExpensesPage'
import IncomePages from './pages/IncomePages'
import BudgetPage from './pages/BudgetPage'
import GoalsPage from './pages/GoalsPage'
import DebtPage from './pages/DebtPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

// Components
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'

// Styles
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [token])

  // Force logout on any expired/invalid token response, instead of leaving
  // the user stuck on a page with generic "gagal memuat data" errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
        return Promise.reject(error)
      }
    )
    return () => axios.interceptors.response.eject(interceptor)
  }, [])

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (newToken, userData) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  if (loading) {
    return <div className="loading-screen">🏠 RumahKas sedang dimulai...</div>
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
                <Layout user={user} onLogout={handleLogout}>
                  <ErrorBoundary>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/expenses" element={<ExpensesPage />} />
                      <Route path="/income" element={<IncomePages />} />
                      <Route path="/budget" element={<BudgetPage />} />
                      <Route path="/goals" element={<GoalsPage />} />
                      <Route path="/debt" element={<DebtPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
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
