import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, Edit2, Tag } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const COLOR_OPTIONS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#FF6B9D', '#95E1D3',
  '#A8E6CF', '#FFB6B9', '#FEC8D8', '#C7CEEA', '#B0E0E6'
]

const CategoriesPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', icon: 'folder', color: COLOR_OPTIONS[0] })

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/categories')
      setCategories(res.data || [])
    } catch (err) {
      setError('Gagal memuat daftar kategori')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        await axios.put(`/api/categories/${editingId}`, form)
      } else {
        await axios.post('/api/categories', form)
      }
      setShowModal(false)
      setEditingId(null)
      setForm({ name: '', icon: 'folder', color: COLOR_OPTIONS[0] })
      loadCategories()
    } catch (err) {
      setError(err.response?.data?.error || (editingId ? 'Gagal mengubah kategori' : 'Gagal membuat kategori'))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category) => {
    setEditingId(category.id)
    setForm({ name: category.name, icon: category.icon, color: category.color })
    setError('')
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini?')) return
    try {
      await axios.delete(`/api/categories/${id}`)
      loadCategories()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menghapus kategori')
    }
  }

  const handleOpenModal = () => {
    setEditingId(null)
    setForm({ name: '', icon: 'folder', color: COLOR_OPTIONS[0] })
    setError('')
    setShowModal(true)
  }

  if (loading) return <div className="loading">Memuat kategori...</div>

  return (
    <div className="list-page">
      <BackButton to="/keuangan" label="Keuangan" />

      <div className="page-header">
        <h1>Kategori Pengeluaran</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn-pill" onClick={handleOpenModal} style={{ marginBottom: 20 }}>
        <Plus size={18} /> Tambah Kategori
      </button>

      {categories.length > 0 ? (
        <div className="card">
          {categories.map(category => (
            <div key={category.id} className="list-row" style={{ alignItems: 'center' }}>
              <div className="icon-square" style={{ width: 36, height: 36, background: category.color }}>
                <Tag size={16} />
              </div>
              <div className="list-row-body" style={{ flex: 1 }}>
                <div className="list-row-title">{category.name}</div>
              </div>
              <button className="icon-btn" onClick={() => handleEdit(category)} aria-label="Edit kategori">
                <Edit2 size={16} />
              </button>
              <button className="icon-btn" onClick={() => handleDelete(category.id)} aria-label="Hapus kategori">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Tag size={28} className="empty-state-icon" />
          <p>Belum ada kategori</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Nama Kategori</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Langganan"
                />
              </div>
              <div className="form-group">
                <label>Warna</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLOR_OPTIONS.map(color => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setForm({ ...form, color })}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: color,
                        border: form.color === color ? '3px solid var(--text-color, #1f2937)' : '2px solid transparent',
                        cursor: 'pointer'
                      }}
                      aria-label={`Pilih warna ${color}`}
                    />
                  ))}
                </div>
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

export default CategoriesPage
