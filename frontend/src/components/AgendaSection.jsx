import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus } from 'lucide-react'

const todayStr = () => new Date().toISOString().slice(0, 10)

const formatTime = (dueDate) => new Date(dueDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

const AgendaSection = ({ onAddClick }) => {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTodos()
    window.addEventListener('dashboard-refresh', loadTodos)
    return () => window.removeEventListener('dashboard-refresh', loadTodos)
  }, [])

  const loadTodos = async () => {
    try {
      const res = await axios.get('/api/todos', { params: { date: todayStr() } })
      setTodos(res.data || [])
    } catch (err) {
      console.error('Gagal memuat agenda:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (todo) => {
    // Optimistic update so the checkbox feels instant, reverted on failure
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t))
    try {
      await axios.put(`/api/todos/${todo.id}`, { completed: !todo.completed })
    } catch (err) {
      console.error('Gagal mengubah status agenda:', err)
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: todo.completed } : t))
    }
  }

  const completedCount = todos.filter(t => t.completed).length

  return (
    <div className="agenda-section">
      <div className="agenda-header">
        <h2>Agenda Hari ini</h2>
        <div className="agenda-header-right">
          <span className="agenda-count">{completedCount}/{todos.length} selesai</span>
          <button className="agenda-add-btn" onClick={onAddClick} aria-label="Tambah agenda">
            <Plus size={20} />
          </button>
        </div>
      </div>
      <div className="agenda-items">
        {loading ? (
          <div className="agenda-empty">Memuat agenda...</div>
        ) : todos.length > 0 ? (
          todos.map(item => (
            <div key={item.id} className={`agenda-item ${item.completed ? 'completed' : ''}`}>
              <div className="agenda-checkbox">
                <input type="checkbox" checked={item.completed} onChange={() => handleToggle(item)} />
              </div>
              <div className="agenda-content">
                <span className="agenda-title">{item.title}</span>
                <span className="agenda-time">{item.category || formatTime(item.dueDate)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="agenda-empty">Belum ada agenda hari ini</div>
        )}
      </div>
    </div>
  )
}

export default AgendaSection
