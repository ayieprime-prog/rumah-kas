import { renderHook, waitFor } from '@testing-library/react'
import {
  appShell,
  progressiveLoader,
  useAppShell,
  intelligentPrefetch
} from '../appShellUtils'

/**
 * jsdom doesn't implement the Cache Storage API (`caches`, `Response`), so
 * we provide a minimal in-memory stand-in scoped to this test file.
 */
class FakeResponse {
  constructor(body, init = {}) {
    this._body = body
    this.headers = init.headers || {}
  }
  async text() {
    return this._body
  }
  async blob() {
    return { size: this._body ? String(this._body).length : 0 }
  }
}

function createFakeCacheStorage() {
  const caches = new Map()
  return {
    async open(name) {
      if (!caches.has(name)) {
        caches.set(name, new Map())
      }
      const store = caches.get(name)
      return {
        async put(key, response) {
          store.set(key, response)
        },
        async match(key) {
          return store.get(key) || undefined
        },
        async keys() {
          return Array.from(store.keys())
        },
        async delete(key) {
          return store.delete(key)
        }
      }
    }
  }
}

describe('AppShellManager', () => {
  beforeEach(() => {
    appShell.loadedPages.clear()
    appShell.preloadQueue = []
    appShell.isPreloading = false
    appShell.shell = null
    global.Response = FakeResponse
  })

  afterEach(() => {
    delete global.caches
    delete global.Response
  })

  describe('initializeShell', () => {
    it('marks the shell initialized even without Cache Storage support', async () => {
      delete window.caches
      const result = await appShell.initializeShell()

      expect(result).toBe(true)
      expect(appShell.shell.initialized).toBe(true)
    })

    it('caches a shell marker when serviceWorker + caches are available', async () => {
      Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true })
      global.caches = createFakeCacheStorage()

      const result = await appShell.initializeShell()

      expect(result).toBe(true)
      const cache = await global.caches.open('rumahkas-shell-v1')
      const cached = await cache.match('/shell')
      expect(cached).toBeDefined()
    })
  })

  describe('preloadPage / isPageLoaded / markPageLoaded / getLoadedPages', () => {
    it('marks a page as loaded after preloading it', async () => {
      expect(appShell.isPageLoaded('/dashboard')).toBe(false)

      await appShell.preloadPage('/dashboard', null)

      expect(appShell.isPageLoaded('/dashboard')).toBe(true)
      expect(appShell.getLoadedPages()).toContain('/dashboard')
    })

    it('markPageLoaded records a page without going through preloadPage', () => {
      appShell.markPageLoaded('/settings')
      expect(appShell.isPageLoaded('/settings')).toBe(true)
    })
  })

  describe('queuePagePreload / processPreloadQueue', () => {
    it('processes queued pages sequentially and marks them loaded', async () => {
      appShell.queuePagePreload('/a', null)
      appShell.queuePagePreload('/b', null)

      await waitFor(() => {
        expect(appShell.isPageLoaded('/a')).toBe(true)
        expect(appShell.isPageLoaded('/b')).toBe(true)
      }, { timeout: 2000 })
    })

    it('prefetchCriticalPages queues dashboard, keuangan and calendar', async () => {
      await appShell.prefetchCriticalPages()

      await waitFor(() => {
        expect(appShell.isPageLoaded('/dashboard')).toBe(true)
        expect(appShell.isPageLoaded('/keuangan')).toBe(true)
        expect(appShell.isPageLoaded('/calendar')).toBe(true)
      }, { timeout: 2000 })
    })
  })

  describe('cacheShellPage / getCachedShellPage', () => {
    it('returns null when Cache Storage is unavailable', async () => {
      delete window.caches
      await appShell.cacheShellPage('/p', '<html></html>')
      expect(await appShell.getCachedShellPage('/p')).toBeNull()
    })

    it('round-trips page content through the cache', async () => {
      global.caches = createFakeCacheStorage()

      await appShell.cacheShellPage('/p', '<html>hello</html>')
      const content = await appShell.getCachedShellPage('/p')

      expect(content).toBe('<html>hello</html>')
    })

    it('returns null for a page that was never cached', async () => {
      global.caches = createFakeCacheStorage()
      expect(await appShell.getCachedShellPage('/nope')).toBeNull()
    })
  })

  describe('clearShellCache / getShellCacheSize', () => {
    it('reports zero size and no-ops clearing when unsupported', async () => {
      delete window.caches
      await expect(appShell.clearShellCache()).resolves.toBeUndefined()
      expect(await appShell.getShellCacheSize()).toBe(0)
    })

    it('clears every cached entry', async () => {
      global.caches = createFakeCacheStorage()
      await appShell.cacheShellPage('/a', 'AAAA')
      await appShell.cacheShellPage('/b', 'BBBB')

      await appShell.clearShellCache()

      expect(await appShell.getCachedShellPage('/a')).toBeNull()
      expect(await appShell.getCachedShellPage('/b')).toBeNull()
    })

    it('sums the size of cached entries', async () => {
      global.caches = createFakeCacheStorage()
      await appShell.cacheShellPage('/a', 'AAAA') // 4 bytes via FakeResponse.blob()
      await appShell.cacheShellPage('/b', 'BB')   // 2 bytes

      const size = await appShell.getShellCacheSize()
      expect(size).toBe(6)
    })
  })
})

describe('ProgressiveContentLoader', () => {
  it('tracks loading state around a successful fetch', async () => {
    const loader = progressiveLoader
    const fetchFn = jest.fn().mockResolvedValue('data')

    const promise = loader.loadContent('key1', fetchFn)
    expect(loader.isLoading('key1')).toBe(true)

    const result = await promise
    expect(result).toBe('data')
    expect(loader.isLoading('key1')).toBe(false)
  })

  it('clears loading state and rethrows on failure', async () => {
    const loader = progressiveLoader
    const fetchFn = jest.fn().mockRejectedValue(new Error('boom'))

    await expect(loader.loadContent('key2', fetchFn)).rejects.toThrow('boom')
    expect(loader.isLoading('key2')).toBe(false)
  })

  it('loadMultiple reports per-item success and failure without aborting the batch', async () => {
    const loader = progressiveLoader
    const results = await loader.loadMultiple([
      { key: 'ok', fetchFn: async () => 'value' },
      { key: 'fail', fetchFn: async () => { throw new Error('nope') } }
    ])

    expect(results.get('ok')).toEqual({ success: true, data: 'value' })
    expect(results.get('fail').success).toBe(false)
    expect(results.get('fail').error).toBeInstanceOf(Error)
  })

  it('isLoading defaults to false for an unknown key', () => {
    expect(progressiveLoader.isLoading('never-touched')).toBe(false)
  })
})

describe('useAppShell hook', () => {
  beforeEach(() => {
    appShell.loadedPages.clear()
    appShell.preloadQueue = []
    appShell.isPreloading = false
    delete window.caches
  })

  it('initializes and prefetches critical pages', async () => {
    const { result } = renderHook(() => useAppShell())

    expect(result.current.isInitialized).toBe(false)

    await waitFor(() => expect(result.current.isInitialized).toBe(true))
  })
})

describe('intelligentPrefetch', () => {
  beforeEach(() => {
    appShell.loadedPages.clear()
    appShell.preloadQueue = []
    appShell.isPreloading = false
  })

  it('queues keuangan and calendar when coming from the dashboard', async () => {
    await intelligentPrefetch('/')

    await waitFor(() => {
      expect(appShell.isPageLoaded('/keuangan')).toBe(true)
      expect(appShell.isPageLoaded('/calendar')).toBe(true)
    })
  })

  it('queues nothing for an unmapped path', async () => {
    await intelligentPrefetch('/unknown-page')
    expect(appShell.preloadQueue).toHaveLength(0)
  })
})
