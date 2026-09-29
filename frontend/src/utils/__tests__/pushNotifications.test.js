import { renderHook, act, waitFor } from '@testing-library/react'
import { pushNotifications, usePushNotifications } from '../pushNotifications'

function mockPushManager({ existingSubscription = null, newSubscription } = {}) {
  return {
    getSubscription: jest.fn().mockResolvedValue(existingSubscription),
    subscribe: jest.fn().mockResolvedValue(
      newSubscription || {
        endpoint: 'https://push.example/abc',
        toJSON: () => ({ endpoint: 'https://push.example/abc', keys: {} })
      }
    )
  }
}

function setServiceWorkerSupport({ supported = true, pushManager } = {}) {
  if (supported) {
    Object.defineProperty(window, 'PushManager', {
      value: function PushManager() {},
      configurable: true
    })
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: pushManager || mockPushManager() }) },
      configurable: true
    })
  } else {
    delete window.PushManager
    Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true })
  }
}

describe('PushNotificationManager', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) })
    global.Notification = {
      permission: 'default',
      requestPermission: jest.fn().mockResolvedValue('granted')
    }
    pushNotifications.subscription = null
    pushNotifications.vapidPublicKey = 'dGVzdC12YXBpZC1rZXk' // arbitrary base64url test value
    setServiceWorkerSupport({ supported: true })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('isSupported', () => {
    it('is true when serviceWorker and PushManager are available', () => {
      expect(pushNotifications.isSupported).toBe(true)
    })

    it('is false when the browser lacks PushManager', () => {
      setServiceWorkerSupport({ supported: false })
      expect(pushNotifications.isSupported).toBe(false)
    })
  })

  describe('requestPermission', () => {
    it('returns false without prompting when unsupported', async () => {
      setServiceWorkerSupport({ supported: false })
      const result = await pushNotifications.requestPermission()
      expect(result).toBe(false)
      expect(global.Notification.requestPermission).not.toHaveBeenCalled()
    })

    it('returns true immediately when permission is already granted', async () => {
      global.Notification.permission = 'granted'
      const result = await pushNotifications.requestPermission()
      expect(result).toBe(true)
      expect(global.Notification.requestPermission).not.toHaveBeenCalled()
    })

    it('returns false immediately when permission is denied', async () => {
      global.Notification.permission = 'denied'
      const result = await pushNotifications.requestPermission()
      expect(result).toBe(false)
      expect(global.Notification.requestPermission).not.toHaveBeenCalled()
    })

    it('prompts the user when permission is in the default state', async () => {
      global.Notification.permission = 'default'
      const result = await pushNotifications.requestPermission()
      expect(global.Notification.requestPermission).toHaveBeenCalledTimes(1)
      expect(result).toBe(true)
    })
  })

  describe('subscribe', () => {
    it('returns null and skips permission entirely when unsupported', async () => {
      setServiceWorkerSupport({ supported: false })
      const result = await pushNotifications.subscribe('user-1')
      expect(result).toBeNull()
    })

    it('returns null without subscribing when permission is denied', async () => {
      global.Notification.permission = 'denied'
      const result = await pushNotifications.subscribe('user-1')
      expect(result).toBeNull()
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns null without crashing when no VAPID key is configured', async () => {
      global.Notification.permission = 'granted'
      pushNotifications.vapidPublicKey = undefined

      const result = await pushNotifications.subscribe('user-1')

      expect(result).toBeNull()
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('reuses an existing subscription instead of creating a new one', async () => {
      global.Notification.permission = 'granted'
      const existing = {
        endpoint: 'https://push.example/existing',
        toJSON: () => ({ endpoint: 'https://push.example/existing' })
      }
      const pushManager = mockPushManager({ existingSubscription: existing })
      setServiceWorkerSupport({ supported: true, pushManager })

      const result = await pushNotifications.subscribe('user-1')

      expect(pushManager.subscribe).not.toHaveBeenCalled()
      expect(result).toBe(existing)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/push-notifications/subscribe'),
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      )
    })

    it('creates a new subscription and posts it to the server when none exists', async () => {
      global.Notification.permission = 'granted'

      const result = await pushNotifications.subscribe('user-42')

      expect(result.endpoint).toBe('https://push.example/abc')
      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = global.fetch.mock.calls[0]
      expect(url).toContain('/api/push-notifications/subscribe')
      expect(options.credentials).toBe('include')
      expect(options.headers?.Authorization).toBeUndefined()
      expect(JSON.parse(options.body)).toEqual({
        userId: 'user-42',
        subscription: { endpoint: 'https://push.example/abc', keys: {} }
      })
    })
  })

  describe('unsubscribe', () => {
    it('unsubscribes the current subscription and notifies the server', async () => {
      global.Notification.permission = 'granted'
      await pushNotifications.subscribe('user-1')
      global.fetch.mockClear()

      const currentSub = pushNotifications.subscription
      currentSub.unsubscribe = jest.fn().mockResolvedValue(true)

      await pushNotifications.unsubscribe('user-1')

      expect(currentSub.unsubscribe).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/push-notifications/unsubscribe'),
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      )
      expect(pushNotifications.subscription).toBeNull()
    })

    it('does nothing when there is no subscription to remove', async () => {
      const pushManager = mockPushManager({ existingSubscription: null })
      setServiceWorkerSupport({ supported: true, pushManager })

      await pushNotifications.unsubscribe('user-1')

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('isSubscribed', () => {
    it('returns true when a subscription exists', async () => {
      const pushManager = mockPushManager({ existingSubscription: { endpoint: 'x' } })
      setServiceWorkerSupport({ supported: true, pushManager })

      expect(await pushNotifications.isSubscribed()).toBe(true)
    })

    it('returns false when there is no subscription', async () => {
      expect(await pushNotifications.isSubscribed()).toBe(false)
    })

    it('returns false instead of throwing if serviceWorker.ready rejects', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { ready: Promise.reject(new Error('no SW')) },
        configurable: true
      })

      await expect(pushNotifications.isSubscribed()).resolves.toBe(false)
    })
  })

  describe('getPreferences / updatePreferences', () => {
    it('fetches preferences with credentials included, no Authorization header', async () => {
      global.fetch.mockResolvedValue({ ok: true, json: async () => ({ budgetAlerts: true }) })

      const prefs = await pushNotifications.getPreferences('user-1')

      expect(prefs).toEqual({ budgetAlerts: true })
      const [url, options] = global.fetch.mock.calls[0]
      expect(url).toContain('/api/push-notifications/preferences')
      expect(options.credentials).toBe('include')
      expect(options.headers).toBeUndefined()
    })

    it('returns null instead of throwing when the preferences request fails', async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 401 })

      const prefs = await pushNotifications.getPreferences('user-1')

      expect(prefs).toBeNull()
    })

    it('sends a PUT with defaulted preference fields', async () => {
      global.fetch.mockResolvedValue({ ok: true, json: async () => ({ weeklyReport: true }) })

      await pushNotifications.updatePreferences('user-1', { weeklyReport: true })

      const [url, options] = global.fetch.mock.calls[0]
      expect(url).toContain('/api/push-notifications/preferences')
      expect(options.method).toBe('PUT')
      expect(JSON.parse(options.body).preferences).toEqual({
        expenseReminders: true,
        budgetAlerts: true,
        billDueNotifications: true,
        goalMilestones: true,
        weeklyReport: true
      })
    })
  })

  describe('urlBase64ToUint8Array', () => {
    it('decodes a base64url VAPID key into a Uint8Array', () => {
      // "hi" base64url-encoded (no padding)
      const result = pushNotifications.urlBase64ToUint8Array('aGk')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual([104, 105]) // 'h', 'i'
    })
  })
})

describe('usePushNotifications hook', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    global.Notification = { permission: 'granted', requestPermission: jest.fn().mockResolvedValue('granted') }
    pushNotifications.subscription = null
    pushNotifications.vapidPublicKey = 'dGVzdC12YXBpZC1rZXk'
  })

  it('loads initial subscription + preferences state', async () => {
    setServiceWorkerSupport({
      supported: true,
      pushManager: mockPushManager({ existingSubscription: { endpoint: 'x' } })
    })

    const { result } = renderHook(() => usePushNotifications('user-1'))

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isSubscribed).toBe(true)
  })

  it('subscribe() flips isSubscribed to true', async () => {
    setServiceWorkerSupport({
      supported: true,
      pushManager: mockPushManager({ existingSubscription: null })
    })

    const { result } = renderHook(() => usePushNotifications('user-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.subscribe()
    })

    expect(result.current.isSubscribed).toBe(true)
  })
})
