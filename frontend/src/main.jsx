import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Global error handlers - catch unhandled errors and rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled Promise rejection:', event.reason)
})

window.addEventListener('error', event => {
  console.error('Runtime error:', event.error)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
