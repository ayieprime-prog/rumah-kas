import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, Edit2, Wallet, CreditCard, Smartphone } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const WALLET_TYPES = [
  { value: 'CASH', label: 'Tunai', icon: '💵' },
  { value: 'BANK_ACCOUNT', label: 'Rekening Bank', icon: '🏦' },
  { value: 'DIGITAL_WALLET', label: 'Dompet Digital', icon: '📱' }
]

const WalletPage = () => {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'CASH', balance: 0 })

  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/wallets')
      setWallets(res.data || [])
    } catch (err) {
      setError('Gagal memuat daftar wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await axios.put(`/api/wallets/${editingId}`, form)
      } else {
        await axios.post('/api/wallets', form)
      }
      setShowModal(false)
      setEditingId(null)
      setForm({ name: '', type: 'CASH', balance: 0 })
      loadWallets()
    } catch (err) {
      setError(editingId ? 'Gagal mengubah wallet' : 'Gagal membuat wallet')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (wallet) => {
    setEditingId(wallet.id)
    setForm({ name: wallet.name, type: wallet.type, balance: wallet.balance })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus wallet ini?')) return
    try {
      await axios.delete(`/api/wallets/${id}`)
      loadWallets()
    } catch (err) {
      setError('Gagal menghapus wallet')
    }
  }

  const handleOpenModal = () => {
    setEditingId(null)
    setForm({ name: '', type: 'CASH', balance: 0 })
    setShowModal(true)
  }

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0)

  if (loading) return <div className="loading">Memuat wallet...</div>

  return (
    <div className="list-page">
      <BackButton to="/keuangan" label="Keuangan" />

      <div className="page-header">
        <h1>Kelola Wallet</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Total Balance Card */}
      <div className="card-hero" style={{ marginBottom: 16 }}>
        <div className="hero-label">Total Saldo Semua Wallet</div>
        <div className="hero-value">Rp {totalBalance.toLocaleString('id-ID')}</div>
      </div>

      <button className="btn-pill" onClick={handleOpenModal} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tambah Wallet
      </button>

      {wallets.length > 0 ? (
        <div className="card">
          {wallets.map((wallet) => {
            const typeInfo = WALLET_TYPES.find(t => t.value === wallet.type)
            return (
              <div key={wallet.id} className="list-row" style={{ alignItems: 'center' }}>
                <div className="list-row-body" style={{ flex: 1 }}>
                  <div className="list-row-title">{typeInfo?.icon || '💳'} {wallet.name}</div>
                  <div className="list-row-subtitle">{typeInfo?.label}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>
                    Rp {(wallet.balance || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <button className="icon-btn" onClick={() => handleEdit(wallet)} title="Edit">
                  <Edit2 size={16} />
                </button>
                <button className="icon-btn" onClick={() => handleDelete(wallet.id)} title="Hapus">
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Wallet size={28} className="empty-state-icon" />
          <p>Belum ada wallet</p>
          <span>Buat wallet untuk mengorganisir keuangan Anda</span>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Wallet' : 'Tambah Wallet'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Nama Wallet</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Tunai, BCA, Dompet Digital"
                />
              </div>
              <div className="form-group">
                <label>Tipe Wallet</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {WALLET_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Saldo Awal</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.balance}
                  onChange={e => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
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

export default WalletPage
