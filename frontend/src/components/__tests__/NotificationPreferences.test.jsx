import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationPreferences } from '../Notifications/NotificationPreferences'
import { usePushNotifications } from '../../utils/pushNotifications'

jest.mock('../../utils/pushNotifications', () => ({
  usePushNotifications: jest.fn()
}))

function mockHook(overrides = {}) {
  usePushNotifications.mockReturnValue({
    isSubscribed: false,
    isLoading: false,
    preferences: null,
    subscribe: jest.fn().mockResolvedValue(undefined),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    updatePreferences: jest.fn().mockResolvedValue(undefined),
    ...overrides
  })
}

describe('NotificationPreferences', () => {
  afterEach(() => jest.clearAllMocks())

  it('shows a loading state while the hook is loading', () => {
    mockHook({ isLoading: true })
    render(<NotificationPreferences userId="user-1" />)
    expect(screen.getByText('Memuat preferensi...')).toBeInTheDocument()
  })

  it('shows disabled status and an Aktifkan button when not subscribed', () => {
    mockHook({ isSubscribed: false })
    render(<NotificationPreferences userId="user-1" />)

    expect(screen.getByText(/Nonaktif/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Aktifkan/ })).toBeInTheDocument()
  })

  it('hides the notification-type checkboxes when not subscribed', () => {
    mockHook({ isSubscribed: false })
    render(<NotificationPreferences userId="user-1" />)
    expect(screen.queryByText('Jenis Notifikasi')).not.toBeInTheDocument()
  })

  it('shows enabled status and preference checkboxes when subscribed', () => {
    mockHook({
      isSubscribed: true,
      preferences: {
        expenseReminders: true,
        budgetAlerts: false,
        billDueNotifications: true,
        goalMilestones: true,
        weeklyReport: false
      }
    })
    render(<NotificationPreferences userId="user-1" />)

    expect(screen.getByText(/^Aktif/)).toBeInTheDocument()
    expect(screen.getByText('Jenis Notifikasi')).toBeInTheDocument()
    expect(screen.getByLabelText(/Peringatan Anggaran/)).not.toBeChecked()
    expect(screen.getByLabelText(/Pengingat Pengeluaran/)).toBeChecked()
  })

  it('clicking Aktifkan calls subscribe() and shows a success message', async () => {
    const subscribe = jest.fn().mockResolvedValue(undefined)
    mockHook({ isSubscribed: false, subscribe })
    const user = userEvent.setup()

    render(<NotificationPreferences userId="user-1" />)
    await user.click(screen.getByRole('button', { name: /Aktifkan/ }))

    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Notifikasi push diaktifkan')).toBeInTheDocument()
  })

  it('clicking Matikan calls unsubscribe() and shows a success message', async () => {
    const unsubscribe = jest.fn().mockResolvedValue(undefined)
    mockHook({ isSubscribed: true, unsubscribe, preferences: {} })
    const user = userEvent.setup()

    render(<NotificationPreferences userId="user-1" />)
    await user.click(screen.getByRole('button', { name: /Matikan/ }))

    expect(unsubscribe).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Notifikasi push dinonaktifkan')).toBeInTheDocument()
  })

  it('shows an error message when toggling the subscription fails', async () => {
    const subscribe = jest.fn().mockRejectedValue(new Error('permission denied'))
    mockHook({ isSubscribed: false, subscribe })
    const user = userEvent.setup()

    render(<NotificationPreferences userId="user-1" />)
    await user.click(screen.getByRole('button', { name: /Aktifkan/ }))

    expect(await screen.findByText('permission denied')).toBeInTheDocument()
  })

  it('toggling a preference checkbox calls updatePreferences with the flipped value', async () => {
    const updatePreferences = jest.fn().mockResolvedValue(undefined)
    mockHook({
      isSubscribed: true,
      updatePreferences,
      preferences: {
        expenseReminders: true,
        budgetAlerts: true,
        billDueNotifications: true,
        goalMilestones: true,
        weeklyReport: false
      }
    })
    const user = userEvent.setup()

    render(<NotificationPreferences userId="user-1" />)
    await user.click(screen.getByLabelText(/Laporan Mingguan/))

    await waitFor(() => {
      expect(updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ weeklyReport: true })
      )
    })
  })

  it('shows an error message when updating a preference fails', async () => {
    const updatePreferences = jest.fn().mockRejectedValue(new Error('save failed'))
    mockHook({
      isSubscribed: true,
      updatePreferences,
      preferences: {
        expenseReminders: true,
        budgetAlerts: true,
        billDueNotifications: true,
        goalMilestones: true,
        weeklyReport: false
      }
    })
    const user = userEvent.setup()

    render(<NotificationPreferences userId="user-1" />)
    await user.click(screen.getByLabelText(/Laporan Mingguan/))

    expect(await screen.findByText('save failed')).toBeInTheDocument()
  })
})
