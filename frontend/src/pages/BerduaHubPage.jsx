import React from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, BookHeart, ChevronRight } from 'lucide-react'
import './ListPages.css'

const items = [
  { path: '/conversation-cards', label: 'Conversation Cards', desc: 'Kartu obrolan seru untuk pasangan', icon: MessageCircle, sw: 'sw-5' },
  { path: '/journal', label: 'Jurnal Keluarga', desc: 'Catatan & kenangan harian bersama', icon: BookHeart, sw: 'sw-3' },
]

const BerduaHubPage = () => {
  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Berdua</h1>
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

export default BerduaHubPage
