import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import apiClient from './utils/api'

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

  const checkAuth = async () => {
    try {
      const response = await apiClient.get('/auth/me')
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
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />

        <Route
          path="/*"
          element={
            <PrivateRoute user={user}>
              <Layout user={user} onLogout={handleLogout}>
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
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
