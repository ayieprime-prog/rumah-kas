import React, { useState, useEffect } from 'react'
import { ChevronLeft, Shuffle } from 'lucide-react'
import BackButton from '../components/BackButton'
import conversationCards from '../data/conversationCards'
import './ConversationCardsPage.css'

const FAVORITES_KEY = 'rumahkas_favorite_cards'

const pickRandom = (excludeId) => {
  const pool = conversationCards.filter(c => c.id !== excludeId)
  return pool[Math.floor(Math.random() * pool.length)]
}

const ConversationCardsPage = () => {
  const [current, setCurrent] = useState(() => pickRandom())
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []
    } catch {
      return []
    }
  })
  const [activeTab, setActiveTab] = useState('today') // 'today' or 'history'

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  const nextCard = () => setCurrent(pickRandom(current.id))

  return (
    <div className="cc-page">
      <div className="cc-header">
        <button className="cc-back-btn">
          <ChevronLeft size={20} />
        </button>
        <h1>Conversation Cards</h1>
        <div style={{ width: 40 }} />
      </div>

      {/* Tab Toggle */}
      <div className="cc-tab-toggle">
        <button
          className={`cc-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Card Hari Ini
        </button>
        <button
          className={`cc-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Riwayat
        </button>
      </div>

      {/* Card Hari Ini View */}
      {activeTab === 'today' && (
        <div className="cc-content">
          <div className="cc-card-container">
            <div className="cc-card">
              {/* Pundi Logo */}
              <div className="cc-card-logo">
                <img src="/pundi-icon.svg" alt="Pundi" />
              </div>

              {/* Question Text */}
              <p className="cc-card-question">{current.text}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cc-actions">
            <button className="cc-btn-primary">
              ↓ Rekam Jawaban
            </button>
            <button className="cc-btn-secondary" onClick={nextCard}>
              ✕ Ganti Pertanyaan
            </button>
          </div>
        </div>
      )}

      {/* Riwayat View */}
      {activeTab === 'history' && (
        <div className="cc-content">
          {favorites.length > 0 ? (
            <div className="cc-history-list">
              {favorites.map(card => (
                <div key={card.id} className="cc-history-item">
                  <p className="cc-history-text">{card.text}</p>
                  <span className="cc-history-category">{card.category}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="cc-empty-state">
              <p>Belum ada riwayat</p>
              <span>Rekam jawaban untuk menyimpannya di sini</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ConversationCardsPage
