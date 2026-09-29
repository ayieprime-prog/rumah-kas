import React from 'react'
import { Plus } from 'lucide-react'

const MOCK_AGENDA = [
  { id: 1, title: 'Ganti oli mobil', completed: true, time: 'Jadwal Maintenance' },
  { id: 2, title: 'Rapat keluarga', completed: false, time: '14:00 - 15:00' },
]

const AgendaSection = ({ onAddClick }) => {
  return (
    <div className="agenda-section">
      <div className="agenda-header">
        <h2>Agenda Hari ini</h2>
        <div className="agenda-header-right">
          <span className="agenda-count">{MOCK_AGENDA.filter(a => a.completed).length}/{MOCK_AGENDA.length} selesai</span>
          <button className="agenda-add-btn" onClick={onAddClick} aria-label="Tambah agenda">
            <Plus size={20} />
          </button>
        </div>
      </div>
      <div className="agenda-items">
        {MOCK_AGENDA.map(item => (
          <div key={item.id} className={`agenda-item ${item.completed ? 'completed' : ''}`}>
            <div className="agenda-checkbox">
              <input type="checkbox" defaultChecked={item.completed} />
            </div>
            <div className="agenda-content">
              <span className="agenda-title">{item.title}</span>
              <span className="agenda-time">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AgendaSection
