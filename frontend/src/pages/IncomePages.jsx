import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Trash2, TrendingUp, Sparkles } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const currentMonth = () => new Date().toISOString().slice(0, 7)

const IncomePages = () => {
  const [incomes, setIncomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ source: '', amount: '', date: new Date().toISOString().slice(0, 10) })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/income', { params: { month: currentMonth() } })
      setIncomes(res.data.incomes || [])
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
      await axios.post('/api/income', form)
      setShowModal(false)
      setForm({ source: '', amount: '', date: new Date().toISOString().slice(0, 10) })
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
                  <div className="list-row-title">{inc.source}</div>
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
