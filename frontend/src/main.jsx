import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { offlineStorage } from './utils/offlineStorage'

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
