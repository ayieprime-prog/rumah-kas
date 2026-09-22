import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Trash2, CreditCard, CheckCircle2 } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const DebtPage = () => {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', totalAmount: '', monthlyPayment: '', startDate: new Date().toISOString().slice(0, 10), creditor: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/debt')
      setDebts(res.data || [])
    } catch (err) {
      setError('Gagal memuat data hutang')
    } finally {
      setLoading(false)
    }
  }

  const totalRemaining = debts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0)
  const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post('/api/debt', form)
      setShowModal(false)
      setForm({ name: '', totalAmount: '', monthlyPayment: '', startDate: new Date().toISOString().slice(0, 10), creditor: '' })
      loadData()
    } catch (err) {
      setError('Gagal menyimpan hutang')
    } finally {
      setSaving(false)
    }
  }

  const handlePayInstallment = async (debt) => {
    const newPaid = Math.min(debt.paidAmount + debt.monthlyPayment, debt.totalAmount)
    try {
      await axios.put(`/api/debt/${debt.id}`, { paidAmount: newPaid })
      loadData()
    } catch (err) {
      setError('Gagal mencatat pembayaran')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/debt/${id}`)
      loadData()
    } catch (err) {
      setError('Gagal menghapus hutang')
    }
  }

  if (loading) return <div className="loading">Memuat data hutang...</div>

  return (
    <div className="list-page">
      <BackButton to="/keuangan" label="Keuangan" />

      <div className="page-header">
        <h1>Hutang</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="two-col-summary">
        <div className="summary-tile tile-danger">
          <div className="tile-label">Sisa Hutang</div>
          <div className="tile-value">Rp {totalRemaining.toLocaleString('id-ID')}</div>
        </div>
        <div className="summary-tile tile-secondary">
          <div className="tile-label">Sudah Dibayar</div>
          <div className="tile-value">Rp {totalPaid.toLocaleString('id-ID')}</div>
        </div>
      </div>

      <button className="btn-pill" onClick={() => setShowModal(true)} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tambah Hutang
      </button>

      <div className="card">
        <h2 className="section-title">Daftar Hutang</h2>
        {debts.length > 0 ? (
          <div>
            {debts.map(debt => {
              const pct = Math.min((debt.paidAmount / debt.totalAmount) * 100, 100)
              const isPaidOff = debt.paidAmount >= debt.totalAmount
              return (
                <div key={debt.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                  <div className="icon-square sw-2" style={{ width: 36, height: 36 }}>
                    <CreditCard size={16} />
                  </div>
                  <div className="list-row-body">
                    <div className="list-row-title">{debt.name}{debt.creditor ? ` · ${debt.creditor}` : ''}</div>
                    <div className="progress-track">
                      <div className="progress-track-fill" style={{ width: `${pct}%`, background: 'var(--secondary-color)' }}></div>
                    </div>
                    <div className="list-row-subtitle">
                      Rp {debt.paidAmount.toLocaleString('id-ID')} / Rp {debt.totalAmount.toLocaleString('id-ID')} · cicilan Rp {debt.monthlyPayment.toLocaleString('id-ID')}/bln
                    </div>
                    {!isPaidOff && (
                      <button className="btn-dashed" style={{ marginTop: 10 }} onClick={() => handlePayInstallment(debt)}>
                        <CheckCircle2 size={16} /> Bayar Cicilan Bulan Ini
                      </button>
                    )}
                  </div>
                  <button className="icon-btn" onClick={() => handleDelete(debt.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <CreditCard size={28} className="empty-state-icon" />
            <p>Belum ada catatan hutang</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Hutang</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Nama Hutang</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Cicilan Motor" />
              </div>
              <div className="form-group">
                <label>Kreditur</label>
                <input value={form.creditor} onChange={e => setForm({ ...form, creditor: e.target.value })} placeholder="Bank ABC" />
              </div>
              <div className="form-group">
                <label>Total Hutang (Rp)</label>
                <input required type="number" min="0" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} placeholder="15000000" />
              </div>
              <div className="form-group">
                <label>Cicilan per Bulan (Rp)</label>
                <input required type="number" min="0" value={form.monthlyPayment} onChange={e => setForm({ ...form, monthlyPayment: e.target.value })} placeholder="1500000" />
              </div>
              <div className="form-group">
                <label>Tanggal Mulai</label>
                <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
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

export default DebtPage
