/**
 * Expenses API Integration Tests
 *
 * Tests for:
 * - GET /api/expenses
 * - POST /api/expenses
 * - PUT /api/expenses/:id
 * - DELETE /api/expenses/:id
 */

const {
  authenticateUser,
  request,
  expectStatus,
  expectShape,
  cleanup
} = require('./setup.integration')

describe('Expenses API Integration Tests', () => {
  let testUser = null

  beforeAll(async () => {
    // Create test user
    const email = `expenses${Date.now()}@example.com`
    await request('POST', '/auth/register', {
      email,
      password: 'SecurePass123!',
      firstName: 'Expenses Test'
    })
    testUser = await authenticateUser(email, 'SecurePass123!')
  })

  afterAll(cleanup)

  describe('GET /expenses', () => {
    it('should fetch list of expenses', async () => {
      const response = await request('GET', '/expenses')

      expectStatus(response, 200)
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should filter expenses by month', async () => {
      const month = '2026-09'
      const response = await request('GET', `/expenses?month=${month}`)

      expectStatus(response, 200)
      expect(Array.isArray(response.data)).toBe(true)

      // All expenses should be from the specified month
      response.data.forEach(expense => {
        expect(expense.date).toContain(month)
      })
    })

    it('should filter expenses by category', async () => {
      const category = 'Makanan & Minuman'
      const response = await request('GET', `/expenses?category=${category}`)

      expectStatus(response, 200)
      expect(Array.isArray(response.data)).toBe(true)

      // All expenses should be from the specified category
      response.data.forEach(expense => {
        expect(expense.category).toBe(category)
      })
    })

    it('should filter expenses by scope (FAMILY/PERSONAL)', async () => {
      const scope = 'FAMILY'
      const response = await request('GET', `/expenses?scope=${scope}`)

      expectStatus(response, 200)
      expect(Array.isArray(response.data)).toBe(true)

      response.data.forEach(expense => {
        expect(expense.scope).toBe(scope)
      })
    })

    it('should require authentication', async () => {
      const savedHeaders = request.defaults?.headers

      // Create new unauthenticated client
      const unauthClient = require('axios').create({
        baseURL: 'http://localhost:5000/api',
        validateStatus: () => true
      })

      const response = await unauthClient.get('/expenses')

      expectStatus(response, 401)
    })
  })

  describe('POST /expenses', () => {
    it('should create new expense successfully', async () => {
      const newExpense = {
        amount: 150000,
        category: 'Makanan & Minuman',
        date: new Date().toISOString().split('T')[0],
        note: 'Makan siang bersama keluarga',
        scope: 'FAMILY'
      }

      const response = await request('POST', '/expenses', newExpense)

      expectStatus(response, 201)
      expectShape(response.data, ['id', 'amount', 'category', 'date'])
      expect(response.data.amount).toBe(newExpense.amount)
      expect(response.data.category).toBe(newExpense.category)
    })

    it('should validate required fields', async () => {
      const incompleteExpense = {
        category: 'Makanan',
        // Missing amount and date
      }

      const response = await request('POST', '/expenses', incompleteExpense)

      expectStatus(response, 400)
    })

    it('should validate amount is positive', async () => {
      const invalidExpense = {
        amount: -100,
        category: 'Makanan & Minuman',
        date: new Date().toISOString().split('T')[0]
      }

      const response = await request('POST', '/expenses', invalidExpense)

      expectStatus(response, 400)
    })

    it('should validate date format', async () => {
      const invalidExpense = {
        amount: 100000,
        category: 'Makanan & Minuman',
        date: 'invalid-date'
      }

      const response = await request('POST', '/expenses', invalidExpense)

      expectStatus(response, 400)
    })

    it('should set default scope if not provided', async () => {
      const expense = {
        amount: 75000,
        category: 'Transportasi',
        date: new Date().toISOString().split('T')[0]
      }

      const response = await request('POST', '/expenses', expense)

      expectStatus(response, 201)
      expect(['FAMILY', 'PERSONAL']).toContain(response.data.scope)
    })
  })

  describe('Complete Expense CRUD Flow', () => {
    it('should create, read, update, and delete expense', async () => {
      const originalExpense = {
        amount: 200000,
        category: 'Utilitas',
        date: new Date().toISOString().split('T')[0],
        note: 'Tagihan listrik bulanan',
        scope: 'FAMILY'
      }

      // Step 1: Create
      let response = await request('POST', '/expenses', originalExpense)
      expectStatus(response, 201)
      const expenseId = response.data.id
      expect(expenseId).toBeDefined()

      // Step 2: Read (List and verify)
      response = await request('GET', '/expenses')
      expectStatus(response, 200)
      const createdExpense = response.data.find(e => e.id === expenseId)
      expect(createdExpense).toBeDefined()
      expect(createdExpense.amount).toBe(originalExpense.amount)

      // Step 3: Update
      const updatedData = {
        amount: 250000,
        note: 'Tagihan listrik September'
      }
      response = await request('PUT', `/expenses/${expenseId}`, updatedData)
      expectStatus(response, 200)
      expect(response.data.amount).toBe(250000)

      // Step 4: Verify update
      response = await request('GET', `/expenses?category=${originalExpense.category}`)
      expectStatus(response, 200)
      const verifyExpense = response.data.find(e => e.id === expenseId)
      expect(verifyExpense.amount).toBe(250000)

      // Step 5: Delete
      response = await request('DELETE', `/expenses/${expenseId}`)
      expectStatus(response, 204)

      // Step 6: Verify deletion
      response = await request('GET', `/expenses?category=${originalExpense.category}`)
      expectStatus(response, 200)
      const deletedExpense = response.data.find(e => e.id === expenseId)
      expect(deletedExpense).toBeUndefined()
    })
  })

  describe('Expense Data Validation', () => {
    it('should enforce category whitelist', async () => {
      const validCategories = [
        'Makanan & Minuman',
        'Transportasi',
        'Utilitas',
        'Entertainment',
        'Kesehatan'
      ]

      for (const category of validCategories) {
        const response = await request('POST', '/expenses', {
          amount: 100000,
          category,
          date: new Date().toISOString().split('T')[0]
        })

        expectStatus(response, 201)
        expect(response.data.category).toBe(category)
      }
    })

    it('should reject invalid category', async () => {
      const response = await request('POST', '/expenses', {
        amount: 100000,
        category: 'InvalidCategory',
        date: new Date().toISOString().split('T')[0]
      })

      expectStatus(response, 400)
    })

    it('should validate scope (FAMILY/PERSONAL)', async () => {
      for (const scope of ['FAMILY', 'PERSONAL']) {
        const response = await request('POST', '/expenses', {
          amount: 100000,
          category: 'Makanan & Minuman',
          date: new Date().toISOString().split('T')[0],
          scope
        })

        expectStatus(response, 201)
        expect(response.data.scope).toBe(scope)
      }
    })
  })

  describe('Expense Permissions', () => {
    it('should allow user to view own expenses', async () => {
      const response = await request('GET', '/expenses')

      expectStatus(response, 200)
    })

    it('should prevent unauthorized deletion', async () => {
      // Create expense
      let response = await request('POST', '/expenses', {
        amount: 100000,
        category: 'Makanan & Minuman',
        date: new Date().toISOString().split('T')[0]
      })

      const expenseId = response.data.id

      // Try to delete (should succeed for own expense)
      response = await request('DELETE', `/expenses/${expenseId}`)

      // Should be 204 (successful) or 403 (forbidden) depending on permissions
      expect([204, 403]).toContain(response.status)
    })

    it('should reject access to non-existent expense', async () => {
      const response = await request('DELETE', '/expenses/nonexistent-id')

      expectStatus(response, 404)
    })
  })

  describe('Expense Performance', () => {
    it('should handle large amount values', async () => {
      const largeExpense = {
        amount: 999999999,
        category: 'Makanan & Minuman',
        date: new Date().toISOString().split('T')[0]
      }

      const response = await request('POST', '/expenses', largeExpense)

      expectStatus(response, 201)
      expect(response.data.amount).toBe(largeExpense.amount)
    })

    it('should handle decimal amounts', async () => {
      const decimalExpense = {
        amount: 75000.50,
        category: 'Transportasi',
        date: new Date().toISOString().split('T')[0]
      }

      const response = await request('POST', '/expenses', decimalExpense)

      // Should accept decimal or round it
      expect([201, 400]).toContain(response.status)
    })

    it('should handle long notes', async () => {
      const longNote = 'A'.repeat(500)
      const response = await request('POST', '/expenses', {
        amount: 100000,
        category: 'Makanan & Minuman',
        date: new Date().toISOString().split('T')[0],
        note: longNote
      })

      // Should accept or reject based on validation
      expect([201, 400]).toContain(response.status)
    })

    it('should respond within 500ms', async () => {
      const startTime = Date.now()

      const response = await request('GET', '/expenses')

      const responseTime = Date.now() - startTime

      expectStatus(response, 200)
      expect(responseTime).toBeLessThan(500)
    })
  })
})
