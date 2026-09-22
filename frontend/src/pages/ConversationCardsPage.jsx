import React, { useState, useEffect } from 'react'
import { Shuffle, Heart, Star } from 'lucide-react'
import conversationCards from '../data/conversationCards'
import './ListPages.css'
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
  const [showFavorites, setShowFavorites] = useState(false)

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  const isFavorited = (id) => favorites.some(f => f.id === id)

  const toggleFavorite = (card) => {
    setFavorites(prev =>
      isFavorited(card.id) ? prev.filter(f => f.id !== card.id) : [...prev, card]
    )
  }

  const nextCard = () => setCurrent(pickRandom(current.id))

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Conversation Cards</h1>
      </div>

      <div className="cc-tabs">
        <button className={`cc-tab ${!showFavorites ? 'active' : ''}`} onClick={() => setShowFavorites(false)}>Kartu</button>
        <button className={`cc-tab ${showFavorites ? 'active' : ''}`} onClick={() => setShowFavorites(true)}>
          Favorit ({favorites.length})
        </button>
      </div>

      {!showFavorites ? (
        <>
          <div className="cc-card">
            <span className="cc-card-category">{current.category}</span>
            <p className="cc-card-text">{current.text}</p>
            <button className="cc-favorite-btn" onClick={() => toggleFavorite(current)}>
              <Heart size={20} fill={isFavorited(current.id) ? 'currentColor' : 'none'} />
            </button>
          </div>

          <button className="btn-pill" onClick={nextCard}>
            <Shuffle size={18} /> Kartu Berikutnya
          </button>
        </>
      ) : (
        <div className="card">
          {favorites.length > 0 ? (
            favorites.map(card => (
              <div key={card.id} className="list-row">
                <div className="icon-square sw-5" style={{ width: 36, height: 36 }}>
                  <Star size={16} />
                </div>
                <div className="list-row-body">
                  <div className="list-row-title">{card.text}</div>
                  <div className="list-row-subtitle">{card.category}</div>
                </div>
                <button className="icon-btn" onClick={() => toggleFavorite(card)}>
                  <Heart size={16} fill="currentColor" />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Heart size={28} className="empty-state-icon" />
              <p>Belum ada kartu favorit</p>
              <span>Tekan ikon hati di kartu untuk menyimpannya di sini</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ConversationCardsPage
