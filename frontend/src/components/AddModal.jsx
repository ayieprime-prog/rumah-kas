import React, { useState } from 'react'

const AddModal = ({ isOpen, onClose, today }) => {
  const [activeTab, setActiveTab] = useState('todo')

  if (!isOpen) return null

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

        {/* Todo Tab Content */}
        {activeTab === 'todo' && (
          <div className="modal-form">
            <div className="form-group">
              <label>Pilih Kategori</label>
              <select>
                <option>Pilih kategori...</option>
                <option>Jadwal Bayar & Belanja</option>
                <option>Acara Keluarga</option>
                <option>Maintenance</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nama Task</label>
              <input type="text" placeholder="Masukkan nama task" />
            </div>
            <div className="form-group">
              <label>Ingatkan saya</label>
              <div className="reminder-options">
                <button className="reminder-btn">Hari ini</button>
                <button className="reminder-btn">H-1</button>
                <button className="reminder-btn">H-3</button>
                <button className="reminder-btn">Custom...</button>
              </div>
            </div>
            <div className="form-group">
              <label>Jam berapa?</label>
              <input type="time" defaultValue="08:00" />
            </div>
            <button className="modal-submit">Simpan agenda</button>
          </div>
        )}

        {/* Keuangan Tab Content */}
        {activeTab === 'keuangan' && (
          <div className="modal-form">
            <div className="form-group">
              <label>Tipe</label>
              <div className="type-options">
                <button className="type-btn">Pemasukan</button>
                <button className="type-btn active">Pengeluaran</button>
              </div>
            </div>
            <div className="form-group">
              <label>Kategori</label>
              <select>
                <option>Pilih kategori...</option>
                <option>Makanan & Minuman</option>
                <option>Transportasi</option>
                <option>Utilitas</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nominal</label>
              <input type="number" placeholder="Rp 0" />
            </div>
            <button className="modal-submit">Simpan transaksi</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddModal
