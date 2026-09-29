import React from 'react'

const WeatherWidget = ({ weather }) => {
  if (!weather?.items) return null

  return (
    <div className="forecast-row">
      {weather.items.map((f, i) => (
        <div key={i} className="forecast-item">
          <div className="forecast-label">{f.label}</div>
          <div className="forecast-icon">{f.icon}</div>
          <div className="forecast-temp">{f.temp}°</div>
        </div>
      ))}
    </div>
  )
}

export default WeatherWidget
