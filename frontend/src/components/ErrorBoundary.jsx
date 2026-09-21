import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', gap: 16, padding: 24, textAlign: 'center', background: 'var(--light-color, #f7f2e8)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Terjadi kesalahan tak terduga</h2>
          <p style={{ color: '#8a8175', fontSize: 14, maxWidth: 320 }}>
            Halaman gagal ditampilkan. Coba muat ulang; kalau masih terjadi, hubungi admin.
          </p>
          <button className="btn-pill" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => window.location.reload()}>
            Muat Ulang
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
