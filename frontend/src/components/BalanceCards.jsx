import React from 'react'
import { Eye, EyeOff } from 'lucide-react'

const BalanceCards = ({ overview, goals, incomeLocks, showBalance, onToggleBalance }) => {
  const totalGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalLocked = incomeLocks?.totalRemaining || 0
  const uangBebas = overview.balance - totalGoals - totalLocked

  return (
    <div className="balance-cards">
      <div className="balance-card saldo-aktif">
        <div className="card-header">
          <span className="card-label">Saldo Aktif</span>
          <button className="eye-btn" onClick={onToggleBalance} aria-label="Toggle saldo aktif visibility">
            {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
        <div className="card-value">
          {showBalance ? `Rp ${overview.balance.toLocaleString('id-ID')}` : '••••••••'}
        </div>
      </div>

      <div className="balance-card uang-bebas">
        <div className="card-header">
          <span className="card-label">Uang Bebas</span>
          <button className="eye-btn" onClick={onToggleBalance} aria-label="Toggle uang bebas visibility">
            {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
        <div className="card-value">
          {showBalance ? `Rp ${Math.max(0, uangBebas).toLocaleString('id-ID')}` : '••••••••'}
        </div>
      </div>
    </div>
  )
}

export default BalanceCards
