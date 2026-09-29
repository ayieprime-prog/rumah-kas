import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { offlineStorage } from './utils/offlineStorage'
import { trackWebVitals, reportBundleMetrics } from './utils/performanceMonitoring'

// Global error handlers - catch unhandled errors and rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled Promise rejection:', event.reason)
})

window.addEventListener('error', event => {
  console.error('Runtime error:', event.error)
})

// Register the offline/caching service worker. Registered on 'load' so it
// never competes with the initial page render for bandwidth/CPU.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(error => {
      console.error('Service worker registration failed:', error)
    })
  })
}

// Open the IndexedDB connection used for offline expense queueing early,
// so it's ready before any page tries to read/write it.
offlineStorage.initialize().catch(error => {
  console.error('Failed to initialize offline storage:', error)
})

// Web Vitals (LCP/FID/CLS) and navigation timing - logs to console in dev,
// and reports genuinely slow metrics (>1s) to the backend so they show up
// under Settings > Performa.
trackWebVitals()
window.addEventListener('load', () => {
  // Wait a beat so all of the page's own resource-timing entries have
  // actually landed before reading them.
  setTimeout(reportBundleMetrics, 0)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
