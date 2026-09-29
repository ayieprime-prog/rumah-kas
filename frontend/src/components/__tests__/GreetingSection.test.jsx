import React from 'react'
import { render, screen } from '@testing-library/react'
import GreetingSection from '../GreetingSection'

describe('GreetingSection', () => {
  const mockUser = {
    wallpaper: null
  }

  const mockWeather = {
    items: [
      { label: 'Pagi', temp: 25, icon: '🌤️' },
      { label: 'Siang', temp: 30, icon: '☀️' }
    ]
  }

  it('renders greeting based on time of day', () => {
    const morningTime = new Date(2026, 8, 24, 8, 0)
    render(
      <GreetingSection user={mockUser} now={morningTime} weather={mockWeather} />
    )
    expect(screen.getByText(/Selamat pagi/)).toBeInTheDocument()
  })

  it('renders afternoon greeting', () => {
    const afternoonTime = new Date(2026, 8, 24, 13, 0)
    render(
      <GreetingSection user={mockUser} now={afternoonTime} weather={mockWeather} />
    )
    expect(screen.getByText(/Selamat siang/)).toBeInTheDocument()
  })

  it('renders evening greeting', () => {
    const eveningTime = new Date(2026, 8, 24, 17, 0)
    render(
      <GreetingSection user={mockUser} now={eveningTime} weather={mockWeather} />
    )
    expect(screen.getByText(/Selamat sore/)).toBeInTheDocument()
  })

  it('renders night greeting', () => {
    const nightTime = new Date(2026, 8, 24, 20, 0)
    render(
      <GreetingSection user={mockUser} now={nightTime} weather={mockWeather} />
    )
    expect(screen.getByText(/Selamat malam/)).toBeInTheDocument()
  })

  it('renders Pundi branding', () => {
    const now = new Date(2026, 8, 24, 12, 0)
    render(
      <GreetingSection user={mockUser} now={now} weather={mockWeather} />
    )
    expect(screen.getByText('Pundi')).toBeInTheDocument()
  })

  it('renders current date', () => {
    const now = new Date(2026, 8, 24, 12, 0)
    render(
      <GreetingSection user={mockUser} now={now} weather={mockWeather} />
    )
    expect(screen.getByText(/24/)).toBeInTheDocument()
    expect(screen.getByText(/September/)).toBeInTheDocument()
  })

  it('applies wallpaper style when user has wallpaper', () => {
    const userWithWallpaper = { wallpaper: 'https://example.com/wallpaper.jpg' }
    const now = new Date()
    const { container } = render(
      <GreetingSection user={userWithWallpaper} now={now} weather={mockWeather} />
    )
    const header = container.querySelector('.dashboard-header')
    expect(header).toHaveClass('has-wallpaper')
  })

  it('renders weather widget', () => {
    const now = new Date()
    render(
      <GreetingSection user={mockUser} now={now} weather={mockWeather} />
    )
    expect(screen.getByText('Pagi')).toBeInTheDocument()
    expect(screen.getByText('Siang')).toBeInTheDocument()
  })
})
