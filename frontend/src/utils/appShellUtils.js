/**
 * App Shell Architecture Utilities
 * Progressive content loading and shell optimization
 */

class AppShellManager {
  constructor() {
    this.shell = null
    this.loadedPages = new Set()
    this.preloadQueue = []
    this.isPreloading = false
  }

  /**
   * Initialize app shell
   * Mark shell as loaded in cache
   */
  async initializeShell() {
    try {
      // Cache shell in service worker
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cache = await caches.open('rumahkas-shell-v1')
        const shellResponse = new Response(
          JSON.stringify({
            shell: true,
            timestamp: Date.now(),
            version: 1
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
        await cache.put('/shell', shellResponse)
      }

      this.shell = {
        initialized: true,
        timestamp: Date.now(),
        version: 1
      }

      console.log('✅ App shell initialized and cached')
      return true
    } catch (error) {
      console.error('Error initializing app shell:', error)
      return false
    }
  }

  /**
   * Preload a page component
   */
  async preloadPage(path, component) {
    try {
      // Simulate component loading
      await new Promise(resolve => setTimeout(resolve, 0))

      this.loadedPages.add(path)
      console.log(`📄 Preloaded: ${path}`)

      return true
    } catch (error) {
      console.error(`Error preloading ${path}:`, error)
      return false
    }
  }

  /**
   * Queue page for preloading
   */
  queuePagePreload(path, component) {
    this.preloadQueue.push({ path, component })
    this.processPreloadQueue()
  }

  /**
   * Process preload queue sequentially
   */
  async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return
    }

    this.isPreloading = true

    while (this.preloadQueue.length > 0) {
      const { path, component } = this.preloadQueue.shift()
      await this.preloadPage(path, component)

      // Prevent blocking main thread
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.isPreloading = false
    console.log('✅ Preload queue processed')
  }

  /**
   * Prefetch critical pages on app load
   */
  async prefetchCriticalPages() {
    const criticalPages = [
      '/dashboard',
      '/keuangan',
      '/calendar'
    ]

    console.log('🔄 Prefetching critical pages...')

    for (const path of criticalPages) {
      this.queuePagePreload(path, null)
    }
  }

  /**
   * Get page load status
   */
  isPageLoaded(path) {
    return this.loadedPages.has(path)
  }

  /**
   * Mark page as loaded
   */
  markPageLoaded(path) {
    this.loadedPages.add(path)
  }

  /**
   * Get loaded pages
   */
  getLoadedPages() {
    return Array.from(this.loadedPages)
  }

  /**
   * Cache shell pages on first visit
   */
  async cacheShellPage(path, content) {
    try {
      if (!('caches' in window)) return

      const cache = await caches.open('rumahkas-shell-v1')
      const response = new Response(content, {
        headers: { 'Content-Type': 'text/html' }
      })
      await cache.put(path, response)

      console.log(`💾 Cached shell page: ${path}`)
    } catch (error) {
      console.error(`Error caching shell page ${path}:`, error)
    }
  }

  /**
   * Get cached shell page
   */
  async getCachedShellPage(path) {
    try {
      if (!('caches' in window)) return null

      const cache = await caches.open('rumahkas-shell-v1')
      const response = await cache.match(path)

      return response ? await response.text() : null
    } catch (error) {
      console.error(`Error getting cached shell page ${path}:`, error)
      return null
    }
  }

  /**
   * Clear shell cache
   */
  async clearShellCache() {
    try {
      if (!('caches' in window)) return

      const cache = await caches.open('rumahkas-shell-v1')
      const keys = await cache.keys()

      for (const request of keys) {
        await cache.delete(request)
      }

      console.log('🧹 Cleared shell cache')
    } catch (error) {
      console.error('Error clearing shell cache:', error)
    }
  }

  /**
   * Get shell cache size
   */
  async getShellCacheSize() {
    try {
      if (!('caches' in window)) return 0

      const cache = await caches.open('rumahkas-shell-v1')
      const keys = await cache.keys()

      let totalSize = 0
      for (const request of keys) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          totalSize += blob.size
        }
      }

      return totalSize
    } catch (error) {
      console.error('Error getting shell cache size:', error)
      return 0
    }
  }
}

// Singleton instance
export const appShell = new AppShellManager()

/**
 * Progressive content loader
 */
export class ProgressiveContentLoader {
  constructor() {
    this.loadingStates = new Map()
  }

  /**
   * Set loading state for a component
   */
  setLoading(key, isLoading) {
    this.loadingStates.set(key, isLoading)
  }

  /**
   * Get loading state
   */
  isLoading(key) {
    return this.loadingStates.get(key) || false
  }

  /**
   * Load content progressively
   */
  async loadContent(key, fetchFn) {
    try {
      this.setLoading(key, true)
      const content = await fetchFn()
      this.setLoading(key, false)
      return content
    } catch (error) {
      console.error(`Error loading content for ${key}:`, error)
      this.setLoading(key, false)
      throw error
    }
  }

  /**
   * Load multiple items progressively
   */
  async loadMultiple(items) {
    const results = new Map()

    for (const { key, fetchFn } of items) {
      try {
        const content = await this.loadContent(key, fetchFn)
        results.set(key, { success: true, data: content })
      } catch (error) {
        results.set(key, { success: false, error })
      }
    }

    return results
  }
}

export const progressiveLoader = new ProgressiveContentLoader()

/**
 * React hook for app shell
 */
export function useAppShell() {
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [loadedPages, setLoadedPages] = React.useState([])

  React.useEffect(() => {
    initializeShell()
  }, [])

  const initializeShell = async () => {
    await appShell.initializeShell()
    await appShell.prefetchCriticalPages()
    setIsInitialized(true)
  }

  const preloadPage = async (path) => {
    await appShell.preloadPage(path, null)
    setLoadedPages([...appShell.getLoadedPages()])
  }

  const isPageLoaded = (path) => {
    return appShell.isPageLoaded(path)
  }

  return {
    isInitialized,
    loadedPages,
    preloadPage,
    isPageLoaded
  }
}

/**
 * Route-based code splitting with progressive loading
 */
export const lazyRoutes = {
  dashboard: () => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })),
  keuangan: () => import('../pages/Keuangan').then(m => ({ default: m.Keuangan })),
  calendar: () => import('../pages/Calendar').then(m => ({ default: m.Calendar })),
  shared: () => import('../pages/Shared').then(m => ({ default: m.Shared })),
  settings: () => import('../pages/Settings').then(m => ({ default: m.Settings })),
  expenses: () => import('../pages/Expenses').then(m => ({ default: m.Expenses })),
  budgets: () => import('../pages/Budgets').then(m => ({ default: m.Budgets })),
  goals: () => import('../pages/Goals').then(m => ({ default: m.Goals })),
  reports: () => import('../pages/Reports').then(m => ({ default: m.Reports }))
}

/**
 * Intelligent route preloading
 */
export async function intelligentPrefetch(currentPath) {
  // Prefetch next likely pages based on current page
  const prefetchMap = {
    '/': ['/keuangan', '/calendar'], // Dashboard → Keuangan, Calendar
    '/keuangan': ['/expenses', '/budgets'], // Keuangan → Expenses, Budgets
    '/calendar': ['/shared'], // Calendar → Shared
    '/settings': [] // Settings is end point
  }

  const nextPages = prefetchMap[currentPath] || []

  for (const path of nextPages) {
    appShell.queuePagePreload(path, null)
  }
}

export default {
  appShell,
  progressiveLoader,
  lazyRoutes,
  useAppShell,
  intelligentPrefetch
}
