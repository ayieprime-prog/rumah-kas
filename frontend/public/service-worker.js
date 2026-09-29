/**
 * Service Worker untuk RumahKas PWA
 *
 * Fitur:
 * - Offline-first caching strategy
 * - Background sync
 * - Push notifications
 * - App installation
 */

const CACHE_NAME = 'rumahkas-v1'
const RUNTIME_CACHE = 'rumahkas-runtime-v1'
const ASSETS_CACHE = 'rumahkas-assets-v1'

// URL yang harus di-cache saat install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-192.png',
  '/logo-512.png'
]

// Install: Cache essential assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...')

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching essential assets')
      return cache.addAll(PRECACHE_URLS)
    }).then(() => {
      self.skipWaiting() // Activate immediately
    })
  )
})

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...')

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (![CACHE_NAME, RUNTIME_CACHE, ASSETS_CACHE].includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      self.clients.claim() // Claim clients immediately
    })
  )
})

// Fetch: Network-first for API, Cache-first for assets
self.addEventListener('fetch', event => {
  const { request } = event
  const { url } = request

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // API requests: Network-first with fallback
  if (url.includes('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Assets: Cache-first
  if (isAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Pages: Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request))
})

/**
 * Network-first strategy for API calls
 * Try network first, fall back to cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request)

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }

    // No cache, return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Network request failed and no cache available'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Cache-first strategy for assets
 * Use cache if available, fall back to network
 */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(ASSETS_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('Asset not found', { status: 404 })
  }
}

/**
 * Stale-while-revalidate for pages
 * Serve cache immediately, update in background
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(RUNTIME_CACHE)
      cache.then(c => c.put(request, response.clone()))
    }
    return response
  }).catch(() => {
    return cached || new Response('Offline', { status: 503 })
  })

  return cached || fetchPromise
}

/**
 * Check if URL is an asset (image, css, js, font, etc)
 */
function isAsset(url) {
  return /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)(\?.*)?$/.test(url)
}

/**
 * Background Sync untuk offline-first actions
 */
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag)

  if (event.tag === 'sync-expenses') {
    event.waitUntil(syncPendingData())
  }
})

async function syncPendingData() {
  try {
    // Get pending requests from IndexedDB
    const db = await openDB()
    const pending = await getAllPending(db)

    for (const item of pending) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body ? JSON.stringify(item.body) : undefined
        })

        if (response.ok) {
          await removePending(db, item.id)
          console.log('[Service Worker] Synced:', item.id)
        }
      } catch (error) {
        console.error('[Service Worker] Sync failed:', error)
        throw error // Retry
      }
    }
  } catch (error) {
    console.error('[Service Worker] Background sync error:', error)
    throw error // Retry
  }
}

/**
 * IndexedDB helpers
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rumahkas-offline', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = event => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id' })
      }
    }
  })
}

async function getAllPending(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending'], 'readonly')
    const store = transaction.objectStore('pending')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function removePending(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending'], 'readwrite')
    const store = transaction.objectStore('pending')
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Push notifications
 */
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification received')

  if (!event.data) {
    return
  }

  const options = {
    body: event.data.text(),
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    tag: 'rumahkas-notification'
  }

  event.waitUntil(
    self.registration.showNotification('RumahKas', options)
  )
})

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', event => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window if not open
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

console.log('[Service Worker] Loaded and ready')
