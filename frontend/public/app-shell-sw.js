/**
 * App Shell Service Worker
 * Specialized handler for app shell caching and offline support
 */

const SHELL_CACHE = 'rumahkas-shell-v1'
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
]

const CRITICAL_PAGES = [
  '/dashboard',
  '/keuangan',
  '/calendar'
]

/**
 * Install: Cache app shell
 */
self.addEventListener('install', event => {
  console.log('[App Shell] Installing...')

  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => {
      console.log('[App Shell] Caching shell URLs')
      return cache.addAll(APP_SHELL_URLS)
    }).then(() => {
      self.skipWaiting()
    })
  )
})

/**
 * Activate: Use new shell cache
 */
self.addEventListener('activate', event => {
  console.log('[App Shell] Activating...')

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('rumahkas-shell') && name !== SHELL_CACHE)
          .map(name => {
            console.log('[App Shell] Removing old cache:', name)
            return caches.delete(name)
          })
      )
    }).then(() => {
      self.clients.claim()
    })
  )
})

/**
 * Fetch: Shell-first strategy
 *
 * For shell (HTML):
 * 1. Try cache first (instant load)
 * 2. Fall back to network
 * 3. If both fail, serve offline shell
 *
 * For assets:
 * 1. Try cache
 * 2. Fall back to network
 * 3. Cache successful responses
 */
self.addEventListener('fetch', event => {
  const { request } = event
  const { url } = request

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // HTML pages: Shell-first
  if (isHtmlRequest(url)) {
    event.respondWith(shellFirstStrategy(request))
    return
  }

  // Assets: Cache-first
  if (isAssetRequest(url)) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // API: Network-first
  if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request))
    return
  }
})

/**
 * Shell-first strategy
 * Serve from cache, update from network
 */
async function shellFirstStrategy(request) {
  try {
    // Try cache first
    const cached = await caches.match(request)
    if (cached) {
      console.log('[App Shell] Cache HIT:', request.url)
      // Update cache in background
      updateCacheInBackground(request)
      return cached
    }

    // Try network
    console.log('[App Shell] Cache MISS, fetching:', request.url)
    const response = await fetch(request)

    if (response && response.status === 200) {
      // Cache successful response
      const cache = await caches.open(SHELL_CACHE)
      cache.put(request, response.clone())
      return response
    }

    return response
  } catch (error) {
    console.error('[App Shell] Fetch failed:', error)
    // Return offline shell
    return offlineShell()
  }
}

/**
 * Cache-first strategy for assets
 */
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(SHELL_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('Asset not found', { status: 404 })
  }
}

/**
 * Network-first strategy for APIs
 */
async function networkFirstStrategy(request) {
  try {
    return await fetch(request)
  } catch (error) {
    const cached = await caches.match(request)
    return cached || new Response(
      JSON.stringify({ error: 'Offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Update cache in background
 */
async function updateCacheInBackground(request) {
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(SHELL_CACHE)
      cache.put(request, response)
    }
  } catch (error) {
    console.warn('[App Shell] Background update failed:', error)
  }
}

/**
 * Offline shell response
 */
function offlineShell() {
  return new Response(
    `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RumahKas - Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      color: #1f2937;
    }
    .container {
      max-width: 24rem;
      margin: 0 auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.875rem;
      margin-bottom: 0.5rem;
    }
    p {
      color: #6b7280;
      margin-bottom: 2rem;
    }
    button {
      padding: 0.75rem 1.5rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
    }
    button:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📵</div>
    <h1>Offline</h1>
    <p>Anda sedang offline. Coba muat ulang atau coba lagi nanti.</p>
    <button onclick="location.reload()">Muat Ulang</button>
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    }
  )
}

/**
 * Check if request is HTML page
 */
function isHtmlRequest(url) {
  const urlObj = new URL(url, self.location)
  return urlObj.pathname === '/' || urlObj.pathname.endsWith('.html') || !urlObj.pathname.includes('.')
}

/**
 * Check if request is static asset
 */
function isAssetRequest(url) {
  return /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)(\?.*)?$/.test(url)
}

/**
 * Check if request is API call
 */
function isApiRequest(url) {
  return url.includes('/api/')
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_SHELL_CACHE') {
    caches.delete(SHELL_CACHE).then(() => {
      console.log('[App Shell] Cache cleared')
    })
  }

  if (event.data && event.data.type === 'PRELOAD_CRITICAL') {
    preloadCriticalPages()
  }
})

/**
 * Preload critical pages
 */
async function preloadCriticalPages() {
  try {
    const cache = await caches.open(SHELL_CACHE)
    for (const page of CRITICAL_PAGES) {
      try {
        const response = await fetch(page)
        if (response.status === 200) {
          cache.put(page, response)
          console.log('[App Shell] Preloaded:', page)
        }
      } catch (error) {
        console.warn('[App Shell] Failed to preload:', page)
      }
    }
  } catch (error) {
    console.error('[App Shell] Preload error:', error)
  }
}

console.log('[App Shell] Service Worker loaded and ready')
