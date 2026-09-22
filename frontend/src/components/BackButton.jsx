import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import './BackButton.css'

const BackButton = ({ to = -1, label = 'Kembali' }) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (typeof to === 'number') {
      navigate(to)
    } else {
      navigate(to)
    }
  }

  return (
    <button className="back-button" onClick={handleBack} title={label}>
      <ChevronLeft size={20} />
      <span>{label}</span>
    </button>
  )
}

export default BackButton
