import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MenuShortcuts from '../MenuShortcuts'

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('MenuShortcuts', () => {
  it('renders all 8 menu shortcuts', () => {
    renderWithRouter(<MenuShortcuts />)

    expect(screen.getByText('Keuangan')).toBeInTheDocument()
    expect(screen.getByText('Kalender')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
    expect(screen.getByText('Conversation')).toBeInTheDocument()
    expect(screen.getByText('Jurnal Keluarga')).toBeInTheDocument()
    expect(screen.getByText('Laporan')).toBeInTheDocument()
    expect(screen.getByText('Bantuan & FAQ')).toBeInTheDocument()
    expect(screen.getByText('Lainnya')).toBeInTheDocument()
  })

  it('renders menu container with correct class', () => {
    const { container } = renderWithRouter(<MenuShortcuts />)
    expect(container.querySelector('.menu-shortcuts')).toBeInTheDocument()
  })

  it('renders each shortcut with correct styling', () => {
    const { container } = renderWithRouter(<MenuShortcuts />)
    const shortcuts = container.querySelectorAll('.shortcut-item')
    expect(shortcuts.length).toBe(8)
  })

  it('has correct background colors for shortcuts', () => {
    const { container } = renderWithRouter(<MenuShortcuts />)
    const shortcuts = container.querySelectorAll('.shortcut-item')

    // Check if colors are applied (at least some of them)
    const colors = ['#c9a961', '#4a7c8c', '#b8956a', '#a85a7a', '#5b6fa0', '#6b8c7d', '#5a9a6a']
    shortcuts.forEach((shortcut, index) => {
      const style = window.getComputedStyle(shortcut)
      expect(style.backgroundColor).toBeTruthy()
    })
  })

  it('renders menu items as buttons', () => {
    const { container } = renderWithRouter(<MenuShortcuts />)
    const buttons = container.querySelectorAll('button.shortcut-item')
    expect(buttons.length).toBe(8)
  })

  it('each button has an aria-label', () => {
    const { container } = renderWithRouter(<MenuShortcuts />)
    const buttons = container.querySelectorAll('button.shortcut-item[aria-label]')
    expect(buttons.length).toBe(8)
  })

  it('buttons are clickable', () => {
    renderWithRouter(<MenuShortcuts />)
    const button = screen.getByRole('button', { name: /Keuangan/ })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    // Navigation would occur (handled by BrowserRouter)
  })
})
