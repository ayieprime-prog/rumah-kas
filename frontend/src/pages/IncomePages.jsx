import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Trash2, TrendingUp, Sparkles, Lock } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const currentMonth = () => new Date().toISOString().slice(0, 7)

const IncomePages = () => {
  const [incomes, setIncomes] = useState([])
  const [wallets, setWallets] = useState([])
  const [categories, setCategories] = useState([])
  const [locks, setLocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ source: '', amount: '', walletId: '', lockedCategoryId: '', date: new Date().toISOString().slice(0, 10) })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [incomeRes, walletsRes, householdRes, locksRes] = await Promise.all([
        axios.get('/api/income', { params: { month: currentMonth() } }),
        axios.get('/api/wallets'),
        axios.get('/api/household'),
        axios.get('/api/income/locks', { params: { month: currentMonth() } })
      ])
      setIncomes(incomeRes.data.incomes || [])
      setWallets(walletsRes.data || [])
      setCategories(householdRes.data.categories || [])
      setLocks(locksRes.data.allocations || [])
    } catch (err) {
      setError('Gagal memuat data pemasukan')
    } finally {
      setLoading(false)
    }
  }

  const total = incomes.reduce((sum, i) => sum + i.amount, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const submitData = { ...form }
      if (!submitData.walletId) delete submitData.walletId
      if (!submitData.lockedCategoryId) delete submitData.lockedCategoryId
      await axios.post('/api/income', submitData)
      setShowModal(false)
      setForm({ source: '', amount: '', walletId: '', lockedCategoryId: '', date: new Date().toISOString().slice(0, 10) })
      loadData()
    } catch (err) {
      setError('Gagal menyimpan pemasukan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/income/${id}`)
      loadData()
    } catch (err) {
      setError('Gagal menghapus pemasukan')
    }
  }

  if (loading) return <div className="loading">Memuat pemasukan...</div>

  return (
    <div className="list-page">
      <BackButton to="/keuangan" label="Keuangan" />

      <div className="page-header">
        <h1>Pemasukan</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card-hero" style={{ marginBottom: 20 }}>
        <div className="hero-label">Total Pemasukan Bulan Ini</div>
        <div className="hero-value">Rp {total.toLocaleString('id-ID')}</div>
      </div>

      <button className="btn-pill" onClick={() => setShowModal(true)} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tambah Pemasukan
      </button>

      {locks.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="section-title"><Lock size={15} style={{ verticalAlign: -2, marginRight: 4 }} />Pendapatan Terkunci</h2>
          {locks.map(lock => (
            <div key={lock.categoryId} className="list-row" style={{ alignItems: 'flex-start' }}>
              <div className="list-row-body">
                <div className="list-row-title">{lock.categoryName}</div>
                <div className="progress-track">
                  <div
                    className="progress-track-fill"
                    style={{
                      width: `${Math.min(100, (lock.spent / lock.allocated) * 100)}%`,
                      background: lock.remaining < 0 ? '#ef4444' : 'var(--accent-color)'
                    }}
                  ></div>
                </div>
                <div className="list-row-subtitle">
                  Terpakai Rp {lock.spent.toLocaleString('id-ID')} / Rp {lock.allocated.toLocaleString('id-ID')}
                  {lock.remaining < 0
                    ? ` · Lewat Rp ${Math.abs(lock.remaining).toLocaleString('id-ID')}`
                    : ` · Sisa Rp ${lock.remaining.toLocaleString('id-ID')}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Riwayat Pemasukan</h2>
        {incomes.length > 0 ? (
          <div>
            {incomes.map(inc => (
              <div key={inc.id} className="list-row">
                <div className="icon-square sw-4" style={{ width: 36, height: 36 }}>
                  <TrendingUp size={16} />
                </div>
                <div className="list-row-body">
                  <div className="list-row-title">
                    {inc.source}
                    {inc.lockedCategory && (
                      <span className="pill-badge" style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px' }}>
                        <Lock size={10} style={{ verticalAlign: -1, marginRight: 2 }} />{inc.lockedCategory.name}
                      </span>
                    )}
                  </div>
                  <div className="list-row-subtitle">{new Date(inc.date).toLocaleDateString('id-ID')}</div>
                </div>
                <div className="list-row-amount positive">+Rp {inc.amount.toLocaleString('id-ID')}</div>
                <button className="icon-btn" onClick={() => handleDelete(inc.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Sparkles size={28} className="empty-state-icon" />
            <p>Belum ada pemasukan bulan ini</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Pemasukan</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Sumber</label>
                <input required value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Gaji Bulanan" />
              </div>
              <div className="form-group">
                <label>Jumlah (Rp)</label>
                <input required type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="5000000" />
              </div>
              <div className="form-group">
                <label>Tanggal</label>
                <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              {wallets.length > 0 && (
                <div className="form-group">
                  <label>Wallet (Opsional)</label>
                  <select value={form.walletId} onChange={e => setForm({ ...form, walletId: e.target.value })}>
                    <option value="">Tidak ada wallet tertentu</option>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}
              {categories.length > 0 && (
                <div className="form-group">
                  <label>Kunci untuk Kategori (Opsional)</label>
                  <select value={form.lockedCategoryId} onChange={e => setForm({ ...form, lockedCategoryId: e.target.value })}>
                    <option value="">Tidak dikunci -- masuk kas bebas</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    Pendapatan ini tidak dihitung sebagai Uang Bebas sampai habis terpakai di kategori tersebut.
                  </small>
                </div>
              )}
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

export default IncomePages
