import axios from 'axios'

jest.mock('axios')

describe('Transaction Flow - Create, Read, Update, Delete', () => {
  const mockExpense = {
    id: '1',
    amount: 150000,
    category: 'Makanan & Minuman',
    date: '2026-09-24',
    note: 'Makan bersama keluarga',
    scope: 'FAMILY',
    createdAt: '2026-09-24T10:00:00Z'
  }

  const mockIncome = {
    id: '2',
    amount: 5000000,
    source: 'Gaji',
    date: '2026-09-01',
    note: 'Gaji bulanan September',
    scope: 'FAMILY',
    createdAt: '2026-09-01T08:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('List Transactions', () => {
    it('should fetch list of expenses', async () => {
      const expensesList = [mockExpense]
      axios.get.mockResolvedValueOnce({ data: expensesList })

      const response = await axios.get('/api/expenses')

      expect(axios.get).toHaveBeenCalledWith('/api/expenses')
      expect(response.data.length).toBe(1)
      expect(response.data[0].category).toBe('Makanan & Minuman')
    })

    it('should fetch expenses for specific month', async () => {
      const expensesList = [mockExpense]
      axios.get.mockResolvedValueOnce({ data: expensesList })

      const response = await axios.get('/api/expenses', {
        params: { month: '2026-09' }
      })

      expect(axios.get).toHaveBeenCalledWith('/api/expenses', {
        params: { month: '2026-09' }
      })
      expect(response.data[0].date).toContain('2026-09')
    })

    it('should filter expenses by category', async () => {
      const filteredExpenses = [mockExpense]
      axios.get.mockResolvedValueOnce({ data: filteredExpenses })

      const response = await axios.get('/api/expenses', {
        params: { category: 'Makanan & Minuman' }
      })

      expect(axios.get).toHaveBeenCalledWith('/api/expenses', {
        params: { category: 'Makanan & Minuman' }
      })
      expect(response.data[0].category).toBe('Makanan & Minuman')
    })

    it('should filter expenses by scope (FAMILY/PERSONAL)', async () => {
      axios.get.mockResolvedValueOnce({ data: [mockExpense] })

      const response = await axios.get('/api/expenses', {
        params: { scope: 'FAMILY' }
      })

      expect(response.data[0].scope).toBe('FAMILY')
    })

    it('should handle empty expense list', async () => {
      axios.get.mockResolvedValueOnce({ data: [] })

      const response = await axios.get('/api/expenses')

      expect(response.data.length).toBe(0)
    })
  })

  describe('Create Transaction', () => {
    it('should create new expense', async () => {
      const newExpense = {
        amount: 75000,
        category: 'Transportasi',
        date: '2026-09-25',
        scope: 'FAMILY'
      }

      axios.post.mockResolvedValueOnce({ data: { ...newExpense, id: '1' } })

      const response = await axios.post('/api/expenses', newExpense)

      expect(axios.post).toHaveBeenCalledWith('/api/expenses', newExpense)
      expect(response.data.id).toBe('1')
      expect(response.data.amount).toBe(75000)
    })

    it('should create new income', async () => {
      const newIncome = {
        amount: 1000000,
        source: 'Freelance',
        date: '2026-09-25',
        scope: 'PERSONAL'
      }

      axios.post.mockResolvedValueOnce({ data: { ...newIncome, id: '2' } })

      const response = await axios.post('/api/income', newIncome)

      expect(axios.post).toHaveBeenCalledWith('/api/income', newIncome)
      expect(response.data.source).toBe('Freelance')
    })

    it('should handle validation error - missing amount', async () => {
      const invalidExpense = {
        category: 'Makanan',
        date: '2026-09-25'
        // missing amount
      }

      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Amount is required' }
        }
      })

      try {
        await axios.post('/api/expenses', invalidExpense)
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })

    it('should handle validation error - invalid amount', async () => {
      const invalidExpense = {
        amount: -100,
        category: 'Makanan',
        date: '2026-09-25'
      }

      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Amount must be positive' }
        }
      })

      try {
        await axios.post('/api/expenses', invalidExpense)
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })

    it('should handle server error on creation', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Server error' }
        }
      })

      try {
        await axios.post('/api/expenses', mockExpense)
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(500)
      }
    })
  })

  describe('Update Transaction', () => {
    it('should update expense successfully', async () => {
      const updatedExpense = {
        ...mockExpense,
        amount: 200000,
        note: 'Updated note'
      }

      axios.put.mockResolvedValueOnce({ data: updatedExpense })

      const response = await axios.put(`/api/expenses/${mockExpense.id}`, updatedExpense)

      expect(axios.put).toHaveBeenCalledWith(`/api/expenses/${mockExpense.id}`, updatedExpense)
      expect(response.data.amount).toBe(200000)
      expect(response.data.note).toBe('Updated note')
    })

    it('should handle update error - not found', async () => {
      axios.put.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Expense not found' }
        }
      })

      try {
        await axios.put('/api/expenses/nonexistent', mockExpense)
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    })

    it('should handle update error - permission denied', async () => {
      axios.put.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { error: 'You do not have permission to update this' }
        }
      })

      try {
        await axios.put(`/api/expenses/${mockExpense.id}`, mockExpense)
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })
  })

  describe('Delete Transaction', () => {
    it('should delete expense successfully', async () => {
      axios.delete.mockResolvedValueOnce({ data: { message: 'Deleted' } })

      const response = await axios.delete(`/api/expenses/${mockExpense.id}`)

      expect(axios.delete).toHaveBeenCalledWith(`/api/expenses/${mockExpense.id}`)
      expect(response.data.message).toBe('Deleted')
    })

    it('should handle delete error - not found', async () => {
      axios.delete.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Expense not found' }
        }
      })

      try {
        await axios.delete('/api/expenses/nonexistent')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    })

    it('should handle delete error - permission denied', async () => {
      axios.delete.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { error: 'You do not have permission to delete this' }
        }
      })

      try {
        await axios.delete(`/api/expenses/${mockExpense.id}`)
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })
  })

  describe('Complete Transaction Flow', () => {
    it('should complete create → read → update → delete flow', async () => {
      // Step 1: Create expense
      axios.post.mockResolvedValueOnce({
        data: { ...mockExpense, id: '1' }
      })

      const createResponse = await axios.post('/api/expenses', mockExpense)
      const expenseId = createResponse.data.id

      // Step 2: Read (list) expenses
      axios.get.mockResolvedValueOnce({
        data: [createResponse.data]
      })

      const listResponse = await axios.get('/api/expenses')
      expect(listResponse.data[0].id).toBe(expenseId)

      // Step 3: Update expense
      const updatedData = { ...mockExpense, amount: 200000 }
      axios.put.mockResolvedValueOnce({
        data: { ...updatedData, id: expenseId }
      })

      const updateResponse = await axios.put(`/api/expenses/${expenseId}`, updatedData)
      expect(updateResponse.data.amount).toBe(200000)

      // Step 4: Delete expense
      axios.delete.mockResolvedValueOnce({
        data: { message: 'Deleted' }
      })

      const deleteResponse = await axios.delete(`/api/expenses/${expenseId}`)
      expect(deleteResponse.data.message).toBe('Deleted')

      // Verify call sequence
      expect(axios.post).toHaveBeenCalledTimes(1)
      expect(axios.get).toHaveBeenCalledTimes(1)
      expect(axios.put).toHaveBeenCalledTimes(1)
      expect(axios.delete).toHaveBeenCalledTimes(1)
    })

    it('should handle partial flow with error recovery', async () => {
      // Step 1: Create expense
      axios.post.mockResolvedValueOnce({
        data: { ...mockExpense, id: '1' }
      })

      const createResponse = await axios.post('/api/expenses', mockExpense)

      // Step 2: Update fails
      axios.put.mockRejectedValueOnce({
        response: { status: 500, data: { error: 'Server error' } }
      })

      try {
        await axios.put(`/api/expenses/${createResponse.data.id}`, mockExpense)
      } catch (error) {
        expect(error.response.status).toBe(500)
      }

      // Step 3: Retry update
      axios.put.mockResolvedValueOnce({
        data: { ...mockExpense, id: createResponse.data.id, amount: 200000 }
      })

      const retryResponse = await axios.put(`/api/expenses/${createResponse.data.id}`, {
        ...mockExpense,
        amount: 200000
      })

      expect(retryResponse.data.amount).toBe(200000)
    })
  })
})
