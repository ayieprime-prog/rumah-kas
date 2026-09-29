# PWA Components Integration Guide

## Components Overview

### 1. OfflineBanner
Displays when user goes offline, shows pending sync items, and provides manual sync button.

**File:** `OfflineBanner.jsx`

**Usage:**
```jsx
import { OfflineBanner } from './components/PWA/OfflineBanner'

function App() {
  return (
    <>
      <OfflineBanner />
      {/* Rest of app */}
    </>
  )
}
```

**Features:**
- Shows "You are offline" message
- Displays pending item count
- Shows sync status (syncing/success/error)
- Manual sync button when online
- Auto-hides when back online
- Dark mode support

**Styling:** Uses Tailwind CSS with yellow color scheme for offline state

---

### 2. InstallPrompt
Shows install prompt when PWA is installable (not already installed).

**File:** `InstallPrompt.jsx`

**Usage:**
```jsx
import { InstallPrompt } from './components/PWA/InstallPrompt'

function App() {
  return (
    <>
      <InstallPrompt />
      {/* Rest of app */}
    </>
  )
}
```

**Features:**
- Shows install prompt at bottom-right
- "Pasang" (Install) and "Nanti" (Later) buttons
- Detects if already installed (standalone mode)
- Auto-hides when installed
- Responsive design
- Dark mode support

**Styling:** Uses Tailwind CSS with floating card design

---

## App.jsx Integration

### Step 1: Register Service Worker

Add to `frontend/src/main.jsx`:

```javascript
// ============================================
// Service Worker Registration
// ============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js')
      console.log('✅ Service Worker registered:', registration)
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('🔄 Service Worker updated, new version available')
            // You could show a "Update Available" notification here
          }
        })
      })
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error)
    }
  })

  // Handle Service Worker controller change
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker controller changed')
    // Optionally reload to get new version
    // window.location.reload()
  })
}
```

### Step 2: Add PWA Meta Tags

In `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json">
  
  <!-- Theme Color for mobile browsers -->
  <meta name="theme-color" content="#1f2937">
  
  <!-- iOS PWA Support -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Pundi">
  
  <!-- App Icons -->
  <link rel="apple-touch-icon" href="/logo-192.png">
  <link rel="icon" type="image/png" href="/logo-192.png" sizes="192x192">
  <link rel="icon" type="image/png" href="/logo-512.png" sizes="512x512">
  
  <title>RumahKas - Manajemen Keuangan Keluarga</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

### Step 3: Update App.jsx

```jsx
import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { InstallPrompt } from './components/PWA/InstallPrompt'
import { OfflineBanner } from './components/PWA/OfflineBanner'
import { offlineStorage } from './utils/offlineStorage'

// Initialize offline storage
offlineStorage.initialize()

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* PWA Components */}
        <OfflineBanner />
        <InstallPrompt />
        
        {/* Main App Content */}
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Your routes */}
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}
```

---

## Offline Data Flow

### Save Expense Offline

```javascript
import { offlineStorage } from '../utils/offlineStorage'
import axios from 'axios'

async function handleAddExpense(expenseData) {
  try {
    // Try API first (when online)
    const response = await axios.post('/api/expenses', expenseData)
    return response.data
  } catch (error) {
    if (!navigator.onLine || error.response?.status === 503) {
      // Save offline
      const saved = await offlineStorage.saveExpense(expenseData)
      
      // Queue for sync
      await offlineStorage.queueAction({
        url: '/api/expenses',
        method: 'POST',
        body: expenseData,
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      console.log('💾 Expense saved offline, will sync when online')
      return saved
    }
    throw error
  }
}
```

### Check Sync Status

```javascript
import { offlineStorage } from '../utils/offlineStorage'

async function getSyncStatus() {
  const stats = await offlineStorage.getStats()
  console.log('Storage stats:', {
    total_expenses: stats.expenses,
    pending_sync: stats.unsyncedCount,
    storage_size_bytes: stats.storageSize
  })
}
```

---

## Testing PWA

### Local Testing

1. **Chrome DevTools - Application Tab:**
   - Check "Manifest" for validation
   - Check "Service Workers" for registration
   - Check "Cache Storage" for cached items
   - Check "IndexedDB" for offline data

2. **Test Offline Mode:**
   ```bash
   # In DevTools Network tab
   # Check "Offline" checkbox
   # Reload page - should load from cache
   # Try adding expense - should queue for sync
   ```

3. **Test Installation:**
   ```bash
   # Android Chrome: Should show "Install app" prompt
   # Desktop Chrome: Should show install prompt in address bar
   # iOS Safari: No automatic prompt, user adds manually
   ```

4. **Test Service Worker Update:**
   ```bash
   # Make change to code and redeploy
   # DevTools should show "Update Available"
   # Reload to activate new version
   ```

### Testing Sync

```javascript
// In Browser Console
import { offlineStorage, offlineSync } from './utils/offlineStorage'

// Simulate offline data
const test = await offlineStorage.saveExpense({
  amount: 10000,
  category: 'Food',
  description: 'Test expense'
})

// Check pending actions
const pending = await offlineStorage.getPendingActions()
console.log('Pending:', pending)

// Manually trigger sync (when online)
const result = await offlineSync.syncPendingActions()
console.log('Sync result:', result)
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ⚠️ | ✅ |
| InstallPrompt | ✅ | ✅ | ❌ | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Manifest | ✅ | ✅ | ⚠️ | ✅ |

**Notes:**
- Safari: Install via "Share → Add to Home Screen"
- Firefox: Desktop only, no installation
- Edge: Same support as Chrome

---

## Performance Monitoring

### Check Cache Hit Rate

```javascript
// Get service worker registration
const reg = await navigator.serviceWorker.ready

// Monitor network requests
const originalFetch = window.fetch
window.fetch = function(...args) {
  return originalFetch.apply(this, args).then(response => {
    const fromCache = response.headers.get('X-From-Cache')
    console.log('Cache:', fromCache ? 'HIT' : 'MISS', args[0])
    return response
  })
}
```

### Monitor Offline Storage

```javascript
import { offlineStorage } from './utils/offlineStorage'

// Get storage stats periodically
setInterval(async () => {
  const stats = await offlineStorage.getStats()
  if (stats.pending > 0) {
    console.log(`⏳ Waiting to sync: ${stats.pending} items`)
  }
}, 5000)
```

---

## Troubleshooting

### Service Worker not registering
- Check browser console for errors
- Verify `/service-worker.js` exists
- Check HTTPS (required for production)
- Clear Service Workers: DevTools > Application > Clear site data

### Install prompt not showing
- Check manifest.json is valid
- Requires HTTPS or localhost
- App must be used on multiple visits
- Check console for manifest errors

### Offline data not persisting
- Verify IndexedDB is enabled in browser
- Check storage quota not exceeded
- Try `offlineStorage.clearAll()` to reset
- Check browser's site storage settings

### Sync not working
- Verify Service Worker is active
- Check network in DevTools
- Manual sync via button in OfflineBanner
- Check browser console for errors

---

## Next Steps

1. ✅ Integrate components in App.jsx
2. ✅ Add Service Worker registration in main.jsx
3. ✅ Test offline functionality
4. ✅ Test installation prompts
5. ⬜ Add push notification handlers
6. ⬜ Monitor sync success rate
7. ⬜ Implement periodic background sync
8. ⬜ Add data conflict resolution

---

**Status:** Phase 5 PWA Infrastructure Complete - Ready for Integration
