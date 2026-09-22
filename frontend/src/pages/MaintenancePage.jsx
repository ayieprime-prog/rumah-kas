import React from 'react'
import { Wrench } from 'lucide-react'
import './ListPages.css'

const MaintenancePage = () => {
  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Maintenance</h1>
      </div>
      <div className="coming-soon">
        <div className="icon-square sw-3"><Wrench size={24} /></div>
        <p>Segera hadir</p>
        <span>Pengingat servis kendaraan & perawatan rumah akan tampil di sini</span>
      </div>
    </div>
  )
}

export default MaintenancePage
