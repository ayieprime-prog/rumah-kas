import React, { useState, useEffect } from 'react'
import apiClient from '../utils/api'
import { Edit2, Trash2, Plus } from 'lucide-react'
import './IncomePages.css'

const IncomePages = () => {
  const [incomes, setIncomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchIncomes()
  }, [selectedMonth])

  const fetchIncomes = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/income', {
        params: { month: selectedMonth, limit: 100 }
      })
      setIncomes(response.data.incomes)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengambil pemasukan')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.source || !formData.amount) {
      setError('Semua field harus diisi')
      return
    }

    try {
      if (editingId) {
        await apiClient.put(`/income/${editingId}`, formData)
      } else {
        await apiClient.post('/income', formData)
      }

      setFormData({
        source: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
      })
      setEditingId(null)
      setShowForm(false)
      fetchIncomes()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan pemasukan')
    }
  }

  const handleEdit = (income) => {
    setFormData({
      source: income.source,
      amount: income.amount,
      date: income.date.split('T')[0],
    })
    setEditingId(income.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin hapus pemasukan ini?')) return

    try {
      await apiClient.delete(`/income/${id}`)
      fetchIncomes()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menghapus pemasukan')
    }
  }

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0)

  return (
    <div className="income-page">
      <div className="page-header">
        <h1>💰 Pemasukan</h1>
        <button className="btn-primary" onClick={() => {
          setShowForm(!showForm)
          setEditingId(null)
          setFormData({
            source: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
          })
        }}>
          <Plus size={20} /> Tambah Pemasukan
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
          <h2>{editingId ? 'Edit Pemasukan' : 'Tambah Pemasukan Baru'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Sumber Pemasukan</label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="Contoh: Gaji, Bonus, Passive Income"
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
                  placeholder="5000000"
                  step="1000"
                  required
                />
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
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Simpan Perubahan' : 'Tambah Pemasukan'}
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

      <div className="summary-card income-summary">
        <div className="summary-item">
          <span>Total Pemasukan {selectedMonth}</span>
          <span className="amount">Rp {totalIncome.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {loading && <div className="loading">Memuat pemasukan...</div>}

      {!loading && incomes.length === 0 && (
        <div className="empty-state">
          <p>Belum ada pemasukan bulan ini</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            Tambah Pemasukan Pertama
          </button>
        </div>
      )}

      {!loading && incomes.length > 0 && (
        <div className="incomes-list">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Sumber</th>
                <th>Jumlah</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map(income => (
                <tr key={income.id}>
                  <td>{new Date(income.date).toLocaleDateString('id-ID')}</td>
                  <td>{income.source}</td>
                  <td className="amount">Rp {income.amount.toLocaleString('id-ID')}</td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(income)}
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDelete(income.id)}
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

export default IncomePages
