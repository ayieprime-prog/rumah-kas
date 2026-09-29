/**
 * Periodic Sync Scheduler Service
 * Manage scheduled data refreshes and syncing
 *
 * Data model note: Expense/Budget/Goal/Income are scoped to Household
 * (not User) in this app's schema. Push notification preferences and
 * subscriptions are scoped to User, since each household member can opt
 * in/out independently. Tasks below reflect that split.
 */

const cron = require('node-cron')
const { PrismaClient } = require('@prisma/client')
const notificationService = require('./notificationService')

const prisma = new PrismaClient()

class SyncScheduler {
  constructor() {
    this.tasks = new Map()
    this.syncStats = new Map()
  }

  /**
   * Start all scheduled syncs
   */
  start() {
    console.log('🕐 Starting sync scheduler...')

    // Sync expenses data every 30 minutes
    this.scheduleSyncTask('expenses', '*/30 * * * *', () => this.syncExpensesData())

    // Sync income data every hour
    this.scheduleSyncTask('income', '0 * * * *', () => this.syncIncomeData())

    // Sync budgets every hour
    this.scheduleSyncTask('budgets', '0 * * * *', () => this.syncBudgetsData())

    // Sync goals every 6 hours
    this.scheduleSyncTask('goals', '0 */6 * * *', () => this.syncGoalsData())

    // Sync dashboard every 15 minutes
    this.scheduleSyncTask('dashboard', '*/15 * * * *', () => this.syncDashboardData())

    // Send weekly reports every Monday at 9 AM
    this.scheduleSyncTask('weekly-report', '0 9 * * 1', () => this.sendWeeklyReports())

    // Cleanup invalid subscriptions daily at 2 AM
    this.scheduleSyncTask('cleanup-subs', '0 2 * * *', () => this.cleanupSubscriptions())

    console.log(`✅ Sync scheduler started with ${this.tasks.size} scheduled tasks`)
  }

  /**
   * Schedule a sync task
   */
  scheduleSyncTask(name, cronExpression, taskFn) {
    try {
      const task = cron.schedule(cronExpression, async () => {
        const startTime = Date.now()
        console.log(`⏱️ Starting sync task: ${name}`)

        try {
          await taskFn()
          const duration = Date.now() - startTime
          console.log(`✅ Completed sync task: ${name} (${duration}ms)`)

          this.recordSyncStat(name, {
            status: 'success',
            duration,
            timestamp: new Date()
          })
        } catch (error) {
          const duration = Date.now() - startTime
          console.error(`❌ Failed sync task: ${name}`, error)

          this.recordSyncStat(name, {
            status: 'error',
            duration,
            error: error.message,
            timestamp: new Date()
          })
        }
      })

      this.tasks.set(name, task)
    } catch (error) {
      console.error(`Error scheduling task ${name}:`, error)
    }
  }

  /**
   * Current month boundaries as Date objects (avoids invalid dates like "2024-02-32")
   */
  getCurrentMonthRange() {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return { start, end }
  }

  /**
   * Sync expenses data (consistency scan, household-scoped)
   */
  async syncExpensesData() {
    const households = await prisma.household.findMany({ select: { id: true } })
    const { start, end } = this.getCurrentMonthRange()

    let synced = 0
    for (const household of households) {
      try {
        await prisma.expense.findMany({
          where: {
            householdId: household.id,
            date: { gte: start, lt: end }
          }
        })
        synced++
      } catch (error) {
        console.error(`Error syncing expenses for household ${household.id}:`, error)
      }
    }

    console.log(`💾 Synced expenses for ${synced}/${households.length} households`)
  }

  /**
   * Sync income data (consistency scan, household-scoped)
   */
  async syncIncomeData() {
    const households = await prisma.household.findMany({ select: { id: true } })
    const { start, end } = this.getCurrentMonthRange()

    let synced = 0
    for (const household of households) {
      try {
        await prisma.income.findMany({
          where: {
            householdId: household.id,
            date: { gte: start, lt: end }
          }
        })
        synced++
      } catch (error) {
        console.error(`Error syncing income for household ${household.id}:`, error)
      }
    }

    console.log(`💾 Synced income for ${synced}/${households.length} households`)
  }

  /**
   * Sync budgets and send alerts at 80%/90%/100% usage
   *
   * Known limitation: there's no persisted "already notified" flag on
   * Budget, so an alert can repeat on subsequent hourly runs while the
   * budget stays over threshold. Fine for now, but worth revisiting
   * (e.g. a notifiedAt column) if it turns out to be noisy in practice.
   */
  async syncBudgetsData() {
    const { start, end } = this.getCurrentMonthRange()
    const currentMonth = start.toISOString().slice(0, 7)

    const households = await prisma.household.findMany({
      include: { users: true }
    })

    let synced = 0
    for (const household of households) {
      try {
        const budgets = await prisma.budget.findMany({
          where: {
            householdId: household.id,
            month: currentMonth
          },
          include: { category: true }
        })

        for (const budget of budgets) {
          if (!budget.limit) continue
          const percentage = (budget.spent / budget.limit) * 100

          if (percentage >= 80) {
            for (const user of household.users) {
              await notificationService.sendBudgetAlert(user.id, {
                category: budget.category?.name || 'Anggaran',
                spent: budget.spent,
                limit: budget.limit
              })
            }
          }
        }

        synced++
      } catch (error) {
        console.error(`Error syncing budgets for household ${household.id}:`, error)
      }
    }

    console.log(`💾 Synced budgets for ${synced}/${households.length} households`)
  }

  /**
   * Sync goals and send milestone notifications
   *
   * Known limitation: same as budgets, no persisted "already notified"
   * flag per milestone, so this can re-fire on later runs.
   */
  async syncGoalsData() {
    const households = await prisma.household.findMany({
      include: { users: true }
    })

    let synced = 0
    for (const household of households) {
      try {
        const goals = await prisma.goal.findMany({
          where: { householdId: household.id }
        })

        for (const goal of goals) {
          if (!goal.targetAmount) continue
          const percentage = (goal.currentAmount / goal.targetAmount) * 100

          const reachedMilestone = [100, 75, 50, 25].find(m => percentage >= m)
          if (reachedMilestone) {
            for (const user of household.users) {
              await notificationService.sendGoalMilestone(user.id, {
                name: goal.name,
                current: goal.currentAmount,
                target: goal.targetAmount
              })
            }
          }
        }

        synced++
      } catch (error) {
        console.error(`Error syncing goals for household ${household.id}:`, error)
      }
    }

    console.log(`💾 Synced goals for ${synced}/${households.length} households`)
  }

  /**
   * Sync dashboard summary data (consistency scan, household-scoped)
   */
  async syncDashboardData() {
    const households = await prisma.household.findMany({ select: { id: true } })
    const { start, end } = this.getCurrentMonthRange()
    const currentMonth = start.toISOString().slice(0, 7)

    let synced = 0
    for (const household of households) {
      try {
        await Promise.all([
          prisma.expense.aggregate({
            where: { householdId: household.id, date: { gte: start, lt: end } },
            _sum: { amount: true }
          }),
          prisma.income.aggregate({
            where: { householdId: household.id, date: { gte: start, lt: end } },
            _sum: { amount: true }
          }),
          prisma.budget.findMany({
            where: { householdId: household.id, month: currentMonth }
          })
        ])
        synced++
      } catch (error) {
        console.error(`Error syncing dashboard for household ${household.id}:`, error)
      }
    }

    console.log(`💾 Synced dashboard for ${synced}/${households.length} households`)
  }

  /**
   * Send weekly reports to users who opted in
   */
  async sendWeeklyReports() {
    const households = await prisma.household.findMany({
      include: { users: true }
    })

    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    weekStart.setHours(0, 0, 0, 0)

    let sent = 0
    let totalUsers = 0

    for (const household of households) {
      const weekExpenses = await prisma.expense.aggregate({
        where: {
          householdId: household.id,
          date: { gte: weekStart }
        },
        _sum: { amount: true }
      })

      for (const user of household.users) {
        totalUsers++
        try {
          const prefs = await notificationService.getPreferences(user.id)
          if (!prefs?.weeklyReport) continue

          await notificationService.sendWeeklyReport(user.id, {
            totalExpense: weekExpenses._sum.amount || 0,
            week: Math.ceil(weekStart.getDate() / 7)
          })

          sent++
        } catch (error) {
          console.error(`Error sending weekly report for user ${user.id}:`, error)
        }
      }
    }

    console.log(`📊 Sent weekly reports to ${sent}/${totalUsers} users`)
  }

  /**
   * Cleanup invalid push subscriptions
   */
  async cleanupSubscriptions() {
    const deleted = await notificationService.cleanupInvalidSubscriptions()
    console.log(`🧹 Cleaned up ${deleted} invalid subscriptions`)
  }

  /**
   * Record sync statistics
   */
  recordSyncStat(taskName, stat) {
    if (!this.syncStats.has(taskName)) {
      this.syncStats.set(taskName, [])
    }

    const stats = this.syncStats.get(taskName)
    stats.push(stat)

    // Keep only last 100 entries
    if (stats.length > 100) {
      stats.shift()
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStats(taskName) {
    if (taskName) {
      return this.syncStats.get(taskName) || []
    }

    const allStats = {}
    this.syncStats.forEach((stats, name) => {
      allStats[name] = stats
    })
    return allStats
  }

  /**
   * Stop all sync tasks
   */
  stop() {
    this.tasks.forEach((task, name) => {
      task.stop()
      console.log(`⏹️ Stopped sync task: ${name}`)
    })
    this.tasks.clear()
    console.log('✅ Sync scheduler stopped')
  }
}

// Singleton instance
const syncScheduler = new SyncScheduler()

module.exports = syncScheduler
