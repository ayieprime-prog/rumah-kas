import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OfflineBanner } from '../PWA/OfflineBanner'
import { offlineStorage, offlineSync } from '../../utils/offlineStorage'

jest.mock('../../utils/offlineStorage', () => ({
  offlineStorage: { getPendingActions: jest.fn() },
  offlineSync: { syncPendingActions: jest.fn() }
}))

function setOnline(value) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

describe('OfflineBanner', () => {
  beforeEach(() => {
    offlineStorage.getPendingActions.mockResolvedValue([])
    offlineSync.syncPendingActions.mockResolvedValue({ synced: 0, failed: 0, total: 0 })
  })

  afterEach(() => {
    jest.clearAllMocks()
    setOnline(true)
  })

  it('renders nothing while online with no pending sync status', () => {
    setOnline(true)
    const { container } = render(<OfflineBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the offline message when offline', async () => {
    setOnline(false)
    render(<OfflineBanner />)

    expect(await screen.findByText('Anda sedang offline')).toBeInTheDocument()
  })

  it('shows the pending item count when there are queued actions', async () => {
    setOnline(false)
    offlineStorage.getPendingActions.mockResolvedValue([{ id: '1' }, { id: '2' }])

    render(<OfflineBanner />)

    expect(await screen.findByText('2 item menunggu sinkronisasi')).toBeInTheDocument()
  })

  it('shows a manual sync button when there are pending items', async () => {
    setOnline(false)
    offlineStorage.getPendingActions.mockResolvedValue([{ id: '1' }])

    render(<OfflineBanner />)

    expect(await screen.findByRole('button', { name: /Sinkronkan/i })).toBeInTheDocument()
  })

  it('clicking the sync button triggers offlineSync and shows the result', async () => {
    setOnline(false)
    offlineStorage.getPendingActions.mockResolvedValue([{ id: '1' }])
    offlineSync.syncPendingActions.mockResolvedValue({ synced: 1, failed: 0, total: 1 })

    const user = userEvent.setup()
    render(<OfflineBanner />)

    const button = await screen.findByRole('button', { name: /Sinkronkan/i })
    await user.click(button)

    expect(offlineSync.syncPendingActions).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/tersinkronisasi/)).toBeInTheDocument()
  })

  it('auto-syncs and stays visible to show the result when coming back online', async () => {
    setOnline(false)
    offlineStorage.getPendingActions.mockResolvedValue([{ id: '1' }])
    offlineSync.syncPendingActions.mockResolvedValue({ synced: 1, failed: 0, total: 1 })

    render(<OfflineBanner />)
    await screen.findByText('Anda sedang offline')

    setOnline(true)
    await act(async () => {
      window.dispatchEvent(new Event('online'))
    })

    expect(offlineSync.syncPendingActions).toHaveBeenCalledTimes(1)
    // The banner should still be visible showing the sync result, not vanish immediately
    await waitFor(() => expect(screen.getByText(/tersinkronisasi/)).toBeInTheDocument())
  })

  it('shows a failure message when sync throws', async () => {
    setOnline(false)
    offlineStorage.getPendingActions.mockResolvedValue([{ id: '1' }])
    offlineSync.syncPendingActions.mockRejectedValue(new Error('network down'))

    const user = userEvent.setup()
    render(<OfflineBanner />)

    const button = await screen.findByRole('button', { name: /Sinkronkan/i })
    await user.click(button)

    expect(await screen.findByText(/Sinkronisasi gagal/)).toBeInTheDocument()
  })
})
