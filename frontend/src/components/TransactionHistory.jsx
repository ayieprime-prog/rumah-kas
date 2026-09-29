import React from 'react'
import { useNavigate } from 'react-router-dom'

const MOCK_TRANSACTIONS = [
  { id: 1, date: '24 Sep 2026', category: 'Makanan & Minuman', amount: 150000, type: 'expense', icon: '🍔' },
  { id: 2, date: '24 Sep 2026', category: 'Gaji', amount: 5000000, type: 'income', icon: '💰' },
  { id: 3, date: '23 Sep 2026', category: 'Transportasi', amount: 75000, type: 'expense', icon: '🚗' },
  { id: 4, date: '23 Sep 2026', category: 'Utilitas', amount: 250000, type: 'expense', icon: '💡' },
  { id: 5, date: '22 Sep 2026', category: 'Kesehatan', amount: 500000, type: 'expense', icon: '⚕️' },
]

const TransactionHistory = () => {
  const navigate = useNavigate()

  return (
    <div className="transaction-history">
      <div className="section-header">
        <h2>Riwayat Transaksi</h2>
        <button className="view-all" onClick={() => navigate('/expenses')}>Lihat semua →</button>
      </div>
      <div className="transaction-list">
        {MOCK_TRANSACTIONS.map(tx => (
          <div key={tx.id} className="transaction-item">
            <div className="tx-icon">{tx.icon}</div>
            <div className="tx-content">
              <div className="tx-category">{tx.category}</div>
              <div className="tx-date">{tx.date}</div>
            </div>
            <div className={`tx-amount ${tx.type}`}>
              {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TransactionHistory
