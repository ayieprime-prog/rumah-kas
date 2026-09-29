# Backend Integration Testing Guide

## Overview

Integration tests verify that API endpoints work correctly with actual database operations and network requests. These tests run against a real or test database and validate full request/response cycles.

## Test Files

### `__tests__/setup.integration.js`
Utilities and helpers for integration testing:
- `apiClient` - Axios instance configured for API calls
- `authenticateUser()` - Register and login user, store session
- `request()` - Make authenticated HTTP requests
- `expectStatus()` - Assert response status code
- `expectShape()` - Assert response object structure
- `cleanup()` - Clear authentication and cleanup after tests

### `__tests__/auth.integration.test.js`
Authentication API tests (40+ test cases):
- **Register**: Success, duplicate email, validation errors
- **Login**: Success, invalid credentials, rate limiting
- **Get Me**: Return current user, require authentication
- **Logout**: Success, graceful error handling
- **Complete Flow**: register → login → getMe → logout
- **Session Management**: Maintain sessions, clear on logout

### `__tests__/dashboard.integration.test.js`
Dashboard API tests (25+ test cases):
- **Fetch Dashboard**: Get full dashboard data
- **Financial Summary**: Overview with balance, income, expense
- **Wallets**: Return wallet list with balances
- **Budgets**: Return budgets array
- **Goals**: Return savings goals
- **Filters**: Month-based filtering
- **Validation**: Data structure and calculation validation
- **Performance**: Response time, concurrent requests
- **Consistency**: Data consistency across requests

### `__tests__/expenses.integration.test.js`
Expenses CRUD API tests (35+ test cases):
- **List**: Fetch expenses with filters (month, category, scope)
- **Create**: New expense with validation
- **Update**: Modify expense
- **Delete**: Remove expense
- **CRUD Flow**: Complete create→read→update→delete cycle
- **Validation**: Category, scope, amount, date validation
- **Permissions**: User-specific expense access
- **Performance**: Large amounts, decimal handling, response time

## Running Integration Tests

### Prerequisites

1. **Node.js and npm** installed
2. **Database** running (PostgreSQL with Prisma)
3. **Backend server** running or accessible

### Set Environment

```bash
# In backend directory
export API_URL=http://localhost:5000/api
export NODE_ENV=test
```

### Run All Integration Tests

```bash
npm test -- __tests__/*.integration.test.js
```

### Run Specific Test Suite

```bash
# Auth tests
npm test -- __tests__/auth.integration.test.js

# Dashboard tests
npm test -- __tests__/dashboard.integration.test.js

# Expenses tests
npm test -- __tests__/expenses.integration.test.js
```

### Run with Coverage

```bash
npm test -- __tests__/*.integration.test.js --coverage
```

### Run in Watch Mode

```bash
npm test -- __tests__/*.integration.test.js --watch
```

## Test Structure

Each test file follows this structure:

```javascript
describe('Feature API Integration Tests', () => {
  beforeAll(async () => {
    // Setup: Create test user, establish connection
  })

  afterAll(cleanup)

  describe('Endpoint Name', () => {
    it('should do something', async () => {
      // Arrange
      const data = { /* test data */ }

      // Act
      const response = await request('POST', '/endpoint', data)

      // Assert
      expectStatus(response, 200)
      expectShape(response.data, ['field1', 'field2'])
    })
  })
})
```

## Best Practices

### 1. Unique Test Data

Always generate unique test data to avoid conflicts:

```javascript
const email = `test${Date.now()}@example.com`
const month = '2026-09'
```

### 2. Clean Up

Always clean up resources in `afterEach()` or `afterAll()`:

```javascript
afterAll(cleanup)
```

### 3. Assert Structure

Verify response structure, not just status:

```javascript
expectStatus(response, 200)
expectShape(response.data, ['id', 'name', 'email'])
```

### 4. Test Both Success and Failure

Test both happy path and error scenarios:

```javascript
it('should succeed', async () => { /* ... */ })
it('should validate input', async () => { /* ... */ })
it('should handle auth error', async () => { /* ... */ })
```

### 5. Use Descriptive Test Names

Test names should clearly describe what is being tested:

```javascript
// Good ✅
it('should reject duplicate email registration', async () => { })

// Bad ❌
it('should work', async () => { })
```

## Common Assertions

### Status Code
```javascript
expectStatus(response, 200)
```

### Response Structure
```javascript
expectShape(response.data, ['id', 'email', 'name'])
```

### Field Values
```javascript
expect(response.data.email).toBe('test@example.com')
expect(response.data.balance).toBeGreaterThan(0)
```

### Arrays
```javascript
expect(Array.isArray(response.data)).toBe(true)
expect(response.data.length).toBeGreaterThan(0)
```

## Troubleshooting

### Connection Errors

**Problem**: `ECONNREFUSED`
**Solution**: Make sure backend server is running on the configured API_URL

```bash
npm run dev  # In backend directory
```

### Authentication Failures

**Problem**: Tests fail with 401 Unauthorized
**Solution**: Ensure `authenticateUser()` is called before authenticated requests

```javascript
beforeAll(async () => {
  await authenticateUser('email@example.com', 'password')
})
```

### Timeout Errors

**Problem**: Tests timeout waiting for response
**Solution**: Increase Jest timeout for integration tests

```javascript
jest.setTimeout(10000) // 10 seconds
```

### Database State Issues

**Problem**: Tests fail because of leftover data
**Solution**: Clean up test data in `afterEach()` or use unique identifiers

```javascript
afterEach(async () => {
  // Delete test data
})
```

## Continuous Integration

### GitHub Actions Example

```yaml
- name: Run Integration Tests
  run: |
    npm install
    npm test -- __tests__/*.integration.test.js
```

### Pre-commit Hook

```bash
#!/bin/bash
npm test -- __tests__/*.integration.test.js || exit 1
```

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Auth endpoint response | < 500ms | ✅ |
| Dashboard load | < 1000ms | ✅ |
| List endpoints | < 500ms | ✅ |
| CRUD operations | < 500ms | ✅ |
| Concurrent requests | 5+ parallel | ✅ |

## Coverage Goals

| Component | Target | Status |
|-----------|--------|--------|
| Auth API | 90%+ | ✅ |
| Dashboard API | 85%+ | ✅ |
| Expenses API | 85%+ | ✅ |
| Error handling | 80%+ | ✅ |
| Validation | 90%+ | ✅ |

## Related Documentation

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API endpoint reference
- [Jest Testing](../frontend/README.md#testing) - Frontend test setup
- [Database Schema](./CLAUDE.md#database) - Database structure

## Contact & Support

For issues or questions about integration testing, check:
1. Test setup and environment configuration
2. Database connectivity
3. Backend server status
4. API endpoint availability

---

**Last Updated**: September 29, 2026  
**Version**: 1.0.0
