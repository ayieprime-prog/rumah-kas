import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AgendaSection from '../AgendaSection'

describe('AgendaSection', () => {
  it('renders agenda header with title', () => {
    render(<AgendaSection onAddClick={jest.fn()} />)
    expect(screen.getByText('Agenda Hari ini')).toBeInTheDocument()
  })

  it('renders agenda items', () => {
    render(<AgendaSection onAddClick={jest.fn()} />)

    expect(screen.getByText('Ganti oli mobil')).toBeInTheDocument()
    expect(screen.getByText('Rapat keluarga')).toBeInTheDocument()
  })

  it('shows completion count', () => {
    render(<AgendaSection onAddClick={jest.fn()} />)

    expect(screen.getByText(/1\/2 selesai/)).toBeInTheDocument()
  })

  it('renders add button', () => {
    render(<AgendaSection onAddClick={jest.fn()} />)

    const addButton = screen.getByRole('button', { name: /Tambah agenda/ })
    expect(addButton).toBeInTheDocument()
  })

  it('calls onAddClick when add button is clicked', () => {
    const mockAddClick = jest.fn()
    render(<AgendaSection onAddClick={mockAddClick} />)

    const addButton = screen.getByRole('button', { name: /Tambah agenda/ })
    fireEvent.click(addButton)

    expect(mockAddClick).toHaveBeenCalled()
  })

  it('renders completed items with completed class', () => {
    const { container } = render(<AgendaSection onAddClick={jest.fn()} />)

    const items = container.querySelectorAll('.agenda-item')
    expect(items[0]).toHaveClass('completed')
    expect(items[1]).not.toHaveClass('completed')
  })

  it('renders checkboxes for items', () => {
    render(<AgendaSection onAddClick={jest.fn()} />)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBe(2)
    expect(checkboxes[0]).toBeChecked() // First item is completed
    expect(checkboxes[1]).not.toBeChecked() // Second is not
  })

  it('shows item times correctly', () => {
    render(<AgendaSection onAddClick={jest.fn()} />)

    expect(screen.getByText('Jadwal Maintenance')).toBeInTheDocument()
    expect(screen.getByText('14:00 - 15:00')).toBeInTheDocument()
  })
})
