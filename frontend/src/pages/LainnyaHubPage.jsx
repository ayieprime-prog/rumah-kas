import React from 'react'
import { Link } from 'react-router-dom'
import { Wrench, Link2, Settings, ChevronRight } from 'lucide-react'
import './ListPages.css'

const items = [
  { path: '/maintenance', label: 'Maintenance', desc: 'Jadwal perawatan rumah & kendaraan', icon: Wrench, sw: 'sw-4' },
  { path: '/links', label: 'Link Penting', desc: 'Simpan tautan penting keluarga', icon: Link2, sw: 'sw-3' },
  { path: '/settings', label: 'Pengaturan', desc: 'Profil, keamanan, & preferensi aplikasi', icon: Settings, sw: 'sw-5' },
]

const LainnyaHubPage = () => {
  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Lainnya</h1>
      </div>

      <div className="hub-list">
        {items.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.path} to={item.path} className="hub-item">
              <div className={`icon-square ${item.sw}`}>
                <Icon size={20} />
              </div>
              <div className="hub-item-body">
                <div className="hub-item-title">{item.label}</div>
                <div className="hub-item-desc">{item.desc}</div>
              </div>
              <ChevronRight size={18} className="hub-item-chevron" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default LainnyaHubPage
