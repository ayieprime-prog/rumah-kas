import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { usePushNotifications } from '../../utils/pushNotifications'

/**
 * `userId` is passed in as a prop rather than pulled from a global auth
 * context, since this project has no such context yet.
 */
export function NotificationPreferences({ userId }) {
  const { isSubscribed, isLoading, preferences, subscribe, unsubscribe, updatePreferences } = usePushNotifications(userId)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [localPrefs, setLocalPrefs] = useState({
    expenseReminders: true,
    budgetAlerts: true,
    billDueNotifications: true,
    goalMilestones: true,
    weeklyReport: false
  })

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        expenseReminders: preferences.expenseReminders ?? true,
        budgetAlerts: preferences.budgetAlerts ?? true,
        billDueNotifications: preferences.billDueNotifications ?? true,
        goalMilestones: preferences.goalMilestones ?? true,
        weeklyReport: preferences.weeklyReport ?? false
      })
    }
  }, [preferences])

  const handleToggleSubscription = async () => {
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      if (isSubscribed) {
        await unsubscribe()
        setSuccess('Unsubscribed from push notifications')
      } else {
        await subscribe()
        setSuccess('Subscribed to push notifications')
      }
    } catch (err) {
      setError(err.message || 'Failed to update subscription')
      console.error('Subscription error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreferenceChange = async (key) => {
    const updated = {
      ...localPrefs,
      [key]: !localPrefs[key]
    }
    setLocalPrefs(updated)

    setError(null)
    setIsSaving(true)

    try {
      await updatePreferences(updated)
      setSuccess('Preferences updated')
    } catch (err) {
      setError(err.message || 'Failed to update preferences')
      setLocalPrefs(preferences)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Push Notifications
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isSubscribed
                ? '✅ Enabled - You will receive notifications'
                : '❌ Disabled - Notifications are turned off'
              }
            </p>
          </div>
          <button
            onClick={handleToggleSubscription}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isSubscribed
                ? 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-800'
                : 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSubscribed ? (
              <>
                <BellOff className="w-4 h-4" />
                Disable
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Enable
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded text-sm text-green-700 dark:text-green-200">
            {success}
          </div>
        )}
      </div>

      {/* Notification Type Preferences */}
      {isSubscribed && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notification Types
          </h3>

          <div className="space-y-4">
            {/* Expense Reminders */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={localPrefs.expenseReminders}
                onChange={() => handlePreferenceChange('expenseReminders')}
                disabled={isSaving}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Expense Reminders</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get reminders to log your expenses
                </p>
              </div>
            </label>

            {/* Budget Alerts */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={localPrefs.budgetAlerts}
                onChange={() => handlePreferenceChange('budgetAlerts')}
                disabled={isSaving}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Budget Alerts</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Alert when budget reaches 80% or more
                </p>
              </div>
            </label>

            {/* Bill Due Notifications */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={localPrefs.billDueNotifications}
                onChange={() => handlePreferenceChange('billDueNotifications')}
                disabled={isSaving}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Bill Due Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reminder when bills are due
                </p>
              </div>
            </label>

            {/* Goal Milestones */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={localPrefs.goalMilestones}
                onChange={() => handlePreferenceChange('goalMilestones')}
                disabled={isSaving}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Goal Milestones</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Celebrate when you reach goal milestones
                </p>
              </div>
            </label>

            {/* Weekly Report */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={localPrefs.weeklyReport}
                onChange={() => handlePreferenceChange('weeklyReport')}
                disabled={isSaving}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Weekly Report</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Weekly financial summary every Monday
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Tip:</strong> Enable notifications to stay on top of your finances. You can customize which notifications you receive in the settings above.
        </p>
      </div>
    </div>
  )
}

export default NotificationPreferences
