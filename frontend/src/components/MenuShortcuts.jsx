import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, Calendar, Wrench, BookOpen, BarChart3, MoreHorizontal, HelpCircle } from 'lucide-react'

const MENU_SHORTCUTS = [
  { label: 'Keuangan', icon: Wallet, path: '/keuangan', bg: '#c9a961', color: '#ffffff' },
  { label: 'Kalender', icon: Calendar, path: '/kalender', bg: '#4a7c8c', color: '#ffffff' },
  { label: 'Maintenance', icon: Wrench, path: '/maintenance', bg: '#b8956a', color: '#ffffff' },
  { label: 'Conversation', icon: BookOpen, path: '/berdua', bg: '#a85a7a', color: '#ffffff' },
  { label: 'Jurnal Keluarga', icon: BookOpen, path: '/journal', bg: '#a85a7a', color: '#ffffff' },
  { label: 'Laporan', icon: BarChart3, path: '/reports', bg: '#5b6fa0', color: '#ffffff' },
  { label: 'Bantuan & FAQ', icon: HelpCircle, path: '/help-faq', bg: '#c1784f', color: '#ffffff' },
  { label: 'Lainnya', icon: MoreHorizontal, path: '/lainnya', bg: '#5a9a6a', color: '#ffffff' },
]

const MenuShortcuts = () => {
  const navigate = useNavigate()

  return (
    <div className="menu-shortcuts">
      {MENU_SHORTCUTS.map(menu => {
        const IconComp = menu.icon
        return (
          <button
            key={menu.path}
            className="shortcut-item"
            style={{ backgroundColor: menu.bg }}
            onClick={() => navigate(menu.path)}
            aria-label={menu.label}
          >
            <span className="shortcut-icon-badge">
              <IconComp size={20} color={menu.color} />
            </span>
            <span className="shortcut-label">{menu.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default MenuShortcuts
