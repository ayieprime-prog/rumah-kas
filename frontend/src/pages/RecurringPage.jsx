import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, Edit2, Repeat } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const FREQUENCIES = [
  { value: 'DAILY', label: 'Harian' },
  { value: 'WEEKLY', label: 'Mingguan' },
  { value: 'MONTHLY', label: 'Bulanan' },
  { value: 'YEARLY', label: 'Tahunan' }
]

const frequencyLabel = (value) => FREQUENCIES.find(f => f.value === value)?.label || value

const emptyForm = {
  description: '',
  amount: '',
  categoryId: '',
  walletId: '',
  frequency: 'MONTHLY',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  isActive: true
}

const RecurringPage = () => {
  const [rules, setRules] = useState([])
  const [categories, setCategories] = useState([])
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [recurringRes, categoriesRes, walletsRes] = await Promise.all([
        axios.get('/api/recurring'),
        axios.get('/api/categories'),
        axios.get('/api/wallets')
      ])
      setRules(recurringRes.data || [])
      setCategories(categoriesRes.data || [])
      setWallets(walletsRes.data || [])
    } catch (err) {
      setError('Gagal memuat transaksi rutin')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        walletId: form.walletId || null,
        endDate: form.endDate || null
      }
      if (editingId) {
        await axios.put(`/api/recurring/${editingId}`, payload)
      } else {
        await axios.post('/api/recurring', payload)
      }
      setShowModal(false)
      setEditingId(null)
      setForm(emptyForm)
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || (editingId ? 'Gagal mengubah transaksi rutin' : 'Gagal membuat transaksi rutin'))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (rule) => {
    setEditingId(rule.id)
    setForm({
      description: rule.description,
      amount: rule.amount,
      categoryId: rule.categoryId,
      walletId: rule.walletId || '',
      frequency: rule.frequency,
      startDate: rule.startDate.slice(0, 10),
      endDate: rule.endDate ? rule.endDate.slice(0, 10) : '',
      isActive: rule.isActive
    })
    setError('')
    setShowModal(true)
  }

  const handleToggleActive = async (rule) => {
    try {
      await axios.put(`/api/recurring/${rule.id}`, { isActive: !rule.isActive })
      loadData()
    } catch (err) {
      setError('Gagal mengubah status transaksi rutin')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus transaksi rutin ini? Pengeluaran yang sudah tercatat sebelumnya tidak akan terhapus.')) return
    try {
      await axios.delete(`/api/recurring/${id}`)
      loadData()
    } catch (err) {
      setError('Gagal menghapus transaksi rutin')
    }
  }

  const handleOpenModal = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  if (loading) return <div className="loading">Memuat transaksi rutin...</div>

  return (
    <div className="list-page">
      <BackButton to="/keuangan" label="Keuangan" />

      <div className="page-header">
        <h1>Transaksi Rutin</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn-pill" onClick={handleOpenModal} style={{ marginBottom: 20 }} disabled={categories.length === 0}>
        <Plus size={18} /> Tambah Transaksi Rutin
      </button>

      {categories.length === 0 && (
        <div className="alert alert-error">Buat kategori pengeluaran terlebih dahulu sebelum menambah transaksi rutin.</div>
      )}

      {rules.length > 0 ? (
        <div className="card">
          {rules.map(rule => (
            <div key={rule.id} className="list-row" style={{ alignItems: 'center', opacity: rule.isActive ? 1 : 0.55 }}>
              <div className="icon-square" style={{ width: 36, height: 36, background: rule.category?.color || 'var(--secondary-color)' }}>
                <Repeat size={16} />
              </div>
              <div className="list-row-body" style={{ flex: 1 }}>
                <div className="list-row-title">{rule.description}</div>
                <div className="list-row-subtitle">
                  {rule.category?.name} · {frequencyLabel(rule.frequency)}
                  {rule.wallet ? ` · ${rule.wallet.name}` : ''}
                  {!rule.isActive ? ' · Nonaktif' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginRight: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>
                  Rp {rule.amount.toLocaleString('id-ID')}
                </div>
              </div>
              <button className="icon-btn" onClick={() => handleToggleActive(rule)} aria-label={rule.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{rule.isActive ? 'ON' : 'OFF'}</span>
              </button>
              <button className="icon-btn" onClick={() => handleEdit(rule)} aria-label="Edit transaksi rutin">
                <Edit2 size={16} />
              </button>
              <button className="icon-btn" onClick={() => handleDelete(rule.id)} aria-label="Hapus transaksi rutin">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Repeat size={28} className="empty-state-icon" />
          <p>Belum ada transaksi rutin</p>
          <span>Tambahkan tagihan berulang seperti langganan atau cicilan</span>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Transaksi Rutin' : 'Tambah Transaksi Rutin'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Deskripsi</label>
                <input
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Contoh: Langganan Netflix"
                />
              </div>
              <div className="form-group">
                <label>Jumlah (Rp)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="50000"
                />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Pilih kategori</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Wallet (opsional)</label>
                <select value={form.walletId} onChange={e => setForm({ ...form, walletId: e.target.value })}>
                  <option value="">Tidak ditentukan</option>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Frekuensi</label>
                <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                  {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Mulai</label>
                <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Berakhir (opsional)</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="isActive" style={{ margin: 0 }}>Aktif</label>
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

export default RecurringPage
