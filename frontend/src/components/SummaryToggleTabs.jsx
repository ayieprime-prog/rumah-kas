import React from 'react'

const SummaryToggleTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="summary-toggle-tabs">
      <button
        className={`summary-toggle-tab ${activeTab === 'ringkasan' ? 'active' : ''}`}
        onClick={() => onTabChange('ringkasan')}
      >
        Ringkasan Keuangan
      </button>
      <button
        className={`summary-toggle-tab ${activeTab === 'agenda' ? 'active' : ''}`}
        onClick={() => onTabChange('agenda')}
      >
        Agenda Minggu ini
      </button>
    </div>
  )
}

export default SummaryToggleTabs
