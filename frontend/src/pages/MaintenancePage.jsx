import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Trash2, Wrench, Car, Home, CheckCircle2 } from 'lucide-react'
import './ListPages.css'

const TYPES = [
  { value: 'VEHICLE', label: 'Kendaraan', icon: Car },
  { value: 'HOME', label: 'Rumah', icon: Home },
]

const daysUntil = (dateStr) => {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

const statusOf = (item) => {
  const days = daysUntil(item.nextDueDate)
  if (days === null) return { label: 'Belum ada jadwal', tone: 'muted' }
  if (days < 0) return { label: `Telat ${Math.abs(days)} hari`, tone: 'danger' }
  if (days <= 14) return { label: `${days} hari lagi`, tone: 'warning' }
  return { label: `${days} hari lagi`, tone: 'ok' }
}

const MaintenancePage = () => {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [logFor, setLogFor] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ name: '', type: 'VEHICLE', intervalDays: '', notes: '' })
  const [logForm, setLogForm] = useState({ serviceDate: new Date().toISOString().slice(0, 10), cost: '', notes: '', recordAsExpense: false, categoryId: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [itemsRes, householdRes] = await Promise.all([
        axios.get('/api/maintenance'),
        axios.get('/api/household')
      ])
      setItems(itemsRes.data || [])
      setCategories(householdRes.data.categories || [])
    } catch (err) {
      setError('Gagal memuat data maintenance')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post('/api/maintenance', form)
      setShowAddModal(false)
      setForm({ name: '', type: 'VEHICLE', intervalDays: '', notes: '' })
      loadData()
    } catch (err) {
      setError('Gagal menyimpan item maintenance')
    } finally {
      setSaving(false)
    }
  }

  const handleLog = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post(`/api/maintenance/${logFor.id}/log`, logForm)
      setLogFor(null)
      setLogForm({ serviceDate: new Date().toISOString().slice(0, 10), cost: '', notes: '', recordAsExpense: false, categoryId: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mencatat servis')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/maintenance/${id}`)
      loadData()
    } catch (err) {
      setError('Gagal menghapus item')
    }
  }

  if (loading) return <div className="loading">Memuat data maintenance...</div>

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Maintenance</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn-pill" onClick={() => setShowAddModal(true)} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tambah Item
      </button>

      {items.length > 0 ? (
        <div className="card">
          {items.map(item => {
            const TypeIcon = TYPES.find(t => t.value === item.type)?.icon || Wrench
            const status = statusOf(item)
            const lastLog = item.logs?.[0]
            return (
              <div key={item.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                <div className="icon-square sw-3" style={{ width: 36, height: 36 }}>
                  <TypeIcon size={16} />
                </div>
                <div className="list-row-body">
                  <div className="list-row-title">{item.name}</div>
                  <div className={`maint-status maint-status-${status.tone}`}>{status.label}</div>
                  {lastLog && (
                    <div className="list-row-subtitle">
                      Servis terakhir: {new Date(lastLog.serviceDate).toLocaleDateString('id-ID')}
                      {lastLog.cost ? ` · Rp ${lastLog.cost.toLocaleString('id-ID')}` : ''}
                    </div>
                  )}
                  <button className="btn-dashed" style={{ marginTop: 10 }} onClick={() => setLogFor(item)}>
                    <CheckCircle2 size={16} /> Catat Servis
                  </button>
                </div>
                <button className="icon-btn" onClick={() => handleDelete(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Wrench size={28} className="empty-state-icon" />
          <p>Belum ada item maintenance</p>
          <span>Tambahkan kendaraan atau perangkat rumah untuk dipantau jadwal servisnya</span>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Item Maintenance</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} className="auth-form">
              <div className="form-group">
                <label>Nama</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mobil Avanza" />
              </div>
              <div className="form-group">
                <label>Jenis</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Interval Servis (hari, opsional)</label>
                <input type="number" min="1" value={form.intervalDays} onChange={e => setForm({ ...form, intervalDays: e.target.value })} placeholder="90" />
              </div>
              <div className="form-group">
                <label>Catatan (opsional)</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ganti oli tiap 3 bulan" />
              </div>
              <button type="submit" className="btn-pill" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {logFor && (
        <div className="modal-overlay" onClick={() => setLogFor(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Catat Servis: {logFor.name}</h2>
              <button className="modal-close" onClick={() => setLogFor(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleLog} className="auth-form">
              <div className="form-group">
                <label>Tanggal Servis</label>
                <input required type="date" value={logForm.serviceDate} onChange={e => setLogForm({ ...logForm, serviceDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Biaya (Rp, opsional)</label>
                <input type="number" min="0" value={logForm.cost} onChange={e => setLogForm({ ...logForm, cost: e.target.value })} placeholder="150000" />
              </div>
              <div className="form-group">
                <label>Catatan (opsional)</label>
                <input value={logForm.notes} onChange={e => setLogForm({ ...logForm, notes: e.target.value })} placeholder="Ganti oli & filter" />
              </div>
              {logForm.cost && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={logForm.recordAsExpense}
                      onChange={e => setLogForm({ ...logForm, recordAsExpense: e.target.checked })}
                    />
                    Catat juga sebagai pengeluaran
                  </label>
                </div>
              )}
              {logForm.recordAsExpense && (
                <div className="form-group">
                  <label>Kategori Pengeluaran</label>
                  <select required value={logForm.categoryId} onChange={e => setLogForm({ ...logForm, categoryId: e.target.value })}>
                    <option value="">Pilih kategori</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" className="btn-pill" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Catatan Servis'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaintenancePage
