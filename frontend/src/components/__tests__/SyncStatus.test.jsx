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

  it('shows an initializing state before the hook reports ready', () => {
    mockHook({ isInitialized: false })
    render(<SyncStatus />)
    expect(screen.getByText('Initializing sync...')).toBeInTheDocument()
  })

  it('renders the sync schedule once initialized', async () => {
    mockHook()
    render(<SyncStatus />)

    expect(await screen.findByText('Data Sync Status')).toBeInTheDocument()
    expect(screen.getByText('Sync Schedule')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText('Every 30 minutes')).toBeInTheDocument()
  })

  it('displays cache size formatted from getSyncStats', async () => {
    const getSyncStats = jest.fn().mockResolvedValue({ totalRecords: 2, caches: [], totalSize: 2048 })
    mockHook({ getSyncStats })
    render(<SyncStatus />)

    await waitFor(() => expect(getSyncStats).toHaveBeenCalled())
    expect(await screen.findByText('2 KB')).toBeInTheDocument()
  })

  it('clicking Sync Now refreshes stats', async () => {
    const getSyncStats = jest.fn().mockResolvedValue({ totalRecords: 1, caches: [], totalSize: 1024 })
    mockHook({ getSyncStats })
    const user = userEvent.setup()

    render(<SyncStatus />)
    await screen.findByText('Data Sync Status')
    getSyncStats.mockClear()

    await user.click(screen.getByRole('button', { name: /Sync Now/ }))

    expect(getSyncStats).toHaveBeenCalled()
  })

  it('clicking Clear Old Cache calls clearOldCache after confirmation', async () => {
    const clearOldCache = jest.fn().mockResolvedValue(undefined)
    mockHook({ clearOldCache })
    window.confirm = jest.fn().mockReturnValue(true)
    const user = userEvent.setup()

    render(<SyncStatus />)
    await screen.findByText('Data Sync Status')

    await user.click(screen.getByRole('button', { name: /Clear Old Cache/ }))

    expect(window.confirm).toHaveBeenCalled()
    expect(clearOldCache).toHaveBeenCalledTimes(1)
  })

  it('does not clear cache if the user cancels the confirmation', async () => {
    const clearOldCache = jest.fn()
    mockHook({ clearOldCache })
    window.confirm = jest.fn().mockReturnValue(false)
    const user = userEvent.setup()

    render(<SyncStatus />)
    await screen.findByText('Data Sync Status')

    await user.click(screen.getByRole('button', { name: /Clear Old Cache/ }))

    expect(clearOldCache).not.toHaveBeenCalled()
  })

  it('shows a sync error message when clearing the cache fails', async () => {
    const clearOldCache = jest.fn().mockRejectedValue(new Error('quota exceeded'))
    mockHook({ clearOldCache })
    window.confirm = jest.fn().mockReturnValue(true)
    const user = userEvent.setup()

    render(<SyncStatus />)
    await screen.findByText('Data Sync Status')

    await user.click(screen.getByRole('button', { name: /Clear Old Cache/ }))

    expect(await screen.findByText(/quota exceeded/)).toBeInTheDocument()
  })
})
