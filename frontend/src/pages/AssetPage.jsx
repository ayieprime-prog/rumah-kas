import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Trash2, Edit2, Home, Car, Gem, TrendingUp, PieChart, DollarSign } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const ASSET_TYPES = {
  REAL_ESTATE: { label: 'Real Estate', icon: '🏠', color: '#FF6B6B' },
  VEHICLE: { label: 'Kendaraan', icon: '🚗', color: '#4ECDC4' },
  JEWELRY: { label: 'Perhiasan', icon: '💎', color: '#FFE66D' },
  ART: { label: 'Seni', icon: '🖼️', color: '#95E1D3' },
  CRYPTOCURRENCY: { label: 'Cryptocurrency', icon: '₿', color: '#FF7675' },
  CASH_ALTERNATIVE: { label: 'Investasi', icon: '📊', color: '#6C63FF' },
  OTHER: { label: 'Lainnya', icon: '📦', color: '#A0AEC0' }
}

const AssetPage = () => {
  const [assets, setAssets] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('ALL')

  const [form, setForm] = useState({
    name: '',
    type: 'REAL_ESTATE',
    description: '',
    currentValue: '',
    purchasePrice: '',
    purchaseDate: '',
    location: '',
    notes: ''
  })

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/assets')
      setPortfolio(res.data)
      setAssets(res.data.assets || [])
    } catch (err) {
      setError('Gagal memuat aset')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredAssets = filterType === 'ALL'
    ? assets
    : assets.filter(a => a.type === filterType)

  const handleOpenCreate = () => {
    setEditingId(null)
    setForm({
      name: '',
      type: 'REAL_ESTATE',
      description: '',
      currentValue: '',
      purchasePrice: '',
      purchaseDate: '',
      location: '',
      notes: ''
    })
    setShowModal(true)
  }

  const handleOpenEdit = (asset) => {
    setEditingId(asset.id)
    setForm({
      name: asset.name,
      type: asset.type,
      description: asset.description || '',
      currentValue: asset.currentValue.toString(),
      purchasePrice: asset.purchasePrice ? asset.purchasePrice.toString() : '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      location: asset.location || '',
      notes: asset.notes || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const submitData = {
        ...form,
        currentValue: parseFloat(form.currentValue),
        ...(form.purchasePrice && { purchasePrice: parseFloat(form.purchasePrice) })
      }

      if (editingId) {
        await axios.put(`/api/assets/${editingId}`, submitData)
      } else {
        await axios.post('/api/assets', submitData)
      }

      setShowModal(false)
      loadAssets()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan aset')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus aset ini?')) return

    try {
      await axios.delete(`/api/assets/${id}`)
      loadAssets()
    } catch (err) {
      setError('Gagal menghapus aset')
    }
  }

  if (loading) return <div className="loading">Memuat aset...</div>

  const totalValue = portfolio?.summary?.totalValue || 0

  return (
    <div className="list-page">
      <BackButton to="/keuangan" label="Keuangan" />

      <div className="page-header">
        <h1>Portfolio Aset</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Portfolio Summary */}
      <div style={{ marginBottom: 24 }}>
        <div className="card-hero" style={{ marginBottom: 16 }}>
          <div className="hero-label">Total Nilai Aset</div>
          <div className="hero-value">Rp {totalValue.toLocaleString('id-ID')}</div>
        </div>

        {portfolio?.summary?.byType && (
          <div className="category-grid" style={{ marginBottom: 20 }}>
            {portfolio.summary.byType.slice(0, 4).map(item => (
              <div key={item.type} className="category-card" style={{ cursor: 'pointer' }} onClick={() => setFilterType(item.type)}>
                <div className="icon-square" style={{ background: ASSET_TYPES[item.type]?.color || '#ccc' }}>
                  <span style={{ fontSize: 20 }}>{ASSET_TYPES[item.type]?.icon || '📦'}</span>
                </div>
                <div className="category-name">{ASSET_TYPES[item.type]?.label}</div>
                <div className="category-amount">{item.count} aset</div>
                <div className="category-amount" style={{ fontSize: 12, opacity: 0.8 }}>
                  Rp {item.value.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="btn-pill" onClick={handleOpenCreate} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tambah Aset
      </button>

      {/* Filter */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className={`btn-pill ${filterType === 'ALL' ? '' : 'btn-secondary'}`}
          onClick={() => setFilterType('ALL')}
          style={{ fontSize: 12, padding: '6px 12px' }}
        >
          Semua ({assets.length})
        </button>
        {Object.entries(ASSET_TYPES).slice(0, 5).map(([type, info]) => {
          const count = assets.filter(a => a.type === type).length
          return (
            <button
              key={type}
              className={`btn-pill ${filterType === type ? '' : 'btn-secondary'}`}
              onClick={() => setFilterType(type)}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              {info.icon} {count}
            </button>
          )
        })}
      </div>

      {/* Asset List */}
      <div className="card">
        <h2 className="section-title">Daftar Aset</h2>
        {filteredAssets.length > 0 ? (
          <div>
            {filteredAssets.map(asset => (
              <div key={asset.id} className="list-row">
                <div className="icon-square" style={{ background: ASSET_TYPES[asset.type]?.color || '#ccc', width: 36, height: 36 }}>
                  <span style={{ fontSize: 18 }}>{ASSET_TYPES[asset.type]?.icon || '📦'}</span>
                </div>
                <div className="list-row-body" style={{ flex: 1 }}>
                  <div className="list-row-title">{asset.name}</div>
                  <div className="list-row-subtitle">
                    {ASSET_TYPES[asset.type]?.label}
                    {asset.purchaseDate && ` • Dibeli ${new Date(asset.purchaseDate).toLocaleDateString('id-ID')}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 8 }}>
                  <div className="list-row-amount positive">Rp {asset.currentValue.toLocaleString('id-ID')}</div>
                  {asset.purchasePrice && (
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      Dari: Rp {asset.purchasePrice.toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
                <button className="icon-btn" onClick={() => handleOpenEdit(asset)}>
                  <Edit2 size={16} />
                </button>
                <button className="icon-btn" onClick={() => handleDelete(asset.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Gem size={28} className="empty-state-icon" />
            <p>Belum ada aset</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Ubah Aset' : 'Tambah Aset'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Nama Aset *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Rumah di Bekasi"
                />
              </div>

              <div className="form-group">
                <label>Tipe Aset *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(ASSET_TYPES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Spesifikasi atau catatan tentang aset"
                  rows={3}
                  style={{ fontFamily: 'inherit' }}
                />
              </div>

              <div className="form-group">
                <label>Nilai Saat Ini (Rp) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.currentValue}
                  onChange={e => setForm({ ...form, currentValue: e.target.value })}
                  placeholder="1000000000"
                />
              </div>

              <div className="form-group">
                <label>Harga Beli (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={e => setForm({ ...form, purchasePrice: e.target.value })}
                  placeholder="950000000"
                />
              </div>

              <div className="form-group">
                <label>Tanggal Pembelian</label>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Lokasi (untuk Real Estate)</label>
                <input
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="Jl. Merdeka No. 123, Bekasi"
                />
              </div>

              <div className="form-group">
                <label>Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Catatan tambahan"
                  rows={2}
                  style={{ fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" className="btn-pill" disabled={saving}>
                {saving ? 'Menyimpan...' : editingId ? 'Ubah' : 'Simpan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetPage
