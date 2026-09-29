import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SummaryToggleTabs from '../SummaryToggleTabs'

describe('SummaryToggleTabs', () => {
  it('renders both tab buttons', () => {
    const mockHandler = jest.fn()
    render(
      <SummaryToggleTabs activeTab="ringkasan" onTabChange={mockHandler} />
    )

    expect(screen.getByText('Ringkasan Keuangan')).toBeInTheDocument()
    expect(screen.getByText('Agenda Minggu ini')).toBeInTheDocument()
  })

  it('highlights active tab', () => {
    const mockHandler = jest.fn()
    const { container } = render(
      <SummaryToggleTabs activeTab="ringkasan" onTabChange={mockHandler} />
    )

    const tabs = container.querySelectorAll('.summary-toggle-tab')
    expect(tabs[0]).toHaveClass('active')
  })

  it('calls onTabChange when tab is clicked', () => {
    const mockHandler = jest.fn()
    render(
      <SummaryToggleTabs activeTab="ringkasan" onTabChange={mockHandler} />
    )

    const agendaTab = screen.getByText('Agenda Minggu ini')
    fireEvent.click(agendaTab)

    expect(mockHandler).toHaveBeenCalledWith('agenda')
  })

  it('updates active class when activeTab prop changes', () => {
    const mockHandler = jest.fn()
    const { container, rerender } = render(
      <SummaryToggleTabs activeTab="ringkasan" onTabChange={mockHandler} />
    )

    let tabs = container.querySelectorAll('.summary-toggle-tab')
    expect(tabs[0]).toHaveClass('active')
    expect(tabs[1]).not.toHaveClass('active')

    rerender(
      <SummaryToggleTabs activeTab="agenda" onTabChange={mockHandler} />
    )

    tabs = container.querySelectorAll('.summary-toggle-tab')
    expect(tabs[0]).not.toHaveClass('active')
    expect(tabs[1]).toHaveClass('active')
  })

  it('renders with correct container class', () => {
    const { container } = render(
      <SummaryToggleTabs activeTab="ringkasan" onTabChange={jest.fn()} />
    )

    expect(container.querySelector('.summary-toggle-tabs')).toBeInTheDocument()
  })
})
