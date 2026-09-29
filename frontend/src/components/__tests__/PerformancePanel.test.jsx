import { render, screen } from '@testing-library/react'
import axios from 'axios'
import { PerformancePanel } from '../Performance/PerformancePanel'

jest.mock('axios')

describe('PerformancePanel', () => {
  afterEach(() => jest.clearAllMocks())

  it('shows a loading state before the request resolves', () => {
    axios.get.mockReturnValue(new Promise(() => {})) // never resolves
    render(<PerformancePanel />)
    expect(screen.getByText('Memuat data performa...')).toBeInTheDocument()
  })

  it('shows an empty state when there are no recorded alerts', async () => {
    axios.get.mockResolvedValue({ data: { count: 0, alerts: [], summary: [] } })
    render(<PerformancePanel />)

    expect(await screen.findByText(/Belum ada masalah performa/)).toBeInTheDocument()
  })

  it('renders the summary rows when alerts exist', async () => {
    axios.get.mockResolvedValue({
      data: {
        count: 5,
        alerts: [],
        summary: [
          { metric: 'LCP', count: 3, averageValue: 2800 },
          { metric: 'API: /api/expenses', count: 2, averageValue: 1200 }
        ]
      }
    })
    render(<PerformancePanel />)

    expect(await screen.findByText(/5 metrik lambat/)).toBeInTheDocument()
    expect(screen.getByText('LCP')).toBeInTheDocument()
    expect(screen.getByText('3x tercatat')).toBeInTheDocument()
    expect(screen.getByText('2800ms rata-rata')).toBeInTheDocument()
    expect(screen.getByText('API: /api/expenses')).toBeInTheDocument()
  })

  it('fails quietly (no error banner) when the request rejects', async () => {
    axios.get.mockRejectedValue(new Error('network down'))
    render(<PerformancePanel />)

    expect(await screen.findByText(/Belum ada masalah performa/)).toBeInTheDocument()
  })

  it('calls GET /api/performance/alerts', () => {
    axios.get.mockReturnValue(new Promise(() => {}))
    render(<PerformancePanel />)
    expect(axios.get).toHaveBeenCalledWith('/api/performance/alerts')
  })
})
