import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Trash2, Wallet } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const currentMonth = () => new Date().toISOString().slice(0, 7)

const BudgetPage = () => {
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ categoryId: '', limit: '' })

  const month = currentMonth()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [householdRes, budgetsRes] = await Promise.all([
        axios.get('/api/household'),
        axios.get('/api/budget', { params: { month } })
      ])
      setCategories(householdRes.data.categories || [])
      setBudgets(budgetsRes.data || [])
    } catch (err) {
      setError('Gagal memuat data anggaran')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post('/api/budget', { ...form, month })
      setShowModal(false)
      setForm({ categoryId: '', limit: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan anggaran')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/budget/${id}`)
      loadData()
    } catch (err) {
      setError('Gagal menghapus anggaran')
    }
  }

  const availableCategories = categories.filter(c => !budgets.some(b => b.categoryId === c.id))

  if (loading) return <div className="loading">Memuat anggaran...</div>

  return (
    <div className="list-page">
      <BackButton to="/keuangan" label="Keuangan" />

      <div className="page-header">
        <h1>Anggaran</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn-pill" onClick={() => setShowModal(true)} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tambah Anggaran
      </button>

      <div className="card">
        <h2 className="section-title">Anggaran Bulan Ini</h2>
        {budgets.length > 0 ? (
          <div>
            {budgets.map(b => {
              const pct = Math.min((b.spent / b.limit) * 100, 100)
              const over = b.spent > b.limit
              return (
                <div key={b.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                  <div className="icon-square sw-3" style={{ width: 36, height: 36 }}>
                    <Wallet size={16} />
                  </div>
                  <div className="list-row-body">
                    <div className="list-row-title">{b.category.name}</div>
                    <div className="progress-track">
                      <div
                        className="progress-track-fill"
                        style={{ width: `${pct}%`, background: over ? 'var(--danger-color)' : 'var(--secondary-color)' }}
                      ></div>
                    </div>
                    <div className="list-row-subtitle">
                      Rp {b.spent.toLocaleString('id-ID')} / Rp {b.limit.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <button className="icon-btn" onClick={() => handleDelete(b.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Wallet size={28} className="empty-state-icon" />
            <p>Belum ada anggaran bulan ini</p>
            <span>Buat anggaran per kategori supaya pengeluaran lebih terkontrol</span>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Anggaran</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Kategori</label>
                <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Pilih kategori</option>
                  {availableCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Batas Anggaran (Rp)</label>
                <input required type="number" min="0" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} placeholder="700000" />
              </div>
              <button type="submit" className="btn-pill" disabled={saving || availableCategories.length === 0}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BudgetPage
