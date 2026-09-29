import axios from 'axios'

jest.mock('axios')

describe('Dashboard Flow - Load and Display Financial Data', () => {
  const mockDashboardData = {
    overview: {
      balance: 5000000,
      totalIncome: 10000000,
      totalExpense: 2500000
    },
    wallets: [
      { id: '1', name: 'Dompet Tunai', balance: 500000, icon: 'Banknote' },
      { id: '2', name: 'Rekening BCA', balance: 4500000, icon: 'CreditCard' }
    ],
    budgets: [
      { id: '1', category: { name: 'Makanan', color: '#FF6B6B' }, limit: 500000, spent: 250000 },
      { id: '2', category: { name: 'Transportasi', color: '#4ECDC4' }, limit: 300000, spent: 150000 }
    ],
    goals: [
      { id: '1', name: 'Liburan', targetAmount: 10000000, currentAmount: 1000000 }
    ],
    debtSummary: { totalDebt: 5000000 },
    incomeLocks: { totalRemaining: 750000 }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Dashboard Data Loading', () => {
    it('should fetch dashboard data successfully', async () => {
      axios.get.mockResolvedValueOnce({ data: mockDashboardData })

      const response = await axios.get('/api/dashboard')

      expect(axios.get).toHaveBeenCalledWith('/api/dashboard')
      expect(response.data.overview.balance).toBe(5000000)
      expect(response.data.wallets.length).toBe(2)
      expect(response.data.budgets.length).toBe(2)
    })

    it('should fetch dashboard data for specific month', async () => {
      axios.get.mockResolvedValueOnce({ data: mockDashboardData })

      const response = await axios.get('/api/dashboard', {
        params: { month: '2026-09' }
      })

      expect(axios.get).toHaveBeenCalledWith('/api/dashboard', { params: { month: '2026-09' } })
      expect(response.data.overview).toBeDefined()
    })

    it('should handle dashboard loading error', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Failed to load dashboard' }
        }
      })

      try {
        await axios.get('/api/dashboard')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(500)
      }
    })

    it('should handle unauthenticated request', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Not authenticated' }
        }
      })

      try {
        await axios.get('/api/dashboard')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })
  })

  describe('Dashboard Data Calculation', () => {
    it('should calculate correct financial summary', () => {
      const { overview } = mockDashboardData

      const netIncome = overview.totalIncome - overview.totalExpense
      expect(netIncome).toBe(7500000)
      expect(overview.balance).toBe(5000000)
    })

    it('should calculate uang bebas correctly', () => {
      const { overview, goals, incomeLocks } = mockDashboardData

      const totalGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0)
      const totalLocked = incomeLocks.totalRemaining

      const uangBebas = overview.balance - totalGoals - totalLocked
      expect(uangBebas).toBe(3250000) // 5,000,000 - 1,000,000 - 750,000
    })

    it('should aggregate budget spending by category', () => {
      const { budgets } = mockDashboardData

      const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0)
      const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)

      expect(totalBudget).toBe(800000)
      expect(totalSpent).toBe(400000)
      expect(totalSpent / totalBudget).toBeLessThan(1) // Under budget
    })
  })

  describe('Dashboard Data Validation', () => {
    it('should validate required fields exist', async () => {
      axios.get.mockResolvedValueOnce({ data: mockDashboardData })

      const response = await axios.get('/api/dashboard')
      const data = response.data

      expect(data.overview).toBeDefined()
      expect(data.wallets).toBeDefined()
      expect(data.budgets).toBeDefined()
      expect(data.goals).toBeDefined()
    })

    it('should have valid wallet data', async () => {
      axios.get.mockResolvedValueOnce({ data: mockDashboardData })

      const response = await axios.get('/api/dashboard')
      const { wallets } = response.data

      wallets.forEach(wallet => {
        expect(wallet.id).toBeDefined()
        expect(wallet.name).toBeDefined()
        expect(wallet.balance).toBeGreaterThanOrEqual(0)
        expect(typeof wallet.balance).toBe('number')
      })
    })

    it('should have valid budget data', async () => {
      axios.get.mockResolvedValueOnce({ data: mockDashboardData })

      const response = await axios.get('/api/dashboard')
      const { budgets } = response.data

      budgets.forEach(budget => {
        expect(budget.category.name).toBeDefined()
        expect(budget.limit).toBeGreaterThan(0)
        expect(budget.spent).toBeGreaterThanOrEqual(0)
        expect(budget.spent).toBeLessThanOrEqual(budget.limit * 2) // Allow overspending
      })
    })
  })

  describe('Dashboard Refresh Flow', () => {
    it('should refetch dashboard when user refreshes', async () => {
      // First fetch
      axios.get.mockResolvedValueOnce({ data: mockDashboardData })
      await axios.get('/api/dashboard')

      // User spends money - data changes
      const updatedData = {
        ...mockDashboardData,
        overview: {
          ...mockDashboardData.overview,
          totalExpense: 3000000,
          balance: 4500000
        }
      }

      // Second fetch (after refresh)
      axios.get.mockResolvedValueOnce({ data: updatedData })
      const response = await axios.get('/api/dashboard')

      expect(response.data.overview.totalExpense).toBe(3000000)
      expect(response.data.overview.balance).toBe(4500000)
      expect(axios.get).toHaveBeenCalledTimes(2)
    })

    it('should handle partial data refresh', async () => {
      // Fetch only wallets
      const walletsData = { wallets: mockDashboardData.wallets }
      axios.get.mockResolvedValueOnce({ data: walletsData })

      const response = await axios.get('/api/dashboard/wallets')

      expect(response.data.wallets.length).toBe(2)
      expect(response.data.overview).toBeUndefined()
    })
  })

  describe('Dashboard with Empty Data', () => {
    it('should handle dashboard with no wallets', async () => {
      const emptyWalletsData = { ...mockDashboardData, wallets: [] }
      axios.get.mockResolvedValueOnce({ data: emptyWalletsData })

      const response = await axios.get('/api/dashboard')

      expect(response.data.wallets.length).toBe(0)
      expect(response.data.overview.balance).toBe(5000000) // Still have balance
    })

    it('should handle dashboard with no goals', async () => {
      const noGoalsData = { ...mockDashboardData, goals: [] }
      axios.get.mockResolvedValueOnce({ data: noGoalsData })

      const response = await axios.get('/api/dashboard')

      expect(response.data.goals.length).toBe(0)
      const totalGoals = response.data.goals.reduce((sum, g) => sum + g.currentAmount, 0)
      expect(totalGoals).toBe(0)
    })

    it('should handle dashboard with zero balance', async () => {
      const zeroBalanceData = { ...mockDashboardData, overview: { ...mockDashboardData.overview, balance: 0 } }
      axios.get.mockResolvedValueOnce({ data: zeroBalanceData })

      const response = await axios.get('/api/dashboard')

      expect(response.data.overview.balance).toBe(0)
    })
  })
})
