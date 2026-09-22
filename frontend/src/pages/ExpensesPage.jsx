import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Trash2, Sparkles } from 'lucide-react'
import './ListPages.css'

const SWATCHES = ['sw-1', 'sw-2', 'sw-3', 'sw-4', 'sw-5', 'sw-6']
const ICON_MAP = { Groceries: '🛒', Utilities: '💡', Transportation: '🚗', Entertainment: '🎬' }

const currentMonth = () => new Date().toISOString().slice(0, 7)

const ExpensesPage = () => {
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', categoryId: '', date: new Date().toISOString().slice(0, 10) })

  const month = currentMonth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [householdRes, expensesRes] = await Promise.all([
        axios.get('/api/household'),
        axios.get('/api/expenses', { params: { month } })
      ])
      setCategories(householdRes.data.categories || [])
      setExpenses(expensesRes.data.expenses || [])
    } catch (err) {
      setError('Gagal memuat data pengeluaran')
    } finally {
      setLoading(false)
    }
  }

  const totalsByCategory = categories.map(cat => {
    const total = expenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0)
    return { ...cat, total }
  })
  const maxCategoryTotal = Math.max(1, ...totalsByCategory.map(c => c.total))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post('/api/expenses', form)
      setShowModal(false)
      setForm({ description: '', amount: '', categoryId: '', date: new Date().toISOString().slice(0, 10) })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan pengeluaran')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/expenses/${id}`)
      loadData()
    } catch (err) {
      setError('Gagal menghapus pengeluaran')
    }
  }

  if (loading) return <div className="loading">Memuat pengeluaran...</div>

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Pengeluaran</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn-pill" onClick={() => setShowModal(true)} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tambah Pengeluaran
      </button>

      {categories.length > 0 ? (
        <div className="category-grid">
          {totalsByCategory.map((cat, i) => (
            <div key={cat.id} className="category-card">
              <div className={`icon-square ${SWATCHES[i % SWATCHES.length]}`}>
                <span style={{ fontSize: 18 }}>{ICON_MAP[cat.name] || '📁'}</span>
              </div>
              <div className="category-name">{cat.name}</div>
              <div className="category-amount">Rp {cat.total.toLocaleString('id-ID')}</div>
              <div className="progress-track">
                <div
                  className="progress-track-fill"
                  style={{ width: `${(cat.total / maxCategoryTotal) * 100}%`, background: 'var(--accent-color)' }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Sparkles size={28} className="empty-state-icon" />
          <p>Belum ada kategori pengeluaran</p>
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="section-title">Transaksi Bulan Ini</h2>
        {expenses.length > 0 ? (
          <div>
            {expenses.map(exp => (
              <div key={exp.id} className="list-row">
                <div className={`icon-square ${SWATCHES[categories.findIndex(c => c.id === exp.categoryId) % SWATCHES.length] || 'sw-1'}`} style={{ width: 36, height: 36 }}>
                  <span style={{ fontSize: 14 }}>{ICON_MAP[exp.category?.name] || '📁'}</span>
                </div>
                <div className="list-row-body">
                  <div className="list-row-title">{exp.description}</div>
                  <div className="list-row-subtitle">{exp.category?.name} · {new Date(exp.date).toLocaleDateString('id-ID')}</div>
                </div>
                <div className="list-row-amount negative">-Rp {exp.amount.toLocaleString('id-ID')}</div>
                <button className="icon-btn" onClick={() => handleDelete(exp.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Sparkles size={28} className="empty-state-icon" />
            <p>Belum ada pengeluaran bulan ini</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Pengeluaran</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Deskripsi</label>
                <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Belanja bulanan" />
              </div>
              <div className="form-group">
                <label>Jumlah (Rp)</label>
                <input required type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="150000" />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Pilih kategori</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tanggal</label>
                <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
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

export default ExpensesPage
