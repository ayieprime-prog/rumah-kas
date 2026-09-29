import React from 'react'
import { render, screen } from '@testing-library/react'
import WeatherWidget from '../WeatherWidget'

describe('WeatherWidget', () => {
  it('renders nothing when weather is null', () => {
    const { container } = render(<WeatherWidget weather={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when weather items are not available', () => {
    const { container } = render(<WeatherWidget weather={{}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders forecast items with correct data', () => {
    const weather = {
      items: [
        { label: 'Pagi', temp: 25, icon: '🌤️' },
        { label: 'Siang', temp: 30, icon: '☀️' },
        { label: 'Sore', temp: 28, icon: '⛅' },
        { label: 'Malam', temp: 23, icon: '☁️' }
      ]
    }

    render(<WeatherWidget weather={weather} />)

    expect(screen.getByText('Pagi')).toBeInTheDocument()
    expect(screen.getByText('Siang')).toBeInTheDocument()
    expect(screen.getByText('Sore')).toBeInTheDocument()
    expect(screen.getByText('Malam')).toBeInTheDocument()

    expect(screen.getByText('25°')).toBeInTheDocument()
    expect(screen.getByText('30°')).toBeInTheDocument()
    expect(screen.getByText('28°')).toBeInTheDocument()
    expect(screen.getByText('23°')).toBeInTheDocument()
  })

  it('renders all weather icons', () => {
    const weather = {
      items: [
        { label: 'Pagi', temp: 25, icon: '🌤️' },
        { label: 'Siang', temp: 30, icon: '☀️' }
      ]
    }

    render(<WeatherWidget weather={weather} />)

    expect(screen.getByText('🌤️')).toBeInTheDocument()
    expect(screen.getByText('☀️')).toBeInTheDocument()
  })
})
