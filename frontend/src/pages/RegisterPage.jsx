import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../utils/api'
import './AuthPages.css'

const RegisterPage = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    householdName: '',
    name: '',
    email: '',
    password: '',
    passwordConfirm: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.passwordConfirm) {
      setError('Password tidak cocok')
      return
    }

    setLoading(true)

    try {
      const response = await apiClient.post('/auth/register', {
        householdName: formData.householdName,
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      const { token, user } = response.data
      onRegister(token, user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Pendaftaran gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🏠 RumahKas</h1>
          <p>Manajemen Keuangan Keluarga</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Nama Keluarga</label>
            <input
              type="text"
              name="householdName"
              value={formData.householdName}
              onChange={handleChange}
              required
              placeholder="Keluarga Budi"
            />
          </div>

          <div className="form-group">
            <label>Nama Lengkap</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Budi Santoso"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="nama@email.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label>Konfirmasi Password</label>
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Sedang mendaftar...' : 'Daftar'}
          </button>
        </form>

        <p className="auth-link">
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
