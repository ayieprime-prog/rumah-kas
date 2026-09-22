import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Trash2, ChevronLeft, ChevronRight, CalendarDays, School, Stethoscope, PartyPopper, Sparkles } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const CATEGORIES = [
  { value: 'Sekolah', icon: School, sw: 'sw-2' },
  { value: 'Dokter', icon: Stethoscope, sw: 'sw-5' },
  { value: 'Acara Keluarga', icon: PartyPopper, sw: 'sw-3' },
  { value: 'Lainnya', icon: Sparkles, sw: 'sw-6' },
]

const monthLabel = (month) => {
  const [y, m] = month.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

const shiftMonth = (month, delta) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const dateLabel = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })

const CalendarPage = () => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', startDate: new Date().toISOString().slice(0, 10), category: 'Acara Keluarga', description: '' })

  useEffect(() => { loadData() }, [month])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/events', { params: { month } })
      setEvents(res.data || [])
    } catch (err) {
      setError('Gagal memuat kalender')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post('/api/events', form)
      setShowModal(false)
      setForm({ title: '', startDate: new Date().toISOString().slice(0, 10), category: 'Acara Keluarga', description: '' })
      loadData()
    } catch (err) {
      setError('Gagal menyimpan acara')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/events/${id}`)
      loadData()
    } catch (err) {
      setError('Gagal menghapus acara')
    }
  }

  // Group events by date
  const grouped = events.reduce((acc, ev) => {
    const key = ev.startDate.slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(ev)
    return acc
  }, {})
  const dateKeys = Object.keys(grouped).sort()

  return (
    <div className="list-page">
      <BackButton to="/" label="Beranda" />

      <div className="page-header">
        <h1>Kalender</h1>
      </div>

      <div className="month-nav">
        <button onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft size={18} /></button>
        <span className="month-label">{monthLabel(month)}</span>
        <button onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight size={18} /></button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn-pill" onClick={() => setShowModal(true)} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tambah Acara
      </button>

      {loading ? (
        <div className="loading">Memuat acara...</div>
      ) : dateKeys.length > 0 ? (
        dateKeys.map(dateKey => (
          <div key={dateKey} className="card">
            <h2 className="section-title">{dateLabel(dateKey)}</h2>
            {grouped[dateKey].map(ev => {
              const catInfo = CATEGORIES.find(c => c.value === ev.category) || CATEGORIES[3]
              const CatIcon = catInfo.icon
              return (
                <div key={ev.id} className="list-row">
                  <div className={`icon-square ${catInfo.sw}`} style={{ width: 36, height: 36 }}>
                    <CatIcon size={16} />
                  </div>
                  <div className="list-row-body">
                    <div className="list-row-title">{ev.title}</div>
                    <div className="list-row-subtitle">{ev.category}{ev.description ? ` · ${ev.description}` : ''}</div>
                  </div>
                  <button className="icon-btn" onClick={() => handleDelete(ev.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        ))
      ) : (
        <div className="empty-state">
          <CalendarDays size={28} className="empty-state-icon" />
          <p>Belum ada acara bulan ini</p>
          <span>Tambahkan jadwal sekolah, dokter, atau acara keluarga</span>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Acara</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Judul</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Rapat orang tua murid" />
              </div>
              <div className="form-group">
                <label>Tanggal</label>
                <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Catatan (opsional)</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Bawa buku rapor" />
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

export default CalendarPage
