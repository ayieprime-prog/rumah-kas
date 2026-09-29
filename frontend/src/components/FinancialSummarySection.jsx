import React from 'react'
import { Eye, EyeOff } from 'lucide-react'

const FinancialSummarySection = ({
  overview,
  goals,
  incomeLocks,
  showBalance,
  onToggleBalance,
  selectedWalletFilter,
  onWalletFilterChange,
  selectedPosFilter,
  onPosFilterChange
}) => {
  const totalGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalLocked = incomeLocks?.totalRemaining || 0
  const uangBebas = overview.balance - totalGoals - totalLocked

  return (
    <div className="financial-summary-section">
      {/* Wallet Filter */}
      <div className="filter-group">
        <label className="filter-label">Semua Wallet</label>
        <div className="filter-buttons">
          <button className={`filter-btn ${selectedWalletFilter === 'semua' ? 'active' : ''}`} onClick={() => onWalletFilterChange('semua')}>Semua Wallet</button>
          <button className={`filter-btn ${selectedWalletFilter === 'tunai' ? 'active' : ''}`} onClick={() => onWalletFilterChange('tunai')}>Tunai</button>
          <button className={`filter-btn ${selectedWalletFilter === 'bank' ? 'active' : ''}`} onClick={() => onWalletFilterChange('bank')}>Bank</button>
          <button className={`filter-btn ${selectedWalletFilter === 'digital' ? 'active' : ''}`} onClick={() => onWalletFilterChange('digital')}>Dompet Digital</button>
        </div>
      </div>

      {/* Pos Filter */}
      <div className="filter-group">
        <label className="filter-label">Semua Pos</label>
        <div className="filter-buttons">
          <button className={`filter-btn ${selectedPosFilter === 'semua' ? 'active' : ''}`} onClick={() => onPosFilterChange('semua')}>Keluarga</button>
          <button className={`filter-btn ${selectedPosFilter === 'pribadi' ? 'active' : ''}`} onClick={() => onPosFilterChange('pribadi')}>Pribadi Andri</button>
        </div>
      </div>

      {/* Kekayaan Bersih Card */}
      <div className="kekayaan-bersih-card">
        <div className="card-top">
          <h3>Kekayaan Bersih Keluarga</h3>
          <button className="eye-btn" onClick={onToggleBalance}>
            {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        <div className="kekayaan-value">
          {showBalance ? `Rp ${overview.balance.toLocaleString('id-ID')}` : '••••••••'}
        </div>
        <div className="kekayaan-detail">
          Harta Rp {showBalance ? overview.balance.toLocaleString('id-ID') : '••••••••'} – Utang Rp 0
        </div>
        <button className="kekayaan-detail-btn">Lihat rincian →</button>
      </div>

      {/* Saldo Aktif Detail */}
      <div className="saldo-aktif-detail-card">
        <div className="card-header-detail">
          <h3>Saldo Aktif</h3>
          <button className="eye-btn" onClick={onToggleBalance}>
            {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        <div className="saldo-aktif-value">
          {showBalance ? `Rp ${Math.max(0, uangBebas).toLocaleString('id-ID')}` : '••••••••'}
        </div>
        <div className="saldo-aktif-description">
          Akumulasi dari awal, gak reset tiap bulan • di luar dana Tabungan/Goal
        </div>
        <div className="saldo-aktif-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-label">Andri (demo)</span>
            <span className="breakdown-amount">Rp 100.000</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Anita (demo)</span>
            <span className="breakdown-amount">Rp 120.000</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinancialSummarySection
