import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Check, XCircle, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const TransferPage = () => {
  const [transfers, setTransfers] = useState([])
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('all') // all, pending, completed
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    fromWalletId: '',
    toWalletId: '',
    amount: '',
    note: '',
    recipientId: null
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [transferRes, walletRes] = await Promise.all([
        axios.get('/api/transfers'),
        axios.get('/api/wallets')
      ])
      setTransfers(transferRes.data.transfers || [])
      setWallets(walletRes.data || [])
    } catch (err) {
      setError('Gagal memuat data transfer')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setForm({
      fromWalletId: wallets.length > 0 ? wallets[0].id : '',
      toWalletId: wallets.length > 1 ? wallets[1].id : '',
      amount: '',
      note: '',
      recipientId: null
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const submitData = {
        ...form,
        amount: parseFloat(form.amount)
      }

      await axios.post('/api/transfers', submitData)
      setShowModal(false)
      loadData()
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuat transfer')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/transfers/${id}/approve`)
      loadData()
    } catch (err) {
      setError('Gagal menyetujui transfer')
    }
  }

  const handleReject = async (id) => {
    try {
      await axios.put(`/api/transfers/${id}/reject`)
      loadData()
    } catch (err) {
      setError('Gagal menolak transfer')
    }
  }

  if (loading) return <div className="loading">Memuat transfer...</div>

  const filteredTransfers = tab === 'pending'
    ? transfers.filter(t => t.status === 'PENDING')
    : tab === 'completed'
    ? transfers.filter(t => t.status === 'COMPLETED')
    : transfers

  const statusConfig = {
    PENDING: { label: 'Menunggu', icon: Clock, color: '#FFA726', bgColor: 'rgba(255, 167, 38, 0.1)' },
    APPROVED: { label: 'Disetujui', icon: Check, color: '#66BB6A', bgColor: 'rgba(102, 187, 106, 0.1)' },
    COMPLETED: { label: 'Selesai', icon: CheckCircle, color: '#29B6F6', bgColor: 'rgba(41, 182, 246, 0.1)' },
    REJECTED: { label: 'Ditolak', icon: XCircle, color: '#EF5350', bgColor: 'rgba(239, 83, 80, 0.1)' }
  }

  return (
    <div className="list-page">
      <BackButton to="/keuangan" label="Keuangan" />

      <div className="page-header">
        <h1>Transfer Dana</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 120, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Menunggu</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{transfers.filter(t => t.status === 'PENDING').length}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Selesai</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{transfers.filter(t => t.status === 'COMPLETED').length}</div>
        </div>
      </div>

      <button className="btn-pill" onClick={handleOpenCreate} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Transfer Baru
      </button>

      {/* Tabs */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, borderBottom: '1px solid #e0e0e0' }}>
        <button
          onClick={() => setTab('all')}
          style={{
            padding: '12px 16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: tab === 'all' ? '#333' : '#999',
            borderBottom: tab === 'all' ? '2px solid #333' : 'none',
            fontWeight: tab === 'all' ? 600 : 400
          }}
        >
          Semua ({transfers.length})
        </button>
        <button
          onClick={() => setTab('pending')}
          style={{
            padding: '12px 16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: tab === 'pending' ? '#333' : '#999',
            borderBottom: tab === 'pending' ? '2px solid #333' : 'none',
            fontWeight: tab === 'pending' ? 600 : 400
          }}
        >
          Menunggu ({transfers.filter(t => t.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setTab('completed')}
          style={{
            padding: '12px 16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: tab === 'completed' ? '#333' : '#999',
            borderBottom: tab === 'completed' ? '2px solid #333' : 'none',
            fontWeight: tab === 'completed' ? 600 : 400
          }}
        >
          Selesai ({transfers.filter(t => t.status === 'COMPLETED').length})
        </button>
      </div>

      {/* Transfer List */}
      <div className="card">
        <h2 className="section-title">Daftar Transfer</h2>
        {filteredTransfers.length > 0 ? (
          <div>
            {filteredTransfers.map(transfer => {
              const config = statusConfig[transfer.status]
              const StatusIcon = config.icon
              return (
                <div key={transfer.id} className="list-row" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: config.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <StatusIcon size={22} color={config.color} />
                  </div>
                  <div className="list-row-body" style={{ flex: 1, marginLeft: 8 }}>
                    <div className="list-row-title">
                      {transfer.fromWallet.name} → {transfer.toWallet.name}
                    </div>
                    <div className="list-row-subtitle">
                      {config.label} • {new Date(transfer.createdAt).toLocaleDateString('id-ID')}
                      {transfer.note && ` • ${transfer.note}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="list-row-amount positive">Rp {transfer.amount.toLocaleString('id-ID')}</div>
                  </div>
                  {transfer.status === 'PENDING' && (
                    <div style={{ marginLeft: 8, display: 'flex', gap: 4 }}>
                      <button
                        className="icon-btn"
                        onClick={() => handleApprove(transfer.id)}
                        title="Setujui"
                        style={{ color: '#66BB6A' }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleReject(transfer.id)}
                        title="Tolak"
                        style={{ color: '#EF5350' }}
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Send size={28} className="empty-state-icon" />
            <p>Belum ada transfer</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transfer Baru</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Dari Wallet *</label>
                <select
                  required
                  value={form.fromWalletId}
                  onChange={e => setForm({ ...form, fromWalletId: e.target.value })}
                >
                  <option value="">Pilih wallet</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ke Wallet *</label>
                <select
                  required
                  value={form.toWalletId}
                  onChange={e => setForm({ ...form, toWalletId: e.target.value })}
                >
                  <option value="">Pilih wallet</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Jumlah (Rp) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="1000000"
                />
              </div>

              <div className="form-group">
                <label>Catatan</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="Alasan transfer (opsional)"
                  rows={2}
                  style={{ fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" className="btn-pill" disabled={saving}>
                {saving ? 'Memproses...' : 'Transfer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransferPage
