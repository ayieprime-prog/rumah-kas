import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { ChevronDown, ChevronUp, X, TrendingUp, Wallet2, AlertCircle } from 'lucide-react'
import BackButton from '../components/BackButton'
import './ListPages.css'

const NeracaPage = () => {
  const [neraca, setNeraca] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedAssetClass, setExpandedAssetClass] = useState(null)
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadNeraca()
  }, [])

  const loadNeraca = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/neraca')
      setNeraca(res.data)
      setError('')
    } catch (err) {
      setError('Gagal memuat neraca keluarga')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Memuat Neraca Keluarga...</div>
  if (!neraca) return <div className="loading">Data tidak tersedia</div>

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getAssetClassIcon = (assetClass) => {
    const icons = {
      LIQUID: '💰',
      INVESTMENT: '📈',
      RECEIVABLE: '📋',
      DEBT: '⚠️'
    }
    return icons[assetClass] || '💼'
  }

  const toggleAssetClass = (assetClass) => {
    setExpandedAssetClass(expandedAssetClass === assetClass ? null : assetClass)
  }

  const openWalletDetail = (wallet) => {
    setSelectedWallet(wallet)
    setShowModal(true)
  }

  return (
    <div className="list-page">
      <BackButton to="/keuangan" label="Keuangan" />

      <div className="page-header">
        <h1>Neraca Keluarga</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Hero Summary Card */}
      <div className="neraca-hero">
        <div className="neraca-hero-date">
          <small>Per {new Date(neraca.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</small>
        </div>

        <div className="neraca-hero-label">Kekayaan Bersih</div>
        <div className="neraca-hero-amount">{formatCurrency(neraca.totalWealth)}</div>

        <div className="neraca-hero-breakdown">
          <div className="neraca-hero-item">
            <div className="neraca-hero-item-label">Harta</div>
            <div className="neraca-hero-item-value">{formatCurrency(neraca.totalAssets)}</div>
          </div>
          <div className="neraca-hero-divider">−</div>
          <div className="neraca-hero-item">
            <div className="neraca-hero-item-label">Utang</div>
            <div className="neraca-hero-item-value">{formatCurrency(neraca.totalLiabilities)}</div>
          </div>
        </div>
      </div>

      {/* Assets Section */}
      {neraca.assets && neraca.assets.length > 0 && (
        <div className="neraca-section">
          <div className="neraca-section-title">
            <TrendingUp size={20} />
            <span>Harta (Assets)</span>
          </div>

          {neraca.assets.map((assetGroup) => (
            <div key={assetGroup.assetClass} className="neraca-asset-class">
              <div
                className="neraca-asset-class-header"
                onClick={() => toggleAssetClass(assetGroup.assetClass)}
              >
                <div className="neraca-asset-class-info">
                  <span className="neraca-asset-class-icon">
                    {getAssetClassIcon(assetGroup.assetClass)}
                  </span>
                  <div className="neraca-asset-class-text">
                    <div className="neraca-asset-class-label">{assetGroup.label}</div>
                    <small>{assetGroup.walletCount} wallet</small>
                  </div>
                </div>

                <div className="neraca-asset-class-amount">
                  <strong>{formatCurrency(assetGroup.total)}</strong>
                  {expandedAssetClass === assetGroup.assetClass ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </div>
              </div>

              {expandedAssetClass === assetGroup.assetClass && (
                <div className="neraca-wallets-list">
                  {assetGroup.wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="neraca-wallet-item"
                      onClick={() => openWalletDetail(wallet)}
                    >
                      <div className="neraca-wallet-info">
                        <div className="neraca-wallet-icon">{wallet.icon || '🏦'}</div>
                        <div className="neraca-wallet-text">
                          <div className="neraca-wallet-name">{wallet.name}</div>
                          <small className="neraca-wallet-type">{wallet.type}</small>
                        </div>
                      </div>
                      <div className="neraca-wallet-balance">
                        {formatCurrency(wallet.balance)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Liabilities Section */}
      {neraca.liabilities && neraca.liabilities.length > 0 && (
        <div className="neraca-section">
          <div className="neraca-section-title">
            <AlertCircle size={20} />
            <span>Utang (Liabilities)</span>
          </div>

          {neraca.liabilities.map((liabilityGroup) => (
            <div key={liabilityGroup.assetClass} className="neraca-asset-class">
              <div
                className="neraca-asset-class-header"
                onClick={() => toggleAssetClass(liabilityGroup.assetClass)}
              >
                <div className="neraca-asset-class-info">
                  <span className="neraca-asset-class-icon">
                    {getAssetClassIcon(liabilityGroup.assetClass)}
                  </span>
                  <div className="neraca-asset-class-text">
                    <div className="neraca-asset-class-label">{liabilityGroup.label}</div>
                    <small>{liabilityGroup.walletCount} item</small>
                  </div>
                </div>

                <div className="neraca-asset-class-amount">
                  <strong>{formatCurrency(liabilityGroup.total)}</strong>
                  {expandedAssetClass === liabilityGroup.assetClass ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </div>
              </div>

              {expandedAssetClass === liabilityGroup.assetClass && (
                <div className="neraca-wallets-list">
                  {liabilityGroup.wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="neraca-wallet-item"
                      onClick={() => openWalletDetail(wallet)}
                    >
                      <div className="neraca-wallet-info">
                        <div className="neraca-wallet-icon">{wallet.icon || '📌'}</div>
                        <div className="neraca-wallet-text">
                          <div className="neraca-wallet-name">{wallet.name}</div>
                          <small className="neraca-wallet-type">{wallet.type}</small>
                        </div>
                      </div>
                      <div className="neraca-wallet-balance">
                        {formatCurrency(wallet.balance)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Equity Section */}
      {neraca.equity && neraca.equity.length > 0 && (
        <div className="neraca-section">
          <div className="neraca-section-title">
            <Wallet2 size={20} />
            <span>Ekuitas (Equity)</span>
          </div>

          {neraca.equity.map((equityGroup) => (
            <div key={equityGroup.assetClass} className="neraca-asset-class">
              <div
                className="neraca-asset-class-header"
                onClick={() => toggleAssetClass(equityGroup.assetClass)}
              >
                <div className="neraca-asset-class-info">
                  <span className="neraca-asset-class-icon">
                    {getAssetClassIcon(equityGroup.assetClass)}
                  </span>
                  <div className="neraca-asset-class-text">
                    <div className="neraca-asset-class-label">{equityGroup.label}</div>
                    <small>{equityGroup.walletCount} item</small>
                  </div>
                </div>

                <div className="neraca-asset-class-amount">
                  <strong>{formatCurrency(equityGroup.total)}</strong>
                  {expandedAssetClass === equityGroup.assetClass ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </div>
              </div>

              {expandedAssetClass === equityGroup.assetClass && (
                <div className="neraca-wallets-list">
                  {equityGroup.wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="neraca-wallet-item"
                      onClick={() => openWalletDetail(wallet)}
                    >
                      <div className="neraca-wallet-info">
                        <div className="neraca-wallet-icon">{wallet.icon || '📊'}</div>
                        <div className="neraca-wallet-text">
                          <div className="neraca-wallet-name">{wallet.name}</div>
                          <small className="neraca-wallet-type">{wallet.type}</small>
                        </div>
                      </div>
                      <div className="neraca-wallet-balance">
                        {formatCurrency(wallet.balance)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Wallet Detail Modal */}
      {showModal && selectedWallet && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Wallet</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="neraca-modal-content">
              <div className="neraca-modal-item">
                <span className="neraca-modal-label">Nama</span>
                <span className="neraca-modal-value">{selectedWallet.name}</span>
              </div>
              <div className="neraca-modal-item">
                <span className="neraca-modal-label">Jenis</span>
                <span className="neraca-modal-value">{selectedWallet.type}</span>
              </div>
              <div className="neraca-modal-item">
                <span className="neraca-modal-label">Saldo</span>
                <span className="neraca-modal-value">
                  <strong>{formatCurrency(selectedWallet.balance)}</strong>
                </span>
              </div>
              <div className="neraca-modal-item">
                <span className="neraca-modal-label">Scope</span>
                <span className="neraca-modal-value">{selectedWallet.scope}</span>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                className="btn-pill"
                onClick={() => setShowModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NeracaPage
