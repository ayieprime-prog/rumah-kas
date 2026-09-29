import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import TransactionHistory from '../TransactionHistory'

jest.mock('axios')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

const mockExpenses = [
  { id: 'e1', date: '2026-09-24', amount: 150000, category: { name: 'Makanan & Minuman' } },
  { id: 'e2', date: '2026-09-23', amount: 75000, category: { name: 'Transportasi' } }
]
const mockIncomes = [
  { id: 'i1', date: '2026-09-24', amount: 5000000, source: 'Gaji' }
]

describe('TransactionHistory', () => {
  afterEach(() => jest.clearAllMocks())

  it('renders transaction history heading', async () => {
    axios.get.mockResolvedValue({ data: { expenses: [], incomes: [] } })
    renderWithRouter(<TransactionHistory />)
    expect(screen.getByText('Riwayat Transaksi')).toBeInTheDocument()
    await screen.findByText('Belum ada transaksi')
  })

  it('renders view all button', async () => {
    axios.get.mockResolvedValue({ data: { expenses: [], incomes: [] } })
    renderWithRouter(<TransactionHistory />)
    expect(screen.getByText(/Lihat semua/)).toBeInTheDocument()
  })

  it('renders real expenses and income merged by date', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/expenses') return Promise.resolve({ data: { expenses: mockExpenses } })
      if (url === '/api/income') return Promise.resolve({ data: { incomes: mockIncomes } })
      return Promise.resolve({ data: {} })
    })
    renderWithRouter(<TransactionHistory />)

    expect(await screen.findByText('Makanan & Minuman')).toBeInTheDocument()
    expect(screen.getByText('Transportasi')).toBeInTheDocument()
    expect(screen.getByText('Gaji')).toBeInTheDocument()
  })

  it('shows correct amounts with +/- prefix', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/expenses') return Promise.resolve({ data: { expenses: mockExpenses } })
      if (url === '/api/income') return Promise.resolve({ data: { incomes: mockIncomes } })
      return Promise.resolve({ data: {} })
    })
    renderWithRouter(<TransactionHistory />)

    expect(await screen.findByText(/\+.*5\.000\.000/)).toBeInTheDocument()
    expect(screen.getByText(/-.*150\.000/)).toBeInTheDocument()
    expect(screen.getByText(/-.*75\.000/)).toBeInTheDocument()
  })

  it('marks income transactions with correct class', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/expenses') return Promise.resolve({ data: { expenses: mockExpenses } })
      if (url === '/api/income') return Promise.resolve({ data: { incomes: mockIncomes } })
      return Promise.resolve({ data: {} })
    })
    const { container } = renderWithRouter(<TransactionHistory />)

    await screen.findByText('Gaji')
    const amounts = container.querySelectorAll('.tx-amount')
    expect([...amounts].some(el => el.classList.contains('income'))).toBe(true)
    expect([...amounts].some(el => el.classList.contains('expense'))).toBe(true)
  })

  it('shows an empty state when there are no transactions', async () => {
    axios.get.mockResolvedValue({ data: { expenses: [], incomes: [] } })
    renderWithRouter(<TransactionHistory />)

    expect(await screen.findByText('Belum ada transaksi')).toBeInTheDocument()
  })

  it('fails quietly and shows empty state when the request rejects', async () => {
    axios.get.mockRejectedValue(new Error('network down'))
    renderWithRouter(<TransactionHistory />)

    expect(await screen.findByText('Belum ada transaksi')).toBeInTheDocument()
  })

  it('renders transaction list container', async () => {
    axios.get.mockResolvedValue({ data: { expenses: [], incomes: [] } })
    const { container } = renderWithRouter(<TransactionHistory />)

    expect(container.querySelector('.transaction-list')).toBeInTheDocument()
  })
})
