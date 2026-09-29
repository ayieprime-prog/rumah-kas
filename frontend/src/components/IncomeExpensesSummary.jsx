import React from 'react'

const IncomeExpensesSummary = ({ overview }) => {
  return (
    <div className="summary-grid">
      <div className="summary-card income">
        <div className="summary-label">Pemasukan Bulan Ini</div>
        <div className="summary-value">Rp {overview.totalIncome.toLocaleString('id-ID')}</div>
      </div>
      <div className="summary-card expense">
        <div className="summary-label">Pengeluaran Bulan Ini</div>
        <div className="summary-value">Rp {overview.totalExpense.toLocaleString('id-ID')}</div>
      </div>
    </div>
  )
}

export default IncomeExpensesSummary
