import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Trash2, Link2, ExternalLink } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const CATEGORIES = ['Dokumen Legal', 'Asuransi', 'Sertifikat', 'Lainnya']
const SWATCHES = ['sw-1', 'sw-2', 'sw-3', 'sw-4', 'sw-5', 'sw-6']

const LinksPage = () => {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', url: '', category: CATEGORIES[0], notes: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/links')
      setLinks(res.data || [])
    } catch (err) {
      setError('Gagal memuat link penting')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post('/api/links', form)
      setShowModal(false)
      setForm({ title: '', url: '', category: CATEGORIES[0], notes: '' })
      loadData()
    } catch (err) {
      setError('Gagal menyimpan link')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/links/${id}`)
      loadData()
    } catch (err) {
      setError('Gagal menghapus link')
    }
  }

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: links.filter(l => (l.category || CATEGORIES[0]) === cat)
  })).filter(g => g.items.length > 0)

  if (loading) return <div className="loading">Memuat link penting...</div>

  return (
    <div className="list-page">
      <BackButton to="/" label="Beranda" />

      <div className="page-header">
        <h1>Link Penting</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn-pill" onClick={() => setShowModal(true)} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tambah Link
      </button>

      {grouped.length > 0 ? (
        grouped.map(group => (
          <div key={group.category} className="card">
            <h2 className="section-title">{group.category}</h2>
            {group.items.map((link, i) => (
              <div key={link.id} className="list-row">
                <div className={`icon-square ${SWATCHES[i % SWATCHES.length]}`} style={{ width: 36, height: 36 }}>
                  <Link2 size={16} />
                </div>
                <div className="list-row-body">
                  <div className="list-row-title">{link.title}</div>
                  {link.notes && <div className="list-row-subtitle">{link.notes}</div>}
                </div>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="icon-btn" style={{ color: 'var(--accent-color)' }}>
                  <ExternalLink size={16} />
                </a>
                <button className="icon-btn" onClick={() => handleDelete(link.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="empty-state">
          <Link2 size={28} className="empty-state-icon" />
          <p>Belum ada link penting</p>
          <span>Simpan link dokumen keluarga seperti KK, akta, atau polis asuransi</span>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Link</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Judul</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Kartu Keluarga" />
              </div>
              <div className="form-group">
                <label>URL</label>
                <input required type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://drive.google.com/..." />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Catatan (opsional)</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Berlaku sampai 2030" />
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

export default LinksPage
