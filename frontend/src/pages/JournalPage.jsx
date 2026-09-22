import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, X, Trash2, BookHeart } from 'lucide-react'
import './ListPages.css'

const MOODS = ['😊', '😄', '😌', '😴', '😔', '😤', '🥰', '😅']

const JournalPage = () => {
  const token = localStorage.getItem('token')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ content: '', mood: MOODS[0], entryDate: new Date().toISOString().slice(0, 10) })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/journal', { headers: { Authorization: `Bearer ${token}` } })
      setEntries(res.data.entries || [])
    } catch (err) {
      setError('Gagal memuat jurnal keluarga')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post('/api/journal', form, { headers: { Authorization: `Bearer ${token}` } })
      setShowModal(false)
      setForm({ content: '', mood: MOODS[0], entryDate: new Date().toISOString().slice(0, 10) })
      loadData()
    } catch (err) {
      setError('Gagal menyimpan catatan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/journal/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      loadData()
    } catch (err) {
      setError('Gagal menghapus catatan')
    }
  }

  if (loading) return <div className="loading">Memuat jurnal keluarga...</div>

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Jurnal Keluarga</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn-pill" onClick={() => setShowModal(true)} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tulis Catatan
      </button>

      {entries.length > 0 ? (
        entries.map(entry => (
          <div key={entry.id} className="card journal-entry">
            <div className="journal-entry-header">
              <div className="icon-square sw-3" style={{ width: 36, height: 36, fontSize: 18 }}>
                {entry.mood || '📝'}
              </div>
              <div className="journal-entry-meta">
                <div className="journal-entry-author">{entry.author?.name}</div>
                <div className="journal-entry-date">{new Date(entry.entryDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <button className="icon-btn" onClick={() => handleDelete(entry.id)}>
                <Trash2 size={16} />
              </button>
            </div>
            <p className="journal-entry-content">{entry.content}</p>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <BookHeart size={28} className="empty-state-icon" />
          <p>Belum ada catatan jurnal</p>
          <span>Tulis kenangan atau momen hari ini bersama keluarga</span>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tulis Catatan</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Mood</label>
                <div className="mood-picker">
                  {MOODS.map(m => (
                    <button
                      type="button"
                      key={m}
                      className={`mood-option ${form.mood === m ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, mood: m })}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Tanggal</label>
                <input required type="date" value={form.entryDate} onChange={e => setForm({ ...form, entryDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Catatan</label>
                <textarea required rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Hari ini kita..." />
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

export default JournalPage
