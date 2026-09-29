/**
 * Push Notifications Manager
 * Handle subscription, notification display, and user preferences
 */

import React from 'react'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class PushNotificationManager {
  constructor() {
    this.subscription = null
    this.vapidPublicKey = VAPID_PUBLIC_KEY
  }

  // A getter (rather than a value frozen in the constructor) so it always
  // reflects the current environment - this module is a singleton created
  // once at import time, so a frozen value would never notice a browser
  // that gains/mocks support afterwards.
  get isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId) {
    try {
      if (!this.isSupported) {
        console.warn('Push notifications not supported')
        return null
      }

      // Request permission first
      const hasPermission = await this.requestPermission()
      if (!hasPermission) {
        console.log('Notification permission denied')
        return null
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        if (!this.vapidPublicKey) {
          console.warn('Cannot subscribe: VITE_VAPID_PUBLIC_KEY is not configured')
          return null
        }

        // Subscribe to push
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        })

        console.log('✅ Subscribed to push notifications:', subscription)
      }

      // Save subscription to server
      await this.saveSubscriptionToServer(subscription, userId)
      this.subscription = subscription

      return subscription
    } catch (error) {
      console.error('❌ Push subscription error:', error)
      throw error
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId) {
    try {
      if (!this.subscription) {
        const registration = await navigator.serviceWorker.ready
        this.subscription = await registration.pushManager.getSubscription()
      }

      if (this.subscription) {
        await this.subscription.unsubscribe()
        await this.removeSubscriptionFromServer(this.subscription, userId)
        this.subscription = null
        console.log('✅ Unsubscribed from push notifications')
      }
    } catch (error) {
      console.error('❌ Unsubscribe error:', error)
      throw error
    }
  }

  /**
   * Check if subscribed
   */
  async isSubscribed() {
    try {
      const registration = await navigator.serviceWorker.ready
      this.subscription = await registration.pushManager.getSubscription()
      return this.subscription !== null
    } catch (error) {
      console.error('Error checking subscription:', error)
      return false
    }
  }

  /**
   * Save subscription endpoint to server
   */
  async saveSubscriptionToServer(subscription, userId) {
    try {
      const response = await fetch(`${API_BASE}/api/push-notifications/subscribe`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to save subscription: ${response.status}`)
      }

      console.log('✅ Subscription saved to server')
      return await response.json()
    } catch (error) {
      console.error('Error saving subscription:', error)
      throw error
    }
  }

  /**
   * Remove subscription from server
   */
  async removeSubscriptionFromServer(subscription, userId) {
    try {
      const response = await fetch(`${API_BASE}/api/push-notifications/unsubscribe`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          endpoint: subscription.endpoint
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to remove subscription: ${response.status}`)
      }

      console.log('✅ Subscription removed from server')
    } catch (error) {
      console.error('Error removing subscription:', error)
      throw error
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId, preferences) {
    try {
      const response = await fetch(`${API_BASE}/api/push-notifications/preferences`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          preferences: {
            expenseReminders: preferences.expenseReminders ?? true,
            budgetAlerts: preferences.budgetAlerts ?? true,
            billDueNotifications: preferences.billDueNotifications ?? true,
            goalMilestones: preferences.goalMilestones ?? true,
            weeklyReport: preferences.weeklyReport ?? false
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.status}`)
      }

      console.log('✅ Notification preferences updated')
      return await response.json()
    } catch (error) {
      console.error('Error updating preferences:', error)
      throw error
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId) {
    try {
      const response = await fetch(`${API_BASE}/api/push-notifications/preferences`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to get preferences: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting preferences:', error)
      return null
    }
  }

  /**
   * Convert VAPID key from base64
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
  }
}

// Singleton instance
export const pushNotifications = new PushNotificationManager()

/**
 * React hook for push notifications
 */
export function usePushNotifications(userId) {
  const [isSubscribed, setIsSubscribed] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [preferences, setPreferences] = React.useState(null)

  React.useEffect(() => {
    checkSubscription()
    loadPreferences()
  }, [userId])

  const checkSubscription = async () => {
    try {
      const subscribed = await pushNotifications.isSubscribed()
      setIsSubscribed(subscribed)
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPreferences = async () => {
    try {
      const prefs = await pushNotifications.getPreferences(userId)
      setPreferences(prefs)
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const subscribe = async () => {
    try {
      setIsLoading(true)
      await pushNotifications.subscribe(userId)
      setIsSubscribed(true)
    } catch (error) {
      console.error('Error subscribing:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    try {
      setIsLoading(true)
      await pushNotifications.unsubscribe(userId)
      setIsSubscribed(false)
    } catch (error) {
      console.error('Error unsubscribing:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = async (newPreferences) => {
    try {
      setIsLoading(true)
      const updated = await pushNotifications.updatePreferences(userId, newPreferences)
      setPreferences(updated)
    } catch (error) {
      console.error('Error updating preferences:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isSubscribed,
    isLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences
  }
}

export default {
  pushNotifications,
  usePushNotifications
}
