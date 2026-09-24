import React from 'react'
import { Link } from 'react-router-dom'
import { Wrench, Link2, Settings, ChevronRight, MoreHorizontal, HelpCircle } from 'lucide-react'
import './HubPage.css'

const items = [
  { path: '/maintenance', label: 'Maintenance', desc: 'Jadwal perawatan rumah & kendaraan', icon: Wrench },
  { path: '/links', label: 'Link Penting', desc: 'Simpan tautan penting keluarga', icon: Link2 },
  { path: '/help-faq', label: 'Bantuan & FAQ', desc: 'Panduan, setting awal, & pertanyaan umum', icon: HelpCircle },
  { path: '/settings', label: 'Pengaturan', desc: 'Profil, keamanan, & preferensi aplikasi', icon: Settings },
]

const LainnyaHubPage = () => {
  return (
    <div className="hub-page">
      <div className="page-header">
        <h1>Lainnya</h1>
        <p>Fitur tambahan & pengaturan aplikasi</p>
      </div>

      <div className="hub-summary">
        <div className="summary-item">
          <MoreHorizontal size={20} color="#6b7280" />
          <span>Kelola Aplikasi</span>
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

export default LainnyaHubPage
