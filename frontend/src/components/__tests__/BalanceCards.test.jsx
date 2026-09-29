import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import BalanceCards from '../BalanceCards'

describe('BalanceCards', () => {
  const mockOverview = {
    balance: 5000000
  }

  const mockGoals = [
    { currentAmount: 1000000 },
    { currentAmount: 500000 }
  ]

  const mockIncomeLocks = {
    totalRemaining: 750000
  }

  it('renders both balance cards', () => {
    render(
      <BalanceCards
        overview={mockOverview}
        goals={mockGoals}
        incomeLocks={mockIncomeLocks}
        showBalance={true}
        onToggleBalance={jest.fn()}
      />
    )

    expect(screen.getByText('Saldo Aktif')).toBeInTheDocument()
    expect(screen.getByText('Uang Bebas')).toBeInTheDocument()
  })

  it('shows balance values when showBalance is true', () => {
    render(
      <BalanceCards
        overview={mockOverview}
        goals={mockGoals}
        incomeLocks={mockIncomeLocks}
        showBalance={true}
        onToggleBalance={jest.fn()}
      />
    )

    // Should show actual balance
    expect(screen.getByText(/Rp 5.000.000/)).toBeInTheDocument()
  })

  it('hides balance values when showBalance is false', () => {
    render(
      <BalanceCards
        overview={mockOverview}
        goals={mockGoals}
        incomeLocks={mockIncomeLocks}
        showBalance={false}
        onToggleBalance={jest.fn()}
      />
    )

    // Should show masked balance
    expect(screen.getAllByText('••••••••')).toHaveLength(2)
  })

  it('calculates uang bebas correctly', () => {
    // Uang Bebas = Balance - Total Goals - Total Locked
    // 5,000,000 - 1,500,000 - 750,000 = 2,750,000
    render(
      <BalanceCards
        overview={mockOverview}
        goals={mockGoals}
        incomeLocks={mockIncomeLocks}
        showBalance={true}
        onToggleBalance={jest.fn()}
      />
    )

    expect(screen.getByText(/Rp 2.750.000/)).toBeInTheDocument()
  })

  it('calls onToggleBalance when eye button is clicked', () => {
    const mockToggle = jest.fn()
    render(
      <BalanceCards
        overview={mockOverview}
        goals={mockGoals}
        incomeLocks={mockIncomeLocks}
        showBalance={true}
        onToggleBalance={mockToggle}
      />
    )

    const eyeButtons = screen.getAllByRole('button', { name: /visibility/ })
    fireEvent.click(eyeButtons[0])

    expect(mockToggle).toHaveBeenCalled()
  })

  it('renders with correct container class', () => {
    const { container } = render(
      <BalanceCards
        overview={mockOverview}
        goals={mockGoals}
        incomeLocks={mockIncomeLocks}
        showBalance={true}
        onToggleBalance={jest.fn()}
      />
    )

    expect(container.querySelector('.balance-cards')).toBeInTheDocument()
  })

  it('handles zero goals and locks gracefully', () => {
    const minimalOverview = { balance: 1000000 }
    const noGoals = []
    const noLocks = { totalRemaining: 0 }

    render(
      <BalanceCards
        overview={minimalOverview}
        goals={noGoals}
        incomeLocks={noLocks}
        showBalance={true}
        onToggleBalance={jest.fn()}
      />
    )

    // Uang Bebas = 1,000,000 - 0 - 0 = 1,000,000
    const amounts = screen.getAllByText(/Rp 1.000.000/)
    expect(amounts.length).toBe(2) // Both cards show same amount
  })
})
