import React, { useState } from 'react'
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'

const FinancialSummarySection = ({
  overview,
  goals,
  incomeLocks,
  walletSummary,
  debtSummary,
  portfolio,
  showBalance,
  onToggleBalance,
  selectedWalletFilter,
  onWalletFilterChange,
  selectedPosFilter,
  onPosFilterChange
}) => {
  const [showKekayaanDetail, setShowKekayaanDetail] = useState(false)

  const totalGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalLocked = incomeLocks?.totalRemaining || 0
  const uangBebas = overview.balance - totalGoals - totalLocked

  const totalSaldoWallet = walletSummary?.totalBalance || 0
  const totalNilaiAset = portfolio?.summary?.totalValue || 0
  const totalUtang = debtSummary?.totalDebt || 0
  const totalHarta = totalSaldoWallet + totalNilaiAset
  const kekayaanBersih = totalHarta - totalUtang

  const formatRp = (value) => showBalance ? `Rp ${value.toLocaleString('id-ID')}` : '••••••••'

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
          {formatRp(kekayaanBersih)}
        </div>
        <div className="kekayaan-detail">
          Harta {formatRp(totalHarta)} – Utang {formatRp(totalUtang)}
        </div>
        <button
          className="kekayaan-detail-btn"
          onClick={() => setShowKekayaanDetail(!showKekayaanDetail)}
          aria-expanded={showKekayaanDetail}
        >
          {showKekayaanDetail ? 'Sembunyikan rincian' : 'Lihat rincian'}
          {showKekayaanDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showKekayaanDetail && (
          <div className="kekayaan-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Saldo Wallet</span>
              <span className="breakdown-amount">{formatRp(totalSaldoWallet)}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Nilai Aset</span>
              <span className="breakdown-amount">{formatRp(totalNilaiAset)}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Total Utang</span>
              <span className="breakdown-amount">{formatRp(totalUtang)}</span>
            </div>
          </div>
        )}
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
