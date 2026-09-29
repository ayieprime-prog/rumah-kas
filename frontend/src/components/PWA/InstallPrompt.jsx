import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import './InstallPrompt.css'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
      console.log('App is installable')
    }

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
      console.log('App installed successfully')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setIsInstallable(false)
    }
  }

  const handleDismiss = () => {
    setIsInstallable(false)
  }

  // Don't show if already installed or not installable
  if (!isInstallable) return null

  return (
    <div className="install-prompt">
      <div className="install-prompt-inner">
        <Download size={20} className="install-prompt-icon" />
        <div style={{ flex: 1 }}>
          <p className="install-prompt-title">Pasang Aplikasi</p>
          <p className="install-prompt-body">
            Tambahkan Pundi ke layar utama untuk akses cepat
          </p>
          <div className="install-prompt-actions">
            <button onClick={handleInstall} className="install-prompt-btn-primary">
              Pasang
            </button>
            <button onClick={handleDismiss} className="install-prompt-btn-secondary">
              Nanti
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt
