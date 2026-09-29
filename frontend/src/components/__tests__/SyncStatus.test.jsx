import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SyncStatus } from '../Sync/SyncStatus'
import { useBackgroundSync } from '../../utils/backgroundSync'

jest.mock('../../utils/backgroundSync', () => ({
  useBackgroundSync: jest.fn()
}))

function mockHook(overrides = {}) {
  useBackgroundSync.mockReturnValue({
    isInitialized: true,
    syncStats: { totalRecords: 0, caches: [], totalSize: 0 },
    getSyncStats: jest.fn().mockResolvedValue({ totalRecords: 0, caches: [], totalSize: 0 }),
    clearOldCache: jest.fn().mockResolvedValue(undefined),
    ...overrides
  })
}

describe('SyncStatus', () => {
  afterEach(() => jest.clearAllMocks())

  it('shows a preparing state before the hook reports ready', () => {
    mockHook({ isInitialized: false })
    render(<SyncStatus />)
    expect(screen.getByText('Menyiapkan sinkronisasi...')).toBeInTheDocument()
  })

  it('renders the sync schedule once initialized', async () => {
    mockHook()
    render(<SyncStatus />)

    expect(await screen.findByText('Status Sinkronisasi Data')).toBeInTheDocument()
    expect(screen.getByText('Jadwal Sinkronisasi')).toBeInTheDocument()
    expect(screen.getByText('Pengeluaran')).toBeInTheDocument()
    expect(screen.getByText('Setiap 30 menit')).toBeInTheDocument()
  })

  it('displays cache size formatted from getSyncStats', async () => {
    const getSyncStats = jest.fn().mockResolvedValue({ totalRecords: 2, caches: [], totalSize: 2048 })
    mockHook({ getSyncStats })
    render(<SyncStatus />)

    await waitFor(() => expect(getSyncStats).toHaveBeenCalled())
    expect(await screen.findByText('2 KB')).toBeInTheDocument()
  })

  it('clicking Sinkronkan refreshes stats', async () => {
    const getSyncStats = jest.fn().mockResolvedValue({ totalRecords: 1, caches: [], totalSize: 1024 })
    mockHook({ getSyncStats })
    const user = userEvent.setup()

    render(<SyncStatus />)
    await screen.findByText('Status Sinkronisasi Data')
    getSyncStats.mockClear()

    await user.click(screen.getByRole('button', { name: /Sinkronkan/ }))

    expect(getSyncStats).toHaveBeenCalled()
  })

  it('clicking Hapus Cache Lama calls clearOldCache after confirmation', async () => {
    const clearOldCache = jest.fn().mockResolvedValue(undefined)
    mockHook({ clearOldCache })
    window.confirm = jest.fn().mockReturnValue(true)
    const user = userEvent.setup()

    render(<SyncStatus />)
    await screen.findByText('Status Sinkronisasi Data')

    await user.click(screen.getByRole('button', { name: /Hapus Cache Lama/ }))

    expect(window.confirm).toHaveBeenCalled()
    expect(clearOldCache).toHaveBeenCalledTimes(1)
  })

  it('does not clear cache if the user cancels the confirmation', async () => {
    const clearOldCache = jest.fn()
    mockHook({ clearOldCache })
    window.confirm = jest.fn().mockReturnValue(false)
    const user = userEvent.setup()

    render(<SyncStatus />)
    await screen.findByText('Status Sinkronisasi Data')

    await user.click(screen.getByRole('button', { name: /Hapus Cache Lama/ }))

    expect(clearOldCache).not.toHaveBeenCalled()
  })

  it('shows a sync error message when clearing the cache fails', async () => {
    const clearOldCache = jest.fn().mockRejectedValue(new Error('quota exceeded'))
    mockHook({ clearOldCache })
    window.confirm = jest.fn().mockReturnValue(true)
    const user = userEvent.setup()

    render(<SyncStatus />)
    await screen.findByText('Status Sinkronisasi Data')

    await user.click(screen.getByRole('button', { name: /Hapus Cache Lama/ }))

    expect(await screen.findByText(/quota exceeded/)).toBeInTheDocument()
  })
})
