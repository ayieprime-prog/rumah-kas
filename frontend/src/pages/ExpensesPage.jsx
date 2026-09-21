import React, { useState, useEffect } from 'react'
import apiClient from '../utils/api'
import { Edit2, Trash2, Plus } from 'lucide-react'
import './ExpensesPage.css'

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchExpenses()
    fetchCategories()
  }, [selectedMonth])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/expenses', {
        params: { month: selectedMonth, limit: 100 }
      })
      setExpenses(response.data.expenses)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengambil pengeluaran')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/household')
      setCategories(response.data.categories || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.description || !formData.amount || !formData.categoryId) {
      setError('Semua field harus diisi')
      return
    }

    try {
      if (editingId) {
        await apiClient.put(`/expenses/${editingId}`, formData)
      } else {
        await apiClient.post('/expenses', formData)
      }

      setFormData({
        description: '',
        amount: '',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
      })
      setEditingId(null)
      setShowForm(false)
      fetchExpenses()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan pengeluaran')
    }
  }

  const handleEdit = (expense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount,
      categoryId: expense.categoryId,
      date: expense.date.split('T')[0],
    })
    setEditingId(expense.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin hapus pengeluaran ini?')) return

    try {
      await apiClient.delete(`/expenses/${id}`)
      fetchExpenses()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menghapus pengeluaran')
    }
  }

  const getCategoryName = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown'
  }

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <div className="expenses-page">
      <div className="page-header">
        <h1>📊 Pengeluaran</h1>
        <button className="btn-primary" onClick={() => {
          setShowForm(!showForm)
          setEditingId(null)
          setFormData({
            description: '',
            amount: '',
            categoryId: '',
            date: new Date().toISOString().split('T')[0],
          })
        }}>
          <Plus size={20} /> Tambah Pengeluaran
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="month-selector">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="month-input"
        />
      </div>

      {showForm && (
        <div className="form-card">
          <h2>{editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Deskripsi</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Contoh: Makan di restoran"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Jumlah</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="50000"
                  step="1000"
                  required
                />
              </div>

              <div className="form-group">
                <label>Kategori</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Tanggal</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Simpan Perubahan' : 'Tambah Pengeluaran'}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="summary-card">
        <div className="summary-item">
          <span>Total Pengeluaran {selectedMonth}</span>
          <span className="amount">Rp {totalExpense.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {loading && <div className="loading">Memuat pengeluaran...</div>}

      {!loading && expenses.length === 0 && (
        <div className="empty-state">
          <p>Belum ada pengeluaran bulan ini</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            Tambah Pengeluaran Pertama
          </button>
        </div>
      )}

      {!loading && expenses.length > 0 && (
        <div className="expenses-list">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Deskripsi</th>
                <th>Kategori</th>
                <th>Jumlah</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id}>
                  <td>{new Date(expense.date).toLocaleDateString('id-ID')}</td>
                  <td>{expense.description}</td>
                  <td>
                    <span className="category-badge">
                      {getCategoryName(expense.categoryId)}
                    </span>
                  </td>
                  <td className="amount">Rp {expense.amount.toLocaleString('id-ID')}</td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(expense)}
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDelete(expense.id)}
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ExpensesPage
