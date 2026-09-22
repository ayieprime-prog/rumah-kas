import React from 'react'
import { BookHeart } from 'lucide-react'
import './ListPages.css'

const JournalPage = () => {
  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Jurnal Keluarga</h1>
      </div>
      <div className="coming-soon">
        <div className="icon-square sw-3"><BookHeart size={24} /></div>
        <p>Segera hadir</p>
        <span>Catatan & kenangan harian keluarga akan tampil di sini</span>
      </div>
    </div>
  )
}

export default JournalPage
