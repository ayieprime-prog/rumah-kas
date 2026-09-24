import React from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, BookHeart, ChevronRight, Heart } from 'lucide-react'
import './HubPage.css'

const items = [
  { path: '/conversation-cards', label: 'Conversation Cards', desc: 'Kartu obrolan seru untuk pasangan', icon: MessageCircle },
  { path: '/journal', label: 'Jurnal Keluarga', desc: 'Catatan & kenangan harian bersama', icon: BookHeart },
]

const BerduaHubPage = () => {
  return (
    <div className="hub-page">
      <div className="page-header">
        <h1>Berdua</h1>
        <p>Hubungan & aktivitas bersama pasangan</p>
      </div>

      <div className="hub-summary">
        <div className="summary-item">
          <Heart size={20} color="#c55a82" />
          <span>Hubungan Harmonis</span>
        </div>
      </div>

      <div className="menu-grid">
        {items.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.path} to={item.path} className="menu-card">
              <div className="card-icon">
                <Icon size={24} />
              </div>
              <div className="card-body">
                <div className="card-title">{item.label}</div>
                <div className="card-desc">{item.desc}</div>
              </div>
              <ChevronRight size={18} className="card-chevron" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default BerduaHubPage
