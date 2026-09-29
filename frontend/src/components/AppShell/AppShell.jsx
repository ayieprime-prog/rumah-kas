import { Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Home, Wallet, Calendar, Users, Settings, Loader2 } from 'lucide-react'

/**
 * App Shell Component
 * Minimal shell that loads instantly, content loads progressively
 *
 * `user` is passed in as a prop (e.g. { name }) rather than pulled from a
 * global auth context, since this project has no such context yet.
 */
export function AppShell({ children, user }) {
  const location = useLocation()
  const [isShellReady, setIsShellReady] = useState(false)

  useEffect(() => {
    // Mark shell as ready immediately
    setIsShellReady(true)
  }, [])

  if (!isShellReady) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header - Always visible */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RK</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                RumahKas
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
                    {user.name || 'User'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto w-full">
          <Suspense fallback={<AppShellFallback />}>
            {children}
          </Suspense>
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
        <BottomNavigation currentPath={location.pathname} />
      </nav>

      {/* Bottom Navigation - Desktop */}
      <nav className="hidden md:block bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <SideNavigation currentPath={location.pathname} />
      </nav>
    </div>
  )
}

/**
 * Bottom Navigation for Mobile
 */
function BottomNavigation({ currentPath }) {
  const navItems = [
    { icon: Home, label: 'Beranda', path: '/', ariaLabel: 'Home' },
    { icon: Wallet, label: 'Keuangan', path: '/keuangan', ariaLabel: 'Finance' },
    { icon: Calendar, label: 'Kalender', path: '/kalender', ariaLabel: 'Calendar' },
    { icon: Users, label: 'Berdua', path: '/berdua', ariaLabel: 'Shared' },
    { icon: Settings, label: 'Lainnya', path: '/lainnya', ariaLabel: 'Settings' }
  ]

  return (
    <div className="flex items-center justify-around h-16">
      {navItems.map(item => {
        const Icon = item.icon
        const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path)

        return (
          <a
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
            aria-label={item.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium truncate">{item.label}</span>
          </a>
        )
      })}
    </div>
  )
}

/**
 * Side Navigation for Desktop
 */
function SideNavigation({ currentPath }) {
  const navItems = [
    { icon: Home, label: 'Beranda', path: '/', ariaLabel: 'Home' },
    { icon: Wallet, label: 'Keuangan', path: '/keuangan', ariaLabel: 'Finance' },
    { icon: Calendar, label: 'Kalender', path: '/kalender', ariaLabel: 'Calendar' },
    { icon: Users, label: 'Berdua', path: '/berdua', ariaLabel: 'Shared' },
    { icon: Settings, label: 'Lainnya', path: '/lainnya', ariaLabel: 'Settings' }
  ]

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col gap-2">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path)

          return (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

/**
 * App Shell Fallback Loading State
 */
function AppShellFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
      <p className="text-gray-600 dark:text-gray-400">Memuat halaman...</p>
    </div>
  )
}

export default AppShell
