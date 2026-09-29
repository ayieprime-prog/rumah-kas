/**
 * Push Notification Service
 * Handle sending push notifications to users
 */

const webpush = require('web-push')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@rumahkas.app',
    vapidPublicKey,
    vapidPrivateKey
  )
}

class NotificationService {
  /**
   * Send push notification to user
   */
  async sendNotification(userId, title, options = {}) {
    try {
      // Get user subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId,
          active: true
        }
      })

      if (subscriptions.length === 0) {
        console.log(`No active subscriptions for user ${userId}`)
        return { sent: 0, failed: 0 }
      }

      // Check user preferences
      const preferences = await this.getPreferences(userId)
      if (!this.shouldSendNotification(options.type, preferences)) {
        console.log(`Notification type ${options.type} disabled for user ${userId}`)
        return { sent: 0, failed: 0 }
      }

      const payload = JSON.stringify({
        title,
        body: options.body || '',
        icon: options.icon || '/logo-192.png',
        badge: options.badge || '/logo-192.png',
        tag: options.tag || 'rumahkas-notification',
        data: options.data || {},
        actions: options.actions || []
      })

      let sent = 0
      let failed = 0

      // Send to all subscriptions
      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            JSON.parse(subscription.subscription),
            payload
          )
          sent++
          console.log(`✅ Notification sent to ${subscription.endpoint}`)
        } catch (error) {
          failed++
          console.error(`❌ Failed to send notification: ${error.message}`)

          // If subscription is invalid, mark as inactive
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.update({
              where: { id: subscription.id },
              data: { active: false }
            })
          }
        }
      }

      // Log notification
      await prisma.notificationLog.create({
        data: {
          userId,
          title,
          body: options.body || '',
          type: options.type || 'general',
          sent,
          failed,
          subscriptionCount: subscriptions.length
        }
      })

      return { sent, failed, total: subscriptions.length }
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  /**
   * Send expense reminder
   */
  async sendExpenseReminder(userId, expenseData) {
    const title = '💰 Pencatat Pengeluaran'
    const options = {
      type: 'expenseReminder',
      body: `Jangan lupa catat pengeluaran ${expenseData.category}: Rp ${expenseData.amount.toLocaleString('id-ID')}`,
      data: {
        action: 'open-expense',
        expenseId: expenseData.id
      },
      actions: [
        {
          action: 'open-expense',
          title: 'Catat',
          icon: '/icon-check.png'
        },
        {
          action: 'dismiss',
          title: 'Nanti',
          icon: '/icon-close.png'
        }
      ]
    }

    return this.sendNotification(userId, title, options)
  }

  /**
   * Send budget alert
   */
  async sendBudgetAlert(userId, budgetData) {
    const percentUsed = Math.round((budgetData.spent / budgetData.limit) * 100)
    const title = '⚠️ Peringatan Anggaran'
    const options = {
      type: 'budgetAlert',
      body: `Anggaran ${budgetData.category} sudah digunakan ${percentUsed}% dari Rp ${budgetData.limit.toLocaleString('id-ID')}`,
      data: {
        action: 'open-budget',
        budgetId: budgetData.id
      },
      actions: [
        {
          action: 'open-budget',
          title: 'Lihat',
          icon: '/icon-eye.png'
        }
      ]
    }

    return this.sendNotification(userId, title, options)
  }

  /**
   * Send bill due notification
   */
  async sendBillDueNotification(userId, billData) {
    const daysUntilDue = Math.ceil(
      (new Date(billData.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
    )

    let title = ''
    let bodyText = ''

    if (daysUntilDue <= 0) {
      title = '🔔 Tagihan Sudah Jatuh Tempo'
      bodyText = `${billData.name}: Rp ${billData.amount.toLocaleString('id-ID')} sudah jatuh tempo`
    } else if (daysUntilDue === 1) {
      title = '🔔 Tagihan Jatuh Tempo Besok'
      bodyText = `${billData.name}: Rp ${billData.amount.toLocaleString('id-ID')}`
    } else {
      title = '🔔 Pengingat Tagihan'
      bodyText = `${billData.name} jatuh tempo dalam ${daysUntilDue} hari`
    }

    const options = {
      type: 'billDueNotification',
      body: bodyText,
      data: {
        action: 'open-debt',
        billId: billData.id
      },
      actions: [
        {
          action: 'open-debt',
          title: 'Bayar',
          icon: '/icon-payment.png'
        }
      ]
    }

    return this.sendNotification(userId, title, options)
  }

  /**
   * Send goal milestone notification
   */
  async sendGoalMilestone(userId, goalData) {
    const percentComplete = Math.round((goalData.current / goalData.target) * 100)
    const title = '🎯 Milestone Tercapai'
    const options = {
      type: 'goalMilestone',
      body: `Target ${goalData.name} sudah tercapai ${percentComplete}%!`,
      data: {
        action: 'open-goals',
        goalId: goalData.id
      },
      actions: [
        {
          action: 'open-goals',
          title: 'Lihat',
          icon: '/icon-celebrate.png'
        }
      ]
    }

    return this.sendNotification(userId, title, options)
  }

  /**
   * Send weekly report
   */
  async sendWeeklyReport(userId, reportData) {
    const title = '📊 Laporan Keuangan Mingguan'
    const options = {
      type: 'weeklyReport',
      body: `Total pengeluaran minggu ini: Rp ${reportData.totalExpense.toLocaleString('id-ID')}`,
      data: {
        action: 'open-reports',
        week: reportData.week
      },
      actions: [
        {
          action: 'open-reports',
          title: 'Lihat Laporan',
          icon: '/icon-chart.png'
        }
      ]
    }

    return this.sendNotification(userId, title, options)
  }

  /**
   * Save push subscription
   */
  async saveSubscription(userId, subscription) {
    try {
      // Check if subscription already exists
      const existing = await prisma.pushSubscription.findUnique({
        where: {
          endpoint: subscription.endpoint
        }
      })

      if (existing) {
        // Update existing
        await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            subscription: JSON.stringify(subscription),
            active: true,
            updatedAt: new Date()
          }
        })
        return existing
      }

      // Create new
      const saved = await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          subscription: JSON.stringify(subscription),
          active: true
        }
      })

      console.log(`✅ Subscription saved for user ${userId}`)
      return saved
    } catch (error) {
      console.error('Error saving subscription:', error)
      throw error
    }
  }

  /**
   * Remove push subscription
   */
  async removeSubscription(endpoint, userId) {
    try {
      const result = await prisma.pushSubscription.updateMany({
        where: { endpoint, userId },
        data: { active: false }
      })

      if (result.count === 0) {
        const notFoundError = new Error('Subscription not found')
        notFoundError.statusCode = 404
        throw notFoundError
      }

      console.log(`✅ Subscription removed: ${endpoint}`)
    } catch (error) {
      console.error('Error removing subscription:', error)
      throw error
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId) {
    try {
      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId }
      })

      if (!preferences) {
        // Create default preferences
        preferences = await prisma.notificationPreference.create({
          data: {
            userId,
            expenseReminders: true,
            budgetAlerts: true,
            billDueNotifications: true,
            goalMilestones: true,
            weeklyReport: false
          }
        })
      }

      return preferences
    } catch (error) {
      console.error('Error getting preferences:', error)
      return null
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId, preferences) {
    try {
      const updated = await prisma.notificationPreference.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          ...preferences
        }
      })

      console.log(`✅ Preferences updated for user ${userId}`)
      return updated
    } catch (error) {
      console.error('Error updating preferences:', error)
      throw error
    }
  }

  /**
   * Check if notification type should be sent
   */
  shouldSendNotification(type, preferences) {
    if (!preferences) return true

    const typeMap = {
      expenseReminder: 'expenseReminders',
      budgetAlert: 'budgetAlerts',
      billDueNotification: 'billDueNotifications',
      goalMilestone: 'goalMilestones',
      weeklyReport: 'weeklyReport'
    }

    const prefKey = typeMap[type]
    return prefKey ? preferences[prefKey] !== false : true
  }

  /**
   * Get notification logs
   */
  async getNotificationLogs(userId, limit = 50) {
    try {
      return await prisma.notificationLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      console.error('Error getting logs:', error)
      return []
    }
  }

  /**
   * Clear expired invalid subscriptions
   */
  async cleanupInvalidSubscriptions() {
    try {
      const result = await prisma.pushSubscription.deleteMany({
        where: {
          active: false,
          updatedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
          }
        }
      })

      console.log(`🧹 Cleaned up ${result.count} invalid subscriptions`)
      return result.count
    } catch (error) {
      console.error('Error cleaning up subscriptions:', error)
      return 0
    }
  }
}

// Singleton instance
const notificationService = new NotificationService()

module.exports = notificationService
