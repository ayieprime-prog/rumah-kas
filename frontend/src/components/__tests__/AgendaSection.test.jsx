import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import axios from 'axios'
import AgendaSection from '../AgendaSection'

jest.mock('axios')

describe('AgendaSection', () => {
  afterEach(() => jest.clearAllMocks())

  it('renders agenda header with title', async () => {
    axios.get.mockResolvedValue({ data: [] })
    render(<AgendaSection onAddClick={jest.fn()} />)
    expect(screen.getByText('Agenda Hari ini')).toBeInTheDocument()
    await screen.findByText('Belum ada agenda hari ini')
  })

  it('renders real todos fetched from the API', async () => {
    axios.get.mockResolvedValue({
      data: [
        { id: '1', title: 'Ganti oli mobil', category: 'Jadwal Maintenance', dueDate: '2026-09-29T08:00:00.000Z', completed: true },
        { id: '2', title: 'Rapat keluarga', category: null, dueDate: '2026-09-29T14:00:00.000Z', completed: false }
      ]
    })
    render(<AgendaSection onAddClick={jest.fn()} />)

    expect(await screen.findByText('Ganti oli mobil')).toBeInTheDocument()
    expect(screen.getByText('Rapat keluarga')).toBeInTheDocument()
  })

  it('shows completion count from real data', async () => {
    axios.get.mockResolvedValue({
      data: [
        { id: '1', title: 'Ganti oli mobil', category: null, dueDate: '2026-09-29T08:00:00.000Z', completed: true },
        { id: '2', title: 'Rapat keluarga', category: null, dueDate: '2026-09-29T14:00:00.000Z', completed: false }
      ]
    })
    render(<AgendaSection onAddClick={jest.fn()} />)

    expect(await screen.findByText(/1\/2 selesai/)).toBeInTheDocument()
  })

  it('renders add button and calls onAddClick when clicked', async () => {
    axios.get.mockResolvedValue({ data: [] })
    const mockAddClick = jest.fn()
    render(<AgendaSection onAddClick={mockAddClick} />)

    const addButton = screen.getByRole('button', { name: /Tambah agenda/ })
    fireEvent.click(addButton)
    expect(mockAddClick).toHaveBeenCalled()
  })

  it('renders completed items with completed class', async () => {
    axios.get.mockResolvedValue({
      data: [
        { id: '1', title: 'Ganti oli mobil', category: null, dueDate: '2026-09-29T08:00:00.000Z', completed: true },
        { id: '2', title: 'Rapat keluarga', category: null, dueDate: '2026-09-29T14:00:00.000Z', completed: false }
      ]
    })
    const { container } = render(<AgendaSection onAddClick={jest.fn()} />)

    await screen.findByText('Ganti oli mobil')
    const items = container.querySelectorAll('.agenda-item')
    expect(items[0]).toHaveClass('completed')
    expect(items[1]).not.toHaveClass('completed')
  })

  it('toggles a todo via PUT when its checkbox is clicked', async () => {
    axios.get.mockResolvedValue({
      data: [{ id: '1', title: 'Ganti oli mobil', category: null, dueDate: '2026-09-29T08:00:00.000Z', completed: false }]
    })
    axios.put.mockResolvedValue({ data: {} })
    render(<AgendaSection onAddClick={jest.fn()} />)

    const checkbox = await screen.findByRole('checkbox')
    expect(checkbox).not.toBeChecked()
    fireEvent.click(checkbox)

    expect(axios.put).toHaveBeenCalledWith('/api/todos/1', { completed: true })
  })

  it('fetches todos scoped to today via GET /api/todos', async () => {
    axios.get.mockResolvedValue({ data: [] })
    render(<AgendaSection onAddClick={jest.fn()} />)

    expect(axios.get).toHaveBeenCalledWith('/api/todos', { params: { date: expect.any(String) } })
  })
})
