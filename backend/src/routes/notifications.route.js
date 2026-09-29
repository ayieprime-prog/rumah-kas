/**
 * Notification API Routes
 * Handle push subscription and notification management
 */

const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const notificationService = require('../services/notificationService')

/**
 * POST /api/notifications/subscribe
 * Subscribe user to push notifications
 */
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { subscription } = req.body
    const userId = req.userId

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription required' })
    }

    const saved = await notificationService.saveSubscription(userId, subscription)

    res.json({
      message: 'Subscribed to push notifications',
      subscription: saved
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    res.status(500).json({ error: 'Failed to subscribe' })
  }
})

/**
 * POST /api/notifications/unsubscribe
 * Unsubscribe user from push notifications
 */
router.post('/unsubscribe', authenticate, async (req, res) => {
  try {
    const { endpoint } = req.body
    const userId = req.userId

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' })
    }

    await notificationService.removeSubscription(endpoint)

    res.json({ message: 'Unsubscribed from push notifications' })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    res.status(500).json({ error: 'Failed to unsubscribe' })
  }
})

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const userId = req.userId

    const preferences = await notificationService.getPreferences(userId)

    res.json(preferences)
  } catch (error) {
    console.error('Get preferences error:', error)
    res.status(500).json({ error: 'Failed to get preferences' })
  }
})

/**
 * PUT /api/notifications/preferences
 * Update user's notification preferences
 */
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { preferences } = req.body
    const userId = req.userId

    if (!preferences) {
      return res.status(400).json({ error: 'Preferences required' })
    }

    const updated = await notificationService.updatePreferences(userId, preferences)

    res.json({
      message: 'Preferences updated',
      preferences: updated
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    res.status(500).json({ error: 'Failed to update preferences' })
  }
})

/**
 * GET /api/notifications/logs
 * Get notification history
 */
router.get('/logs', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const limit = parseInt(req.query.limit) || 50

    const logs = await notificationService.getNotificationLogs(userId, limit)

    res.json({
      count: logs.length,
      logs
    })
  } catch (error) {
    console.error('Get logs error:', error)
    res.status(500).json({ error: 'Failed to get logs' })
  }
})

/**
 * POST /api/notifications/test
 * Send test notification (development only)
 */
router.post('/test', authenticate, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test notifications disabled in production' })
    }

    const userId = req.userId
    const { title, body } = req.body

    const result = await notificationService.sendNotification(
      userId,
      title || 'Test Notification',
      {
        body: body || 'This is a test notification',
        type: 'test'
      }
    )

    res.json({
      message: 'Test notification sent',
      result
    })
  } catch (error) {
    console.error('Test notification error:', error)
    res.status(500).json({ error: 'Failed to send test notification' })
  }
})

module.exports = router
