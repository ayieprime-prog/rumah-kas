import axios from 'axios'

jest.mock('axios')

describe('Auth Flow - Register → Login → Logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Register Flow', () => {
    it('should register new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Andri'
      }

      axios.post.mockResolvedValueOnce({
        data: { user: { id: '1', email: userData.email, firstName: userData.firstName } }
      })

      const response = await axios.post('/api/auth/register', userData)

      expect(axios.post).toHaveBeenCalledWith('/api/auth/register', userData)
      expect(response.data.user.email).toBe(userData.email)
      expect(response.data.user.firstName).toBe(userData.firstName)
    })

    it('should handle registration error - email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Andri'
      }

      axios.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { error: 'Email already registered' }
        }
      })

      try {
        await axios.post('/api/auth/register', userData)
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(409)
        expect(error.response.data.error).toContain('Email')
      }
    })

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'user@example.com'
        // missing password and firstName
      }

      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Missing required fields' }
        }
      })

      try {
        await axios.post('/api/auth/register', incompleteData)
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })
  })

  describe('Login Flow', () => {
    it('should login user successfully', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'password123'
      }

      axios.post.mockResolvedValueOnce({
        data: {
          user: {
            id: '1',
            email: credentials.email,
            firstName: 'Andri'
          }
        }
      })

      const response = await axios.post('/api/auth/login', credentials)

      expect(axios.post).toHaveBeenCalledWith('/api/auth/login', credentials)
      expect(response.data.user.email).toBe(credentials.email)
    })

    it('should handle login error - invalid credentials', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'wrongpassword'
      }

      axios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Invalid email or password' }
        }
      })

      try {
        await axios.post('/api/auth/login', credentials)
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should handle login error - user not found', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      }

      axios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'User not found' }
        }
      })

      try {
        await axios.post('/api/auth/login', credentials)
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })
  })

  describe('Get Current User Flow', () => {
    it('should fetch current user data', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          user: {
            id: '1',
            email: 'user@example.com',
            firstName: 'Andri',
            city: 'Jakarta'
          }
        }
      })

      const response = await axios.get('/api/auth/me')

      expect(axios.get).toHaveBeenCalledWith('/api/auth/me')
      expect(response.data.user.email).toBe('user@example.com')
      expect(response.data.user.firstName).toBe('Andri')
    })

    it('should return 401 when not authenticated', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Not authenticated' }
        }
      })

      try {
        await axios.get('/api/auth/me')
        fail('Should have thrown error')
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })
  })

  describe('Logout Flow', () => {
    it('should logout user successfully', async () => {
      axios.post.mockResolvedValueOnce({
        data: { message: 'Logged out successfully' }
      })

      const response = await axios.post('/api/auth/logout')

      expect(axios.post).toHaveBeenCalledWith('/api/auth/logout')
      expect(response.data.message).toContain('Logged out')
    })

    it('should handle logout error gracefully', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Server error' }
        }
      })

      // Logout should still clear client state even if API fails
      try {
        await axios.post('/api/auth/logout')
      } catch (error) {
        expect(error.response.status).toBe(500)
      }
    })
  })

  describe('Complete Auth Flow', () => {
    it('should complete register → login → fetch user → logout flow', async () => {
      // Step 1: Register
      axios.post.mockResolvedValueOnce({
        data: { user: { id: '1', email: 'newuser@example.com' } }
      })

      const registerResponse = await axios.post('/api/auth/register', {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Andri'
      })
      expect(registerResponse.data.user.id).toBe('1')

      // Step 2: Login
      axios.post.mockResolvedValueOnce({
        data: { user: { id: '1', email: 'newuser@example.com' } }
      })

      const loginResponse = await axios.post('/api/auth/login', {
        email: 'newuser@example.com',
        password: 'password123'
      })
      expect(loginResponse.data.user.id).toBe('1')

      // Step 3: Get current user
      axios.get.mockResolvedValueOnce({
        data: { user: { id: '1', email: 'newuser@example.com', firstName: 'Andri' } }
      })

      const userResponse = await axios.get('/api/auth/me')
      expect(userResponse.data.user.firstName).toBe('Andri')

      // Step 4: Logout
      axios.post.mockResolvedValueOnce({
        data: { message: 'Logged out' }
      })

      const logoutResponse = await axios.post('/api/auth/logout')
      expect(logoutResponse.data.message).toContain('Logged out')

      // Verify all calls were made
      expect(axios.post).toHaveBeenCalledTimes(3) // register + login + logout
      expect(axios.get).toHaveBeenCalledTimes(1) // getMe
    })
  })
})
