import React from 'react'
import { Wallet, CreditCard, Banknote, Smartphone } from 'lucide-react'

const WALLET_ICONS = {
  Banknote: Banknote,
  CreditCard: CreditCard,
  Smartphone: Smartphone,
  wallet: Wallet
}

const WalletTabs = ({ wallets, selectedWalletId, onWalletSelect }) => {
  if (!wallets || wallets.length === 0) return null

  return (
    <div className="wallet-tabs">
      {wallets.map(wallet => {
        const IconComp = WALLET_ICONS[wallet.icon] || Wallet
        return (
          <button
            key={wallet.id}
            className={`wallet-tab ${selectedWalletId === wallet.id ? 'active' : ''}`}
            onClick={() => onWalletSelect(wallet.id)}
            aria-label={`Pilih ${wallet.name}`}
          >
            <IconComp size={16} />
            <div className="wallet-info">
              <div className="wallet-name">{wallet.name}</div>
              <div className="wallet-balance">Rp {wallet.balance.toLocaleString('id-ID')}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default WalletTabs
