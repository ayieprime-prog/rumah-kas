/**
 * Integration Test Setup
 *
 * Utilities untuk integration testing dengan actual database
 * dan API endpoints
 */

const axios = require('axios')

// API client configured for testing
const apiClient = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  validateStatus: () => true // Don't throw on any status
})

// Store session cookie for authenticated requests
let sessionCookie = null

/**
 * Authenticate test user and store session
 */
async function authenticateUser(email = 'test@example.com', password = 'testpass123') {
  try {
    const response = await apiClient.post('/auth/login', { email, password })

    if (response.headers['set-cookie']) {
      sessionCookie = response.headers['set-cookie'][0]
      apiClient.defaults.headers.Cookie = sessionCookie
    }

    return response.data
  } catch (error) {
    console.error('Auth failed:', error.message)
    throw error
  }
}

/**
 * Clear authentication session
 */
function clearAuthentication() {
  sessionCookie = null
  delete apiClient.defaults.headers.Cookie
}

/**
 * Make authenticated request
 */
async function request(method, path, data = null, headers = {}) {
  const config = {
    method,
    url: path,
    headers
  }

  if (data) {
    config.data = data
  }

  return apiClient(config)
}

/**
 * Assert response status code
 */
function expectStatus(response, expectedStatus) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus} but got ${response.status}. ` +
      `Response: ${JSON.stringify(response.data)}`
    )
  }
}

/**
 * Assert response structure
 */
function expectShape(obj, expectedKeys) {
  const missingKeys = expectedKeys.filter(key => !(key in obj))
  if (missingKeys.length > 0) {
    throw new Error(
      `Expected keys ${missingKeys.join(', ')} but they are missing. ` +
      `Got: ${JSON.stringify(obj)}`
    )
  }
}

/**
 * Clean up after tests (logout, clear data)
 */
async function cleanup() {
  try {
    if (sessionCookie) {
      await request('POST', '/auth/logout')
    }
  } catch (error) {
    console.warn('Cleanup failed:', error.message)
  }
  clearAuthentication()
}

module.exports = {
  apiClient,
  authenticateUser,
  clearAuthentication,
  request,
  expectStatus,
  expectShape,
  cleanup
}
