import React from 'react'
import WeatherWidget from './WeatherWidget'

const greetingForHour = (hour) => {
  if (hour < 10) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

const GreetingSection = ({ user, now, weather }) => {
  const today = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeLabel = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  const headerStyle = user?.wallpaper ? {
    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.6) 100%), url(${user.wallpaper})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : undefined

  return (
    <div className={`dashboard-header ${user?.wallpaper ? 'has-wallpaper' : ''}`} style={headerStyle}>
      <div className="dashboard-header-brand">
        <img src="/pundi-icon.svg" alt="Pundi" className="dashboard-header-brand-icon" />
        <span>Pundi</span>
      </div>
      <div className="welcome-section">
        <div className="welcome-topline">
          <h1>{greetingForHour(now.getHours())}, Keluarga</h1>
          <span className="welcome-clock">{timeLabel}</span>
        </div>
        <p>{today}</p>
        <WeatherWidget weather={weather} />
      </div>
    </div>
  )
}

export default GreetingSection
