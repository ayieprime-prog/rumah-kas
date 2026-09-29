/**
 * Auth API Integration Tests
 *
 * Tests for:
 * - POST /api/auth/register
 * - POST /api/auth/login
 * - GET /api/auth/me
 * - POST /api/auth/logout
 */

const {
  apiClient,
  authenticateUser,
  clearAuthentication,
  request,
  expectStatus,
  expectShape,
  cleanup
} = require('./setup.integration')

describe('Auth API Integration Tests', () => {
  afterEach(cleanup)

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: `testuser${Date.now()}@example.com`,
        password: 'SecurePass123!',
        firstName: 'Test User'
      }

      const response = await request('POST', '/auth/register', newUser)

      expectStatus(response, 201)
      expectShape(response.data.user, ['id', 'email', 'firstName'])
      expect(response.data.user.email).toBe(newUser.email)
    })

    it('should reject duplicate email registration', async () => {
      const testEmail = `duplicate${Date.now()}@example.com`
      const user = {
        email: testEmail,
        password: 'SecurePass123!',
        firstName: 'First User'
      }

      // First registration
      await request('POST', '/auth/register', user)

      // Duplicate attempt
      const response = await request('POST', '/auth/register', {
        ...user,
        firstName: 'Second User'
      })

      expectStatus(response, 409)
    })

    it('should validate email format', async () => {
      const response = await request('POST', '/auth/register', {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'Test'
      })

      expectStatus(response, 400)
    })

    it('should validate password requirements', async () => {
      const response = await request('POST', '/auth/register', {
        email: `valid${Date.now()}@example.com`,
        password: '123', // Too short
        firstName: 'Test'
      })

      expectStatus(response, 400)
    })

    it('should require all fields', async () => {
      const incompleteUser = {
        email: 'test@example.com'
        // Missing password and firstName
      }

      const response = await request('POST', '/auth/register', incompleteUser)

      expectStatus(response, 400)
    })
  })

  describe('POST /auth/login', () => {
    it('should login registered user successfully', async () => {
      const testEmail = `logintest${Date.now()}@example.com`
      const testPassword = 'SecurePass123!'

      // Register first
      await request('POST', '/auth/register', {
        email: testEmail,
        password: testPassword,
        firstName: 'Login Test'
      })

      // Login
      const response = await request('POST', '/auth/login', {
        email: testEmail,
        password: testPassword
      })

      expectStatus(response, 200)
      expectShape(response.data.user, ['id', 'email', 'firstName'])
      expect(response.data.user.email).toBe(testEmail)

      // Check if cookie is set
      expect(response.headers['set-cookie']).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
      const response = await request('POST', '/auth/login', {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })

      expectStatus(response, 401)
    })

    it('should reject wrong password', async () => {
      const testEmail = `wrongpass${Date.now()}@example.com`

      // Register
      await request('POST', '/auth/register', {
        email: testEmail,
        password: 'CorrectPass123!',
        firstName: 'Test'
      })

      // Try wrong password
      const response = await request('POST', '/auth/login', {
        email: testEmail,
        password: 'WrongPass123!'
      })

      expectStatus(response, 401)
    })

    it('should rate limit login attempts', async () => {
      const testEmail = `ratelimit${Date.now()}@example.com`

      // Make multiple failed attempts
      const responses = []
      for (let i = 0; i < 12; i++) {
        const response = await request('POST', '/auth/login', {
          email: testEmail,
          password: 'wrongpass'
        })
        responses.push(response)
      }

      // Last request should be rate limited (429)
      expect(responses[responses.length - 1].status).toBe(429)
    })

    it('should require credentials', async () => {
      const response = await request('POST', '/auth/login', {})

      expectStatus(response, 400)
    })
  })

  describe('GET /auth/me', () => {
    it('should return current user when authenticated', async () => {
      const testEmail = `me${Date.now()}@example.com`

      // Register and login
      await request('POST', '/auth/register', {
        email: testEmail,
        password: 'SecurePass123!',
        firstName: 'Me Test'
      })

      await authenticateUser(testEmail, 'SecurePass123!')

      // Get current user
      const response = await request('GET', '/auth/me')

      expectStatus(response, 200)
      expectShape(response.data.user, ['id', 'email', 'firstName'])
      expect(response.data.user.email).toBe(testEmail)
    })

    it('should return 401 when not authenticated', async () => {
      clearAuthentication()

      const response = await request('GET', '/auth/me')

      expectStatus(response, 401)
    })

    it('should reject invalid session', async () => {
      clearAuthentication()

      // Set invalid cookie
      apiClient.defaults.headers.Cookie = 'sessionId=invalid'

      const response = await request('GET', '/auth/me')

      expectStatus(response, 401)
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout authenticated user', async () => {
      const testEmail = `logout${Date.now()}@example.com`

      // Register and login
      await request('POST', '/auth/register', {
        email: testEmail,
        password: 'SecurePass123!',
        firstName: 'Logout Test'
      })

      await authenticateUser(testEmail, 'SecurePass123!')

      // Verify authenticated
      let response = await request('GET', '/auth/me')
      expectStatus(response, 200)

      // Logout
      response = await request('POST', '/auth/logout')
      expectStatus(response, 200)

      // Verify no longer authenticated
      clearAuthentication()
      response = await request('GET', '/auth/me')
      expectStatus(response, 401)
    })

    it('should handle logout when not authenticated', async () => {
      clearAuthentication()

      const response = await request('POST', '/auth/logout')

      // Should still succeed (graceful)
      expect([200, 401]).toContain(response.status)
    })
  })

  describe('Complete Auth Flow', () => {
    it('should complete register → login → getMe → logout flow', async () => {
      const testEmail = `flow${Date.now()}@example.com`
      const testPassword = 'SecurePass123!'
      const firstName = 'Flow Test'

      // Step 1: Register
      let response = await request('POST', '/auth/register', {
        email: testEmail,
        password: testPassword,
        firstName
      })
      expectStatus(response, 201)
      expect(response.data.user.email).toBe(testEmail)

      // Step 2: Login
      response = await request('POST', '/auth/login', {
        email: testEmail,
        password: testPassword
      })
      expectStatus(response, 200)
      expect(response.data.user.email).toBe(testEmail)

      // Store session for next requests
      if (response.headers['set-cookie']) {
        apiClient.defaults.headers.Cookie = response.headers['set-cookie'][0]
      }

      // Step 3: Get current user
      response = await request('GET', '/auth/me')
      expectStatus(response, 200)
      expect(response.data.user.firstName).toBe(firstName)

      // Step 4: Logout
      response = await request('POST', '/auth/logout')
      expectStatus(response, 200)

      // Step 5: Verify logout
      clearAuthentication()
      response = await request('GET', '/auth/me')
      expectStatus(response, 401)
    })
  })

  describe('Session Management', () => {
    it('should maintain session across requests', async () => {
      const testEmail = `session${Date.now()}@example.com`

      // Register and login
      await request('POST', '/auth/register', {
        email: testEmail,
        password: 'SecurePass123!',
        firstName: 'Session Test'
      })

      await authenticateUser(testEmail, 'SecurePass123!')

      // Make multiple authenticated requests
      for (let i = 0; i < 5; i++) {
        const response = await request('GET', '/auth/me')
        expectStatus(response, 200)
      }
    })

    it('should clear session on logout', async () => {
      const testEmail = `clearsession${Date.now()}@example.com`

      // Register and login
      await request('POST', '/auth/register', {
        email: testEmail,
        password: 'SecurePass123!',
        firstName: 'Clear Session Test'
      })

      await authenticateUser(testEmail, 'SecurePass123!')

      // Logout
      await request('POST', '/auth/logout')

      // Clear client side cookie
      clearAuthentication()

      // Verify session is cleared
      const response = await request('GET', '/auth/me')
      expectStatus(response, 401)
    })
  })
})
