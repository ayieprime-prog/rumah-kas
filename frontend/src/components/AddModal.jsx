import React, { useState, useEffect } from 'react'
import axios from 'axios'

const REMINDER_OPTIONS = ['Hari ini', 'H-1', 'H-3', 'Custom...']
const TODO_CATEGORIES = ['Jadwal Bayar & Belanja', 'Acara Keluarga', 'Maintenance']

const emptyTodoForm = { category: '', title: '', reminderOption: 'Hari ini', time: '08:00' }
const emptyKeuanganForm = { type: 'expense', categoryId: '', source: '', amount: '' }

const AddModal = ({ isOpen, onClose, today }) => {
  const [activeTab, setActiveTab] = useState('todo')
  const [todoForm, setTodoForm] = useState(emptyTodoForm)
  const [keuanganForm, setKeuanganForm] = useState(emptyKeuanganForm)
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeTab === 'keuangan' && categories.length === 0) {
      axios.get('/api/categories')
        .then(res => setCategories(res.data || []))
        .catch(err => console.error('Gagal memuat kategori:', err))
    }
  }, [activeTab])

  if (!isOpen) return null

  const resetAndClose = () => {
    setTodoForm(emptyTodoForm)
    setKeuanganForm(emptyKeuanganForm)
    setError('')
    onClose()
    window.dispatchEvent(new Event('dashboard-refresh'))
  }

  const handleTodoSubmit = async (e) => {
    e.preventDefault()
    if (!todoForm.title) return
    setError('')
    setSaving(true)
    try {
      const [hours, minutes] = todoForm.time.split(':').map(Number)
      const dueDate = new Date()
      dueDate.setHours(hours, minutes, 0, 0)
      await axios.post('/api/todos', {
        title: todoForm.title,
        category: todoForm.category || null,
        dueDate: dueDate.toISOString(),
        reminderOption: todoForm.reminderOption
      })
      resetAndClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan agenda')
    } finally {
      setSaving(false)
    }
  }

  const handleKeuanganSubmit = async (e) => {
    e.preventDefault()
    const amount = parseFloat(keuanganForm.amount)
    if (!amount || amount <= 0) return
    if (keuanganForm.type === 'expense' && !keuanganForm.categoryId) return
    if (keuanganForm.type === 'income' && !keuanganForm.source) return

    setError('')
    setSaving(true)
    try {
      const now = new Date().toISOString()
      if (keuanganForm.type === 'expense') {
        const category = categories.find(c => c.id === keuanganForm.categoryId)
        await axios.post('/api/expenses', {
          description: category?.name || 'Pengeluaran',
          amount,
          categoryId: keuanganForm.categoryId,
          date: now
        })
      } else {
        await axios.post('/api/income', {
          source: keuanganForm.source,
          amount,
          date: now
        })
      }
      resetAndClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan transaksi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{today}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Tutup modal">×</button>
        </div>

        {/* Tab Toggle */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'todo' ? 'active' : ''}`}
            onClick={() => setActiveTab('todo')}
          >
            Todo
          </button>
          <button
            className={`modal-tab ${activeTab === 'keuangan' ? 'active' : ''}`}
            onClick={() => setActiveTab('keuangan')}
          >
            Keuangan
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Todo Tab Content */}
        {activeTab === 'todo' && (
          <form className="modal-form" onSubmit={handleTodoSubmit}>
            <div className="form-group">
              <label>Pilih Kategori</label>
              <select value={todoForm.category} onChange={e => setTodoForm({ ...todoForm, category: e.target.value })}>
                <option value="">Pilih kategori...</option>
                {TODO_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Nama Task</label>
              <input
                type="text"
                required
                placeholder="Masukkan nama task"
                value={todoForm.title}
                onChange={e => setTodoForm({ ...todoForm, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Ingatkan saya</label>
              <div className="reminder-options">
                {REMINDER_OPTIONS.map(option => (
                  <button
                    type="button"
                    key={option}
                    className={`reminder-btn ${todoForm.reminderOption === option ? 'active' : ''}`}
                    onClick={() => setTodoForm({ ...todoForm, reminderOption: option })}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Jam berapa?</label>
              <input
                type="time"
                value={todoForm.time}
                onChange={e => setTodoForm({ ...todoForm, time: e.target.value })}
              />
            </div>
            <button type="submit" className="modal-submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan agenda'}
            </button>
          </form>
        )}

        {/* Keuangan Tab Content */}
        {activeTab === 'keuangan' && (
          <form className="modal-form" onSubmit={handleKeuanganSubmit}>
            <div className="form-group">
              <label>Tipe</label>
              <div className="type-options">
                <button
                  type="button"
                  className={`type-btn ${keuanganForm.type === 'income' ? 'active' : ''}`}
                  onClick={() => setKeuanganForm({ ...keuanganForm, type: 'income' })}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  className={`type-btn ${keuanganForm.type === 'expense' ? 'active' : ''}`}
                  onClick={() => setKeuanganForm({ ...keuanganForm, type: 'expense' })}
                >
                  Pengeluaran
                </button>
              </div>
            </div>
            {keuanganForm.type === 'expense' ? (
              <div className="form-group">
                <label>Kategori</label>
                <select
                  required
                  value={keuanganForm.categoryId}
                  onChange={e => setKeuanganForm({ ...keuanganForm, categoryId: e.target.value })}
                >
                  <option value="">Pilih kategori...</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Sumber</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gaji"
                  value={keuanganForm.source}
                  onChange={e => setKeuanganForm({ ...keuanganForm, source: e.target.value })}
                />
              </div>
            )}
            <div className="form-group">
              <label>Nominal</label>
              <input
                type="number"
                required
                min="0"
                placeholder="Rp 0"
                value={keuanganForm.amount}
                onChange={e => setKeuanganForm({ ...keuanganForm, amount: e.target.value })}
              />
            </div>
            <button type="submit" className="modal-submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan transaksi'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default AddModal
