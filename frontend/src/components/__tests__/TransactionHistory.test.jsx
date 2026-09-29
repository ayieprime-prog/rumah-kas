import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TransactionHistory from '../TransactionHistory'

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('TransactionHistory', () => {
  it('renders transaction history heading', () => {
    renderWithRouter(<TransactionHistory />)
    expect(screen.getByText('Riwayat Transaksi')).toBeInTheDocument()
  })

  it('renders view all button', () => {
    renderWithRouter(<TransactionHistory />)
    expect(screen.getByText(/Lihat semua/)).toBeInTheDocument()
  })

  it('renders all 5 mock transactions', () => {
    renderWithRouter(<TransactionHistory />)

    expect(screen.getByText('Makanan & Minuman')).toBeInTheDocument()
    expect(screen.getByText('Gaji')).toBeInTheDocument()
    expect(screen.getByText('Transportasi')).toBeInTheDocument()
    expect(screen.getByText('Utilitas')).toBeInTheDocument()
    expect(screen.getByText('Kesehatan')).toBeInTheDocument()
  })

  it('shows correct amounts with +/- prefix', () => {
    renderWithRouter(<TransactionHistory />)

    // Income should have +
    expect(screen.getByText(/\+.*5.000.000/)).toBeInTheDocument()

    // Expenses should have -
    expect(screen.getByText(/-.*150.000/)).toBeInTheDocument()
    expect(screen.getByText(/-.*75.000/)).toBeInTheDocument()
    expect(screen.getByText(/-.*250.000/)).toBeInTheDocument()
    expect(screen.getByText(/-.*500.000/)).toBeInTheDocument()
  })

  it('renders transaction dates', () => {
    renderWithRouter(<TransactionHistory />)

    const dates = screen.getAllByText(/Sep 2026/)
    expect(dates.length).toBeGreaterThan(0)
  })

  it('renders transaction icons as emojis', () => {
    renderWithRouter(<TransactionHistory />)

    expect(screen.getByText('🍔')).toBeInTheDocument() // Makanan
    expect(screen.getByText('💰')).toBeInTheDocument() // Gaji
    expect(screen.getByText('🚗')).toBeInTheDocument() // Transportasi
    expect(screen.getByText('💡')).toBeInTheDocument() // Utilitas
    expect(screen.getByText('⚕️')).toBeInTheDocument() // Kesehatan
  })

  it('marks income transactions with correct class', () => {
    const { container } = renderWithRouter(<TransactionHistory />)

    const amounts = container.querySelectorAll('.tx-amount')
    expect(amounts[0]).toHaveClass('expense')
    expect(amounts[1]).toHaveClass('income')
    expect(amounts[2]).toHaveClass('expense')
  })

  it('view all button exists and is clickable', () => {
    renderWithRouter(<TransactionHistory />)

    const viewAllButton = screen.getByText(/Lihat semua/)
    expect(viewAllButton).toBeInTheDocument()
    expect(viewAllButton).toBeEnabled()
  })

  it('renders transaction list container', () => {
    const { container } = renderWithRouter(<TransactionHistory />)

    expect(container.querySelector('.transaction-list')).toBeInTheDocument()
  })
})
