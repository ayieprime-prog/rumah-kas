import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Trash2, Target, PiggyBank } from 'lucide-react'
import './ListPages.css'

const GoalsPage = () => {
  const token = localStorage.getItem('token')
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', targetAmount: '', targetDate: '' })
  const [addFundsFor, setAddFundsFor] = useState(null)
  const [addAmount, setAddAmount] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/goals', { headers: { Authorization: `Bearer ${token}` } })
      setGoals(res.data || [])
    } catch (err) {
      setError('Gagal memuat data target tabungan')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post('/api/goals', form, { headers: { Authorization: `Bearer ${token}` } })
      setShowModal(false)
      setForm({ name: '', targetAmount: '', targetDate: '' })
      loadData()
    } catch (err) {
      setError('Gagal menyimpan target tabungan')
    } finally {
      setSaving(false)
    }
  }

  const handleAddFunds = async (goal) => {
    const amount = parseFloat(addAmount)
    if (!amount || amount <= 0) return
    try {
      await axios.put(`/api/goals/${goal.id}`, { currentAmount: goal.currentAmount + amount }, { headers: { Authorization: `Bearer ${token}` } })
      setAddFundsFor(null)
      setAddAmount('')
      loadData()
    } catch (err) {
      setError('Gagal menambah dana')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/goals/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      loadData()
    } catch (err) {
      setError('Gagal menghapus target')
    }
  }

  if (loading) return <div className="loading">Memuat target tabungan...</div>

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Tujuan Tabungan</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn-pill" onClick={() => setShowModal(true)} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tambah Target
      </button>

      {goals.length > 0 ? (
        <div className="category-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {goals.map(goal => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            return (
              <div key={goal.id} className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="icon-square sw-5" style={{ width: 32, height: 32 }}><Target size={16} /></div>
                    <strong style={{ fontSize: 14 }}>{goal.name}</strong>
                  </div>
                  <button className="icon-btn" onClick={() => handleDelete(goal.id)}><Trash2 size={16} /></button>
                </div>
                <div className="progress-track">
                  <div className="progress-track-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-color), var(--secondary-color))' }}></div>
                </div>
                <div className="list-row-subtitle" style={{ margin: '8px 0' }}>
                  {Math.round(progress)}% · target {new Date(goal.targetDate).toLocaleDateString('id-ID')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                  <span>Rp {goal.currentAmount.toLocaleString('id-ID')}</span>
                  <span style={{ color: 'var(--text-muted)' }}>/ Rp {goal.targetAmount.toLocaleString('id-ID')}</span>
                </div>
                {addFundsFor === goal.id ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" min="0" autoFocus placeholder="Jumlah" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
                    <button className="btn-primary" onClick={() => handleAddFunds(goal)}>OK</button>
                  </div>
                ) : (
                  <button className="btn-dashed" onClick={() => setAddFundsFor(goal.id)}>
                    <PiggyBank size={16} /> Tambah Dana
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Target size={28} className="empty-state-icon" />
          <p>Belum ada target tabungan</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Target Tabungan</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Nama Target</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dana Darurat" />
              </div>
              <div className="form-group">
                <label>Jumlah Target (Rp)</label>
                <input required type="number" min="0" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} placeholder="10000000" />
              </div>
              <div className="form-group">
                <label>Target Tanggal</label>
                <input required type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} />
              </div>
              <button type="submit" className="btn-pill" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalsPage
