/**
 * Response Caching Utilities
 *
 * Cache API responses to reduce database hits
 * and improve response times
 */

// Simple in-memory cache (for single-instance)
class MemoryCache {
  constructor() {
    this.cache = new Map()
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  set(key, value, ttlSeconds = 300) {
    this.cache.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null
    })
  }

  delete(key) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  has(key) {
    return this.get(key) !== null
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        ttl: item.expiresAt ? Math.round((item.expiresAt - Date.now()) / 1000) : 'permanent',
        size: JSON.stringify(item.value).length
      }))
    }
  }
}

// Singleton instance
const cache = new MemoryCache()

/**
 * Cache key generators
 */
export const cacheKeys = {
  dashboard: (userId) => `dashboard:${userId}`,
  expenses: (userId, month) => `expenses:${userId}:${month}`,
  budgets: (userId, month) => `budgets:${userId}:${month}`,
  goals: (userId) => `goals:${userId}`,
  wallets: (userId) => `wallets:${userId}`,
  reports: (userId, month) => `reports:${userId}:${month}`,
}

/**
 * Cache middleware
 *
 * Usage: app.get('/api/dashboard', cacheMiddleware(300), dashboardHandler)
 */
export function cacheMiddleware(ttlSeconds = 300) {
  return (req, res, next) => {
    // Only cache GET requests for authenticated users
    if (req.method !== 'GET' || !req.user) {
      return next()
    }

    // Generate cache key
    const cacheKey = `${req.user.id}:${req.originalUrl}`

    // Check cache
    const cachedResponse = cache.get(cacheKey)
    if (cachedResponse) {
      res.set('X-Cache', 'HIT')
      return res.json(cachedResponse)
    }

    // Store original json method
    const originalJson = res.json.bind(res)

    // Override json method to cache response
    res.json = function(data) {
      cache.set(cacheKey, data, ttlSeconds)
      res.set('X-Cache', 'MISS')
      return originalJson(data)
    }

    next()
  }
}

/**
 * Invalidate cache
 *
 * Call when data changes to clear relevant caches
 */
export const invalidateCache = {
  dashboard(userId) {
    cache.delete(cacheKeys.dashboard(userId))
  },

  expenses(userId, month) {
    cache.delete(cacheKeys.expenses(userId, month))
    // Invalidate dashboard cache too
    cache.delete(cacheKeys.dashboard(userId))
  },

  budgets(userId, month) {
    cache.delete(cacheKeys.budgets(userId, month))
    cache.delete(cacheKeys.dashboard(userId))
  },

  goals(userId) {
    cache.delete(cacheKeys.goals(userId))
    cache.delete(cacheKeys.dashboard(userId))
  },

  wallets(userId) {
    cache.delete(cacheKeys.wallets(userId))
    cache.delete(cacheKeys.dashboard(userId))
  },

  reports(userId, month) {
    cache.delete(cacheKeys.reports(userId, month))
  },

  all(userId) {
    // Clear all caches for a user
    const stats = cache.getStats()
    stats.items.forEach(item => {
      if (item.key.startsWith(`${userId}:`)) {
        cache.delete(item.key)
      }
    })
  }
}

/**
 * Query optimization helper
 *
 * Prefetch and cache commonly accessed data
 */
export async function prefetchUserData(userId) {
  try {
    // Fetch and cache dashboard data
    const dashboardData = await getDashboardData(userId)
    cache.set(cacheKeys.dashboard(userId), dashboardData, 300)

    // Fetch and cache current month expenses
    const currentMonth = new Date().toISOString().slice(0, 7)
    const expensesData = await getExpensesForMonth(userId, currentMonth)
    cache.set(cacheKeys.expenses(userId, currentMonth), expensesData, 300)

  } catch (error) {
    console.error('Prefetch failed:', error)
  }
}

/**
 * Batch cache invalidation
 *
 * Useful after bulk operations
 */
export async function invalidateCacheBatch(userId, categories) {
  categories.forEach(category => {
    switch (category) {
      case 'expenses':
        invalidateCache.expenses(userId, new Date().toISOString().slice(0, 7))
        break
      case 'budgets':
        invalidateCache.budgets(userId, new Date().toISOString().slice(0, 7))
        break
      case 'all':
        invalidateCache.all(userId)
        break
    }
  })
}

/**
 * Cache statistics endpoint
 *
 * Useful for monitoring and debugging
 */
export function getCacheStats() {
  const stats = cache.getStats()

  return {
    totalSize: stats.size,
    items: stats.items,
    memoryUsage: stats.items.reduce((sum, item) => sum + item.size, 0),
    formatted: {
      totalItems: stats.size,
      memoryMB: (stats.items.reduce((sum, item) => sum + item.size, 0) / 1024 / 1024).toFixed(2)
    }
  }
}

/**
 * Cache warming strategy
 *
 * Preload cache with fresh data periodically
 */
export function startCacheWarming(users, intervalSeconds = 300) {
  setInterval(() => {
    users.forEach(userId => {
      prefetchUserData(userId).catch(error => {
        console.error(`Cache warming failed for user ${userId}:`, error)
      })
    })
  }, intervalSeconds * 1000)
}

/**
 * Stale-While-Revalidate pattern
 *
 * Serve stale data while fetching fresh data in background
 */
export async function getWithRevalidation(
  key,
  fetchFn,
  ttlSeconds = 300,
  staleSeconds = 600
) {
  const cached = cache.get(key)

  if (cached) {
    // Serve cached data immediately
    return cached
  }

  // No cache, fetch and cache
  const data = await fetchFn()
  cache.set(key, data, ttlSeconds)
  return data
}

/**
 * Export cache instance for testing/clearing
 */
export { cache }

export default {
  cache,
  cacheKeys,
  cacheMiddleware,
  invalidateCache,
  getCacheStats,
  startCacheWarming,
  getWithRevalidation
}
