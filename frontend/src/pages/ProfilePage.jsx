import React, { useState, useRef } from 'react'
import axios from 'axios'
import { Image as ImageIcon, Trash2, MapPin, Search, LocateFixed } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const MAX_DIMENSION = 1280

// Resize/compress the picked image client-side before it's sent as a base64
// data URI, so a phone photo doesn't turn into a multi-MB request body.
const resizeImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = reject
  reader.onload = () => {
    const img = new window.Image()
    img.onerror = reject
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = reader.result
  }
  reader.readAsDataURL(file)
})

const ProfilePage = ({ user, onUserUpdate }) => {
  const [wallpaper, setWallpaper] = useState(user?.wallpaper || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  const [city, setCity] = useState(user?.city || null)
  const [locating, setLocating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [locationSaving, setLocationSaving] = useState(false)

  const handlePickFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const dataUri = await resizeImage(file)
      setWallpaper(dataUri)
    } catch (err) {
      setError('Gagal memproses gambar')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await axios.put('/api/auth/me', { wallpaper })
      onUserUpdate?.(res.data.user)
      setSuccess('Wallpaper tersimpan')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan wallpaper')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setWallpaper(null)
    setSaving(true)
    try {
      const res = await axios.put('/api/auth/me', { wallpaper: null })
      onUserUpdate?.(res.data.user)
    } catch (err) {
      setError('Gagal menghapus wallpaper')
    } finally {
      setSaving(false)
    }
  }

  const saveLocation = async (cityName, lat, lon) => {
    setLocationSaving(true)
    setError('')
    try {
      const res = await axios.put('/api/auth/me', { city: cityName, weatherLat: lat, weatherLon: lon })
      onUserUpdate?.(res.data.user)
      setCity(cityName)
      setSearchResults([])
      setSearchQuery('')
      setSuccess('Lokasi tersimpan')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Gagal menyimpan lokasi')
    } finally {
      setLocationSaving(false)
    }
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Perangkat ini tidak mendukung deteksi lokasi')
      return
    }
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`)
          const data = await res.json()
          const detectedCity = data.city || data.locality || data.principalSubdivision || 'Lokasi Saya'
          await saveLocation(detectedCity, latitude, longitude)
        } catch (err) {
          setError('Gagal mendeteksi nama kota')
        } finally {
          setLocating(false)
        }
      },
      () => {
        setError('Izin lokasi ditolak. Coba cari nama kota secara manual di bawah.')
        setLocating(false)
      },
      { timeout: 8000 }
    )
  }

  const handleSearchCity = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setError('')
    setSearchResults([])
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=id&format=json`)
      const data = await res.json()
      if (!data.results?.length) {
        setError('Kota tidak ditemukan, coba nama lain')
      }
      setSearchResults(data.results || [])
    } catch (err) {
      setError('Gagal mencari kota')
    } finally {
      setSearching(false)
    }
  }

  const handleRemoveLocation = async () => {
    setLocationSaving(true)
    try {
      const res = await axios.put('/api/auth/me', { city: null, weatherLat: null, weatherLon: null })
      onUserUpdate?.(res.data.user)
      setCity(null)
    } catch (err) {
      setError('Gagal menghapus lokasi')
    } finally {
      setLocationSaving(false)
    }
  }

  return (
    <div className="list-page">
      <BackButton to="/" label="Beranda" />

      <div className="page-header">
        <h1>Profil</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h2 className="section-title">Akun</h2>
        <div className="list-row">
          <div className="icon-square sw-6" style={{ width: 40, height: 40 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="list-row-body">
            <div className="list-row-title">{user?.name}</div>
            <div className="list-row-subtitle">{user?.email} · {user?.role}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Wallpaper Dashboard</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -4, marginBottom: 12 }}>
          Pilih foto favorit sebagai latar bar sambutan di halaman Beranda.
        </p>

        {wallpaper ? (
          <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12, aspectRatio: '16/9' }}>
            <img src={wallpaper} alt="Wallpaper" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div className="empty-state" style={{ marginBottom: 12 }}>
            <ImageIcon size={28} className="empty-state-icon" />
            <p>Belum ada wallpaper</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handlePickFile}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-pill" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon size={18} /> Pilih Foto
          </button>
          {wallpaper && (
            <button className="icon-btn" onClick={handleRemove} title="Hapus wallpaper">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {wallpaper && (
          <button className="btn-pill" onClick={handleSave} disabled={saving} style={{ marginTop: 12 }}>
            {saving ? 'Menyimpan...' : 'Simpan Wallpaper'}
          </button>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Lokasi &amp; Cuaca</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -4, marginBottom: 12 }}>
          Menentukan nama kota dan cuaca yang tampil di bar sambutan Beranda.
        </p>

        {city ? (
          <div className="list-row">
            <div className="icon-square sw-4" style={{ width: 36, height: 36 }}>
              <MapPin size={16} />
            </div>
            <div className="list-row-body" style={{ flex: 1 }}>
              <div className="list-row-title">{city}</div>
              <div className="list-row-subtitle">Lokasi tersimpan</div>
            </div>
            <button className="icon-btn" onClick={handleRemoveLocation} disabled={locationSaving} title="Hapus lokasi">
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <div className="empty-state" style={{ marginBottom: 12 }}>
            <MapPin size={28} className="empty-state-icon" />
            <p>Belum ada lokasi tersimpan</p>
            <span>Dashboard akan minta izin GPS tiap kali dibuka sampai lokasi disimpan di sini</span>
          </div>
        )}

        <button className="btn-pill" onClick={handleDetectLocation} disabled={locating || locationSaving} style={{ marginBottom: 16 }}>
          <LocateFixed size={18} /> {locating ? 'Mendeteksi...' : 'Deteksi Lokasi Otomatis'}
        </button>

        <form onSubmit={handleSearchCity} className="auth-form" style={{ marginBottom: 0 }}>
          <div className="form-group">
            <label>Atau cari nama kota manual</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Contoh: Surabaya"
                style={{ flex: 1 }}
              />
              <button type="submit" className="icon-btn" disabled={searching} title="Cari">
                <Search size={18} />
              </button>
            </div>
          </div>
        </form>

        {searchResults.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {searchResults.map((r, idx) => (
              <div key={idx} className="list-row" style={{ cursor: 'pointer' }} onClick={() => saveLocation(r.name, r.latitude, r.longitude)}>
                <div className="list-row-body" style={{ flex: 1 }}>
                  <div className="list-row-title">{r.name}</div>
                  <div className="list-row-subtitle">{[r.admin1, r.country].filter(Boolean).join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
