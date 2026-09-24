import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Bell, Check, Trash2 } from 'lucide-react'
import './NotificationBell.css'

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/notifications')
      setNotifications(res.data)
    } catch (err) {
      // Notifikasi bukan fitur inti -- gagal diam-diam, jangan ganggu dashboard
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    try {
      await axios.put(`/api/notifications/${id}/read`)
    } catch (err) {
      loadNotifications()
    }
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await axios.put('/api/notifications/mark-all-read')
    } catch (err) {
      loadNotifications()
    }
  }

  const removeNotification = async (id, e) => {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await axios.delete(`/api/notifications/${id}`)
    } catch (err) {
      loadNotifications()
    }
  }

  return (
    <div className="notif-bell-wrapper" ref={wrapperRef}>
      <button className="notif-bell-btn" onClick={() => setOpen(o => !o)} aria-label="Notifikasi">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifikasi</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                <Check size={13} /> Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="notif-dropdown-list">
            {loading && notifications.length === 0 && (
              <div className="notif-empty">Memuat...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="notif-empty">Belum ada notifikasi</div>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                className={`notif-item ${n.read ? '' : 'unread'}`}
                onClick={() => !n.read && markAsRead(n.id)}
              >
                {!n.read && <span className="notif-dot" />}
                <div className="notif-item-body">
                  <div className="notif-item-message">{n.message}</div>
                  <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                </div>
                <button className="notif-delete" onClick={(e) => removeNotification(n.id, e)} aria-label="Hapus">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
