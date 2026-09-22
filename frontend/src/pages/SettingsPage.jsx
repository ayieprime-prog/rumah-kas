import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Users, Home, UserPlus, X, LogOut, History } from 'lucide-react'
import './ListPages.css'

const ACTION_LABELS = {
  CREATE_EXPENSE: 'menambah pengeluaran',
  UPDATE_EXPENSE: 'mengubah pengeluaran',
  DELETE_EXPENSE: 'menghapus pengeluaran',
  CREATE_INCOME: 'menambah pemasukan',
  UPDATE_INCOME: 'mengubah pemasukan',
  DELETE_INCOME: 'menghapus pemasukan',
  CREATE_DEBT: 'menambah hutang',
  UPDATE_DEBT: 'mengubah hutang',
  PAY_DEBT_INSTALLMENT: 'membayar cicilan',
  DELETE_DEBT: 'menghapus hutang',
  CREATE_GOAL: 'membuat target tabungan',
  UPDATE_GOAL: 'mengubah target tabungan',
  ADD_GOAL_FUNDS: 'menambah dana tabungan',
  DELETE_GOAL: 'menghapus target tabungan'
}

const SettingsPage = ({ onLogout }) => {
  const [household, setHousehold] = useState(null)
  const [me, setMe] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' })
  const [inviting, setInviting] = useState(false)
  const [householdName, setHouseholdName] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [householdRes, meRes, activityRes] = await Promise.all([
        axios.get('/api/household'),
        axios.get('/api/auth/me'),
        axios.get('/api/activity')
      ])
      setHousehold(householdRes.data)
      setHouseholdName(householdRes.data.name)
      setMe(meRes.data.user)
      setActivity(activityRes.data || [])
    } catch (err) {
      setError('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async () => {
    try {
      await axios.put('/api/household/settings', { name: householdName })
      setSuccess('Nama keluarga tersimpan')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Gagal menyimpan nama keluarga')
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviting(true)
    setError('')
    try {
      const res = await axios.post('/api/household/invite-member', inviteForm)
      setSuccess(`Anggota ditambahkan. Password sementara: ${res.data.temporaryPassword}`)
      setShowInvite(false)
      setInviteForm({ name: '', email: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengundang anggota')
    } finally {
      setInviting(false)
    }
  }

  if (loading) return <div className="loading">Memuat pengaturan...</div>

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Pengaturan</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h2 className="section-title"><Home size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Keluarga</h2>
        <div className="form-group">
          <label>Nama Keluarga</label>
          <input value={householdName} onChange={e => setHouseholdName(e.target.value)} disabled={me?.role !== 'ADMIN'} />
        </div>
        {me?.role === 'ADMIN' && (
          <button className="btn-primary" onClick={handleSaveName}>Simpan</button>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            <Users size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Anggota Keluarga
          </h2>
          {me?.role === 'ADMIN' && (
            <button className="icon-btn" onClick={() => setShowInvite(true)}><UserPlus size={18} /></button>
          )}
        </div>
        {household?.users?.map(u => (
          <div key={u.id} className="list-row">
            <div className="icon-square sw-6" style={{ width: 36, height: 36 }}>
              {u.name?.charAt(0).toUpperCase()}
            </div>
            <div className="list-row-body">
              <div className="list-row-title">{u.name}</div>
              <div className="list-row-subtitle">{u.email}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{u.role}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="section-title"><History size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Aktivitas Terbaru</h2>
        {activity.length > 0 ? (
          activity.map(log => (
            <div key={log.id} className="list-row">
              <div className="icon-square sw-6" style={{ width: 32, height: 32 }}>
                {log.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="list-row-body">
                <div className="list-row-title">
                  {log.user?.name} {ACTION_LABELS[log.action] || log.action.toLowerCase()}
                </div>
                <div className="list-row-subtitle">{log.summary}</div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <History size={28} className="empty-state-icon" />
            <p>Belum ada aktivitas tercatat</p>
          </div>
        )}
      </div>

      <button className="btn-pill" style={{ background: 'var(--danger-color)' }} onClick={onLogout}>
        <LogOut size={18} /> Logout
      </button>

      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Undang Anggota</h2>
              <button className="modal-close" onClick={() => setShowInvite(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleInvite} className="auth-form">
              <div className="form-group">
                <label>Nama</label>
                <input required value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="Istri Budi" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input required type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="istri@email.com" />
              </div>
              <button type="submit" className="btn-pill" disabled={inviting}>
                {inviting ? 'Mengundang...' : 'Undang'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
