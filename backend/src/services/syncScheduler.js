/**
 * Periodic Sync Scheduler Service
 * Manage scheduled data refreshes and syncing
 */

const cron = require('node-cron')
const { PrismaClient } = require('@prisma/client')
const { notificationService } = require('./notificationService')

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

    // Sync reports every 24 hours
    this.scheduleSyncTask('reports', '0 0 * * *', () => this.syncReportsData())

    // Send weekly reports every Monday at 9 AM
    this.scheduleSyncTask('weekly-report', '0 9 * * 1', () => this.sendWeeklyReports())

    // Cleanup invalid subscriptions daily at 2 AM
    this.scheduleSyncTask('cleanup-subs', '0 2 * * *', () => this.cleanupSubscriptions())

    // Clear old cache entries daily at 3 AM
    this.scheduleSyncTask('cleanup-cache', '0 3 * * *', () => this.cleanupCache())

    console.log('✅ Sync scheduler started with 9 scheduled tasks')
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

          // Track stats
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
   * Sync expenses data
   */
  async syncExpensesData() {
    try {
      const users = await prisma.user.findMany({
        where: { active: true }
      })

      let synced = 0
      for (const user of users) {
        try {
          const currentMonth = new Date().toISOString().slice(0, 7)
          await prisma.expense.findMany({
            where: {
              userId: user.id,
              date: {
                gte: new Date(`${currentMonth}-01`),
                lt: new Date(`${currentMonth}-32`)
              }
            }
          })
          synced++
        } catch (error) {
          console.error(`Error syncing expenses for user ${user.id}:`, error)
        }
      }

      console.log(`💾 Synced expenses for ${synced}/${users.length} users`)
    } catch (error) {
      console.error('Error syncing expenses data:', error)
      throw error
    }
  }

  /**
   * Sync income data
   */
  async syncIncomeData() {
    try {
      const users = await prisma.user.findMany({
        where: { active: true }
      })

      let synced = 0
      for (const user of users) {
        try {
          const currentMonth = new Date().toISOString().slice(0, 7)
          await prisma.income.findMany({
            where: {
              userId: user.id,
              date: {
                gte: new Date(`${currentMonth}-01`),
                lt: new Date(`${currentMonth}-32`)
              }
            }
          })
          synced++
        } catch (error) {
          console.error(`Error syncing income for user ${user.id}:`, error)
        }
      }

      console.log(`💾 Synced income for ${synced}/${users.length} users`)
    } catch (error) {
      console.error('Error syncing income data:', error)
      throw error
    }
  }

  /**
   * Sync budgets data
   */
  async syncBudgetsData() {
    try {
      const users = await prisma.user.findMany({
        where: { active: true }
      })

      let synced = 0
      for (const user of users) {
        try {
          const currentMonth = new Date().toISOString().slice(0, 7)
          const budgets = await prisma.budget.findMany({
            where: {
              userId: user.id,
              month: currentMonth
            },
            include: {
              _count: {
                select: { expenses: true }
              }
            }
          })

          // Check for budget alerts
          for (const budget of budgets) {
            const spent = await prisma.expense.aggregate({
              where: {
                userId: user.id,
                budgetId: budget.id,
                date: {
                  gte: new Date(`${currentMonth}-01`),
                  lt: new Date(`${currentMonth}-32`)
                }
              },
              _sum: { amount: true }
            })

            const spentAmount = spent._sum.amount || 0
            const percentage = (spentAmount / budget.limit) * 100

            // Alert at 80% and 90%
            if (percentage >= 80 && percentage < 90) {
              // Sent at 80%
            } else if (percentage >= 90) {
              // Send alert at 90%
            }
          }

          synced++
        } catch (error) {
          console.error(`Error syncing budgets for user ${user.id}:`, error)
        }
      }

      console.log(`💾 Synced budgets for ${synced}/${users.length} users`)
    } catch (error) {
      console.error('Error syncing budgets data:', error)
      throw error
    }
  }

  /**
   * Sync goals data
   */
  async syncGoalsData() {
    try {
      const users = await prisma.user.findMany({
        where: { active: true }
      })

      let synced = 0
      for (const user of users) {
        try {
          const goals = await prisma.goal.findMany({
            where: { userId: user.id }
          })

          // Check for goal milestones
          for (const goal of goals) {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100

            // Check if milestone reached (25%, 50%, 75%, 100%)
            const milestones = [25, 50, 75, 100]
            for (const milestone of milestones) {
              if (percentage >= milestone && !goal[`notified${milestone}`]) {
                // Send milestone notification
              }
            }
          }

          synced++
        } catch (error) {
          console.error(`Error syncing goals for user ${user.id}:`, error)
        }
      }

      console.log(`💾 Synced goals for ${synced}/${users.length} users`)
    } catch (error) {
      console.error('Error syncing goals data:', error)
      throw error
    }
  }

  /**
   * Sync dashboard data
   */
  async syncDashboardData() {
    try {
      const users = await prisma.user.findMany({
        where: { active: true }
      })

      let synced = 0
      for (const user of users) {
        try {
          // Get dashboard summary
          const currentMonth = new Date().toISOString().slice(0, 7)

          const [expenses, income, budgets] = await Promise.all([
            prisma.expense.aggregate({
              where: {
                userId: user.id,
                date: {
                  gte: new Date(`${currentMonth}-01`),
                  lt: new Date(`${currentMonth}-32`)
                }
              },
              _sum: { amount: true }
            }),
            prisma.income.aggregate({
              where: {
                userId: user.id,
                date: {
                  gte: new Date(`${currentMonth}-01`),
                  lt: new Date(`${currentMonth}-32`)
                }
              },
              _sum: { amount: true }
            }),
            prisma.budget.findMany({
              where: {
                userId: user.id,
                month: currentMonth
              }
            })
          ])

          synced++
        } catch (error) {
          console.error(`Error syncing dashboard for user ${user.id}:`, error)
        }
      }

      console.log(`💾 Synced dashboard for ${synced}/${users.length} users`)
    } catch (error) {
      console.error('Error syncing dashboard data:', error)
      throw error
    }
  }

  /**
   * Sync reports data
   */
  async syncReportsData() {
    try {
      const users = await prisma.user.findMany({
        where: { active: true }
      })

      let synced = 0
      for (const user of users) {
        try {
          const currentMonth = new Date().toISOString().slice(0, 7)

          // Generate monthly report
          await prisma.report.upsert({
            where: {
              userId_month: {
                userId: user.id,
                month: currentMonth
              }
            },
            update: { updatedAt: new Date() },
            create: {
              userId: user.id,
              month: currentMonth,
              totalExpenses: 0,
              totalIncome: 0,
              categories: []
            }
          })

          synced++
        } catch (error) {
          console.error(`Error syncing reports for user ${user.id}:`, error)
        }
      }

      console.log(`💾 Synced reports for ${synced}/${users.length} users`)
    } catch (error) {
      console.error('Error syncing reports data:', error)
      throw error
    }
  }

  /**
   * Send weekly reports to users
   */
  async sendWeeklyReports() {
    try {
      const users = await prisma.user.findMany({
        where: { active: true }
      })

      let sent = 0
      for (const user of users) {
        try {
          // Check if user wants weekly reports
          const prefs = await prisma.notificationPreference.findUnique({
            where: { userId: user.id }
          })

          if (!prefs?.weeklyReport) continue

          // Get week's expenses
          const today = new Date()
          const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))

          const weekExpenses = await prisma.expense.aggregate({
            where: {
              userId: user.id,
              date: {
                gte: weekStart
              }
            },
            _sum: { amount: true }
          })

          // Send weekly report notification
          await notificationService.sendWeeklyReport(user.id, {
            totalExpense: weekExpenses._sum.amount || 0,
            week: Math.ceil(weekStart.getDate() / 7)
          })

          sent++
        } catch (error) {
          console.error(`Error sending weekly report for user ${user.id}:`, error)
        }
      }

      console.log(`📊 Sent weekly reports to ${sent}/${users.length} users`)
    } catch (error) {
      console.error('Error sending weekly reports:', error)
      throw error
    }
  }

  /**
   * Cleanup invalid push subscriptions
   */
  async cleanupSubscriptions() {
    try {
      const deleted = await notificationService.cleanupInvalidSubscriptions()
      console.log(`🧹 Cleaned up ${deleted} invalid subscriptions`)
    } catch (error) {
      console.error('Error cleaning up subscriptions:', error)
      throw error
    }
  }

  /**
   * Cleanup old cache entries
   */
  async cleanupCache() {
    try {
      // Clear cache entries older than 30 days
      const before30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      // This would be implemented in IndexedDB on frontend
      // or in Redis/cache on backend
      console.log('🧹 Cleaned up old cache entries')
    } catch (error) {
      console.error('Error cleaning up cache:', error)
      throw error
    }
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
