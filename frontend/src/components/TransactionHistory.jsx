import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const TransactionHistory = () => {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecent()
    window.addEventListener('dashboard-refresh', loadRecent)
    return () => window.removeEventListener('dashboard-refresh', loadRecent)
  }, [])

  const loadRecent = async () => {
    try {
      const [expensesRes, incomeRes] = await Promise.all([
        axios.get('/api/expenses', { params: { limit: 5 } }),
        axios.get('/api/income', { params: { limit: 5 } })
      ])
      const expenseItems = (expensesRes.data.expenses || []).map(e => ({
        id: `expense-${e.id}`,
        date: e.date,
        category: e.category?.name || 'Pengeluaran',
        amount: e.amount,
        type: 'expense'
      }))
      const incomeItems = (incomeRes.data.incomes || []).map(i => ({
        id: `income-${i.id}`,
        date: i.date,
        category: i.source,
        amount: i.amount,
        type: 'income'
      }))
      const combined = [...expenseItems, ...incomeItems]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
      setTransactions(combined)
    } catch (err) {
      console.error('Gagal memuat riwayat transaksi:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="transaction-history">
      <div className="section-header">
        <h2>Riwayat Transaksi</h2>
        <button className="view-all" onClick={() => navigate('/expenses')}>Lihat semua →</button>
      </div>
      <div className="transaction-list">
        {loading ? (
          <div className="tx-empty">Memuat riwayat transaksi...</div>
        ) : transactions.length > 0 ? (
          transactions.map(tx => (
            <div key={tx.id} className="transaction-item">
              <div className="tx-icon">{tx.type === 'income' ? '💰' : '💸'}</div>
              <div className="tx-content">
                <div className="tx-category">{tx.category}</div>
                <div className="tx-date">{formatDate(tx.date)}</div>
              </div>
              <div className={`tx-amount ${tx.type}`}>
                {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
              </div>
            </div>
          ))
        ) : (
          <div className="tx-empty">Belum ada transaksi</div>
        )}
      </div>
    </div>
  )
}

export default TransactionHistory
