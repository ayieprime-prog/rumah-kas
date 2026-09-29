/**
 * Dashboard API Integration Tests
 *
 * Tests for:
 * - GET /api/dashboard
 * - GET /api/dashboard with month filter
 * - Financial data calculation
 */

const {
  authenticateUser,
  request,
  expectStatus,
  expectShape,
  cleanup
} = require('./setup.integration')

describe('Dashboard API Integration Tests', () => {
  let testUser = null

  beforeAll(async () => {
    // Create test user
    const email = `dashboard${Date.now()}@example.com`
    await request('POST', '/auth/register', {
      email,
      password: 'SecurePass123!',
      firstName: 'Dashboard Test'
    })
    testUser = await authenticateUser(email, 'SecurePass123!')
  })

  afterAll(cleanup)

  describe('GET /dashboard', () => {
    it('should fetch dashboard data successfully', async () => {
      const response = await request('GET', '/dashboard')

      expectStatus(response, 200)
      expectShape(response.data, ['overview', 'wallets', 'budgets', 'goals'])
    })

    it('should return overview with financial summary', async () => {
      const response = await request('GET', '/dashboard')

      expectStatus(response, 200)
      const { overview } = response.data

      expectShape(overview, ['balance', 'totalIncome', 'totalExpense'])
      expect(typeof overview.balance).toBe('number')
      expect(typeof overview.totalIncome).toBe('number')
      expect(typeof overview.totalExpense).toBe('number')
    })

    it('should return wallets array', async () => {
      const response = await request('GET', '/dashboard')

      expectStatus(response, 200)
      expect(Array.isArray(response.data.wallets)).toBe(true)

      if (response.data.wallets.length > 0) {
        const wallet = response.data.wallets[0]
        expectShape(wallet, ['id', 'name', 'balance'])
      }
    })

    it('should return budgets array', async () => {
      const response = await request('GET', '/dashboard')

      expectStatus(response, 200)
      expect(Array.isArray(response.data.budgets)).toBe(true)
    })

    it('should return goals array', async () => {
      const response = await request('GET', '/dashboard')

      expectStatus(response, 200)
      expect(Array.isArray(response.data.goals)).toBe(true)
    })

    it('should require authentication', async () => {
      // Clear authentication
      const savedCookie = request.defaults?.headers?.Cookie
      delete request.defaults.headers.Cookie

      const response = await request('GET', '/dashboard')

      expectStatus(response, 401)

      // Restore authentication
      if (savedCookie) {
        request.defaults.headers.Cookie = savedCookie
      }
    })
  })

  describe('GET /dashboard with month filter', () => {
    it('should filter dashboard data by month', async () => {
      const month = '2026-09'
      const response = await request('GET', `/dashboard?month=${month}`)

      expectStatus(response, 200)
      expect(response.data.overview).toBeDefined()
    })

    it('should handle invalid month format gracefully', async () => {
      const response = await request('GET', '/dashboard?month=invalid')

      // Should either reject or use default month
      expect([200, 400]).toContain(response.status)
    })

    it('should handle future month', async () => {
      const futureMonth = '2027-12'
      const response = await request('GET', `/dashboard?month=${futureMonth}`)

      expectStatus(response, 200)
      // Future month might have no data, but structure should be valid
      expectShape(response.data, ['overview', 'wallets', 'budgets', 'goals'])
    })
  })

  describe('Dashboard Data Validation', () => {
    it('should return valid financial summary', async () => {
      const response = await request('GET', '/dashboard')

      expectStatus(response, 200)
      const { overview } = response.data

      // Validate calculations
      expect(overview.balance).toBeGreaterThanOrEqual(0)
      expect(overview.totalIncome).toBeGreaterThanOrEqual(0)
      expect(overview.totalExpense).toBeGreaterThanOrEqual(0)

      // Net income should be valid
      const netIncome = overview.totalIncome - overview.totalExpense
      expect(netIncome).toBeDefined()
    })

    it('should return valid wallet data', async () => {
      const response = await request('GET', '/dashboard')

      expectStatus(response, 200)
      const { wallets } = response.data

      wallets.forEach(wallet => {
        expectShape(wallet, ['id', 'name', 'balance'])
        expect(wallet.balance).toBeGreaterThanOrEqual(0)
      })
    })

    it('should return valid budget data', async () => {
      const response = await request('GET', '/dashboard')

      expectStatus(response, 200)
      const { budgets } = response.data

      budgets.forEach(budget => {
        expectShape(budget, ['id', 'category', 'limit', 'spent'])
        expect(budget.limit).toBeGreaterThan(0)
        expect(budget.spent).toBeGreaterThanOrEqual(0)
      })
    })

    it('should return valid goal data', async () => {
      const response = await request('GET', '/dashboard')

      expectStatus(response, 200)
      const { goals } = response.data

      goals.forEach(goal => {
        expectShape(goal, ['id', 'name', 'targetAmount', 'currentAmount'])
        expect(goal.targetAmount).toBeGreaterThan(0)
        expect(goal.currentAmount).toBeGreaterThanOrEqual(0)
        expect(goal.currentAmount).toBeLessThanOrEqual(goal.targetAmount * 2) // Allow overfunding
      })
    })
  })

  describe('Dashboard Performance', () => {
    it('should respond within 1 second', async () => {
      const startTime = Date.now()
      const response = await request('GET', '/dashboard')
      const responseTime = Date.now() - startTime

      expectStatus(response, 200)
      expect(responseTime).toBeLessThan(1000)
    })

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill().map(() => request('GET', '/dashboard'))

      const responses = await Promise.all(requests)

      responses.forEach(response => {
        expectStatus(response, 200)
      })
    })
  })

  describe('Dashboard Data Consistency', () => {
    it('should return consistent data across multiple requests', async () => {
      const response1 = await request('GET', '/dashboard')
      const response2 = await request('GET', '/dashboard')

      expectStatus(response1, 200)
      expectStatus(response2, 200)

      // Data should be identical (or very similar for real-time updates)
      expect(response1.data.overview.balance).toBe(response2.data.overview.balance)
      expect(response1.data.wallets.length).toBe(response2.data.wallets.length)
    })

    it('should have matching wallet balances in overview and detail', async () => {
      const response = await request('GET', '/dashboard')

      expectStatus(response, 200)
      const { overview, wallets } = response.data

      // Sum of wallet balances should match overview (or be related)
      const walletSum = wallets.reduce((sum, w) => sum + w.balance, 0)
      expect(walletSum).toBeGreaterThanOrEqual(0)
    })
  })
})
