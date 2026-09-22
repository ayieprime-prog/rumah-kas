import React from 'react'
import { Calendar } from 'lucide-react'
import './ListPages.css'

const CalendarPage = () => {
  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Kalender</h1>
      </div>
      <div className="coming-soon">
        <div className="icon-square sw-2"><Calendar size={24} /></div>
        <p>Segera hadir</p>
        <span>Jadwal & acara keluarga akan tampil di sini</span>
      </div>
    </div>
  )
}

export default CalendarPage
