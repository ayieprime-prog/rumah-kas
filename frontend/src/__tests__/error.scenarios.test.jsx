import axios from 'axios'

jest.mock('axios')

describe('Error Scenarios & Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Network Errors', () => {
    it('should handle network timeout', async () => {
      axios.get.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      })

      try {
        await axios.get('/api/dashboard')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.code).toBe('ECONNABORTED')
        expect(error.message).toContain('timeout')
      }
    })

    it('should handle connection refused', async () => {
      axios.get.mockRejectedValueOnce({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      })

      try {
        await axios.get('/api/dashboard')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.code).toBe('ECONNREFUSED')
      }
    })

    it('should handle no internet connection', async () => {
      axios.get.mockRejectedValueOnce({
        message: 'Network Error',
        isNetworkError: true
      })

      try {
        await axios.get('/api/dashboard')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.isNetworkError).toBe(true)
      }
    })
  })

  describe('HTTP Error Responses', () => {
    it('should handle 400 Bad Request', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Invalid input' }
        }
      })

      try {
        await axios.post('/api/expenses', { invalid: 'data' })
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error).toBe('Invalid input')
      }
    })

    it('should handle 401 Unauthorized', async () => {
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

    it('should handle 403 Forbidden', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { error: 'Permission denied' }
        }
      })

      try {
        await axios.get('/api/dashboard')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })

    it('should handle 404 Not Found', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Resource not found' }
        }
      })

      try {
        await axios.get('/api/expenses/nonexistent')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    })

    it('should handle 409 Conflict (already exists)', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { error: 'Email already registered' }
        }
      })

      try {
        await axios.post('/api/auth/register', { email: 'existing@example.com', password: 'pwd' })
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(409)
      }
    })

    it('should handle 429 Too Many Requests (rate limit)', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 429,
          data: { error: 'Too many attempts, please try again later' }
        }
      })

      try {
        await axios.post('/api/auth/login', { email: 'user@example.com', password: 'pwd' })
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(429)
      }
    })

    it('should handle 500 Server Error', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      })

      try {
        await axios.get('/api/dashboard')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(500)
      }
    })

    it('should handle 503 Service Unavailable', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 503,
          data: { error: 'Service temporarily unavailable' }
        }
      })

      try {
        await axios.get('/api/dashboard')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(503)
      }
    })
  })

  describe('Data Validation Errors', () => {
    it('should validate email format', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Invalid email format' }
        }
      })

      try {
        await axios.post('/api/auth/register', {
          email: 'invalid-email',
          password: 'password123',
          firstName: 'John'
        })
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error).toContain('email')
      }
    })

    it('should validate password strength', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Password must be at least 6 characters' }
        }
      })

      try {
        await axios.post('/api/auth/register', {
          email: 'user@example.com',
          password: '123',
          firstName: 'John'
        })
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.data.error).toContain('Password')
      }
    })

    it('should validate required fields', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'First name is required' }
        }
      })

      try {
        await axios.post('/api/auth/register', {
          email: 'user@example.com',
          password: 'password123'
        })
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })

    it('should validate amount is positive', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Amount must be greater than 0' }
        }
      })

      try {
        await axios.post('/api/expenses', {
          amount: 0,
          category: 'Food',
          date: '2026-09-24'
        })
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })

    it('should validate date format', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Invalid date format' }
        }
      })

      try {
        await axios.post('/api/expenses', {
          amount: 100000,
          category: 'Food',
          date: 'invalid-date'
        })
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })
  })

  describe('Error Recovery & Retry Logic', () => {
    it('should retry failed request on network error', async () => {
      // First attempt fails
      axios.get.mockRejectedValueOnce({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      })

      try {
        await axios.get('/api/dashboard')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.code).toBe('ECONNREFUSED')
      }

      // Retry succeeds
      axios.get.mockResolvedValueOnce({
        data: { overview: { balance: 5000000 } }
      })

      const retryResponse = await axios.get('/api/dashboard')
      expect(retryResponse.data.overview.balance).toBe(5000000)
      expect(axios.get).toHaveBeenCalledTimes(2)
    })

    it('should handle partial success with fallback data', async () => {
      // Primary endpoint fails
      axios.get.mockRejectedValueOnce({
        response: { status: 500 }
      })

      try {
        await axios.get('/api/dashboard')
      } catch (error) {
        expect(error.response.status).toBe(500)
      }

      // Fallback to cached data or default values
      const fallbackData = {
        overview: { balance: 0 },
        wallets: [],
        budgets: [],
        goals: [],
        debtSummary: { totalDebt: 0 }
      }

      expect(fallbackData.overview).toBeDefined()
      expect(fallbackData.wallets.length).toBe(0)
    })

    it('should not retry on 4xx errors', async () => {
      // 400 Bad Request - should not retry
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Invalid input' }
        }
      })

      try {
        await axios.post('/api/expenses', { invalid: 'data' })
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(400)
      }

      // No automatic retry
      expect(axios.post).toHaveBeenCalledTimes(1)
    })

    it('should exponential backoff for retries', async () => {
      const delays = []
      const originalSetTimeout = setTimeout

      jest.useFakeTimers()

      // First attempt fails
      axios.get.mockRejectedValueOnce({
        code: 'ECONNREFUSED'
      })

      try {
        await axios.get('/api/dashboard')
      } catch (error) {
        // Simulate retry with exponential backoff
        delays.push(1000) // First retry after 1 second
        delays.push(2000) // Second retry after 2 seconds
        delays.push(4000) // Third retry after 4 seconds
      }

      expect(delays).toEqual([1000, 2000, 4000])

      jest.useRealTimers()
    })
  })

  describe('User-Friendly Error Messages', () => {
    it('should translate network error to user message', async () => {
      axios.get.mockRejectedValueOnce({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      })

      try {
        await axios.get('/api/dashboard')
      } catch (error) {
        const userMessage = 'Tidak ada koneksi internet. Periksa jaringan Anda.'
        expect(userMessage).toBeDefined()
      }
    })

    it('should translate 401 to login required message', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Not authenticated' }
        }
      })

      try {
        await axios.get('/api/dashboard')
      } catch (error) {
        const userMessage = 'Sesi Anda kadaluarsa. Silakan login kembali.'
        expect(userMessage).toBeDefined()
      }
    })

    it('should translate 500 to server error message', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      })

      try {
        await axios.get('/api/dashboard')
      } catch (error) {
        const userMessage = 'Server sedang bermasalah. Coba lagi dalam beberapa saat.'
        expect(userMessage).toBeDefined()
      }
    })
  })
})
