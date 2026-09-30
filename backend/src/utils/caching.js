/**
 * Response Caching Utilities
 *
 * Cache API responses to reduce database hits and improve response times.
 * Applied to GET /api/dashboard (see routes/dashboard.js); every mutation
 * that affects dashboard data (expenses, income, budget, goals, debt,
 * wallets, transfers) calls invalidateCache.dashboard() on success - see
 * the note on cacheMiddleware below before applying this to another route.
 */

// Simple in-memory cache (single-instance only - there's no shared store
// like Redis here, so this would need replacing before running more than
// one backend instance).
class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value, ttlSeconds = 300) {
    this.cache.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    return this.get(key) !== null;
  }

  getStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        ttl: item.expiresAt ? Math.round((item.expiresAt - Date.now()) / 1000) : 'permanent',
        size: JSON.stringify(item.value).length
      }))
    };
  }
}

const cache = new MemoryCache();

// Cache keys are household-scoped, matching this app's data model
// (Expense/Budget/Dashboard etc. all belong to a Household, not a User).
const cacheKeys = {
  dashboard: (householdId) => `dashboard:${householdId}`,
  neraca: (householdId) => `dashboard:${householdId}_neraca`,
  neracaSummary: (householdId) => `dashboard:${householdId}_neraca_summary`,
  expenses: (householdId, month) => `expenses:${householdId}:${month}`,
  budgets: (householdId, month) => `budgets:${householdId}:${month}`,
  goals: (householdId) => `goals:${householdId}`,
  wallets: (householdId) => `wallets:${householdId}`,
  reports: (householdId, month) => `reports:${householdId}:${month}`
};

/**
 * Cache middleware for a GET route.
 *
 * IMPORTANT: only apply this to a route whose mutating counterparts also
 * call the matching invalidateCache.* function on every successful write -
 * otherwise callers will see stale data for up to ttlSeconds after making a
 * change (e.g. adding an expense and not seeing it reflected on the
 * dashboard). Currently applied to GET /api/dashboard only, backed by
 * invalidateCache.dashboard() calls in expenses/income/budget/goals/debt/
 * wallets/transfers - keep that pairing in mind if this route's data
 * sources change, or before applying this middleware elsewhere.
 *
 * Usage: router.get('/', cacheMiddleware(req => cacheKeys.dashboard(req.householdId), 60), handler)
 */
function cacheMiddleware(keyFn, ttlSeconds = 300) {
  return (req, res, next) => {
    const cacheKey = keyFn(req);
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = function (data) {
      cache.set(cacheKey, data, ttlSeconds);
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

const invalidateCache = {
  dashboard(householdId) {
    cache.delete(cacheKeys.dashboard(householdId));
  },

  expenses(householdId, month) {
    cache.delete(cacheKeys.expenses(householdId, month));
    cache.delete(cacheKeys.dashboard(householdId));
  },

  budgets(householdId, month) {
    cache.delete(cacheKeys.budgets(householdId, month));
    cache.delete(cacheKeys.dashboard(householdId));
  },

  goals(householdId) {
    cache.delete(cacheKeys.goals(householdId));
    cache.delete(cacheKeys.dashboard(householdId));
  },

  wallets(householdId) {
    cache.delete(cacheKeys.wallets(householdId));
    cache.delete(cacheKeys.dashboard(householdId));
    cache.delete(cacheKeys.neraca(householdId));
    cache.delete(cacheKeys.neracaSummary(householdId));
  },

  reports(householdId, month) {
    cache.delete(cacheKeys.reports(householdId, month));
  },

  all(householdId) {
    const stats = cache.getStats();
    stats.items.forEach(item => {
      if (item.key.endsWith(`:${householdId}`) || item.key.includes(`:${householdId}:`)) {
        cache.delete(item.key);
      }
    });
  }
};

function getCacheStats() {
  const stats = cache.getStats();
  const memoryUsage = stats.items.reduce((sum, item) => sum + item.size, 0);

  return {
    totalSize: stats.size,
    items: stats.items,
    memoryUsage,
    formatted: {
      totalItems: stats.size,
      memoryMB: (memoryUsage / 1024 / 1024).toFixed(2)
    }
  };
}

module.exports = {
  cache,
  cacheKeys,
  cacheMiddleware,
  invalidateCache,
  getCacheStats
};
