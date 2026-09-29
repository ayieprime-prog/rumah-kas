import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught React error:', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1C2422',
              marginBottom: '12px'
            }}>
              Terjadi Kesalahan
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Aplikasi mengalami masalah yang tidak terduga. Silakan muat ulang halaman untuk melanjutkan.
            </p>
            <details style={{
              marginBottom: '24px',
              textAlign: 'left',
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#666'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600' }}>Detail Error</summary>
              <pre style={{
                marginTop: '8px',
                overflow: 'auto',
                maxHeight: '200px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error?.message}
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2F5D50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1f4739'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2F5D50'}
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
