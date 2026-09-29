import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import axios from 'axios'
import AddModal from '../AddModal'

jest.mock('axios')

describe('AddModal', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: [] })
  })
  afterEach(() => jest.clearAllMocks())

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AddModal isOpen={false} onClose={jest.fn()} today="24 September 2026" />
    )

    expect(container.querySelector('.modal-overlay')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(
      <AddModal isOpen={true} onClose={jest.fn()} today="24 September 2026" />
    )

    expect(screen.getByText('24 September 2026')).toBeInTheDocument()
  })

  it('renders both tab buttons', () => {
    render(
      <AddModal isOpen={true} onClose={jest.fn()} today="24 September 2026" />
    )

    expect(screen.getByText('Todo')).toBeInTheDocument()
    expect(screen.getByText('Keuangan')).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(
      <AddModal isOpen={true} onClose={jest.fn()} today="24 September 2026" />
    )

    const closeButton = screen.getByRole('button', { name: /Tutup modal/ })
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const mockClose = jest.fn()
    render(
      <AddModal isOpen={true} onClose={mockClose} today="24 September 2026" />
    )

    const closeButton = screen.getByRole('button', { name: /Tutup modal/ })
    fireEvent.click(closeButton)

    expect(mockClose).toHaveBeenCalled()
  })

  it('calls onClose when overlay is clicked', () => {
    const mockClose = jest.fn()
    const { container } = render(
      <AddModal isOpen={true} onClose={mockClose} today="24 September 2026" />
    )

    const overlay = container.querySelector('.modal-overlay')
    fireEvent.click(overlay)

    expect(mockClose).toHaveBeenCalled()
  })

  it('does not close when modal content is clicked', () => {
    const mockClose = jest.fn()
    const { container } = render(
      <AddModal isOpen={true} onClose={mockClose} today="24 September 2026" />
    )

    const modal = container.querySelector('.modal-content')
    fireEvent.click(modal)

    expect(mockClose).not.toHaveBeenCalled()
  })

  it('renders todo form by default', () => {
    render(
      <AddModal isOpen={true} onClose={jest.fn()} today="24 September 2026" />
    )

    expect(screen.getByText('Pilih Kategori')).toBeInTheDocument()
    expect(screen.getByText('Nama Task')).toBeInTheDocument()
    expect(screen.getByText('Ingatkan saya')).toBeInTheDocument()
  })

  it('switches to keuangan tab when clicked', () => {
    render(
      <AddModal isOpen={true} onClose={jest.fn()} today="24 September 2026" />
    )

    const keuanganTab = screen.getByText('Keuangan')
    fireEvent.click(keuanganTab)

    expect(screen.getByText('Tipe')).toBeInTheDocument()
    expect(screen.getByText('Nominal')).toBeInTheDocument()
  })
})
