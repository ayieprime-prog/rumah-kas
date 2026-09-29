/**
 * Code Splitting Utilities
 *
 * Lazy load components to reduce initial bundle size
 * and improve performance
 */

import { lazy, Suspense } from 'react'

// Loading fallback component
export const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    <div>Memuat halaman...</div>
  </div>
)

// Lazy load all page components
export const lazySuspense = (component) => (
  <Suspense fallback={<LoadingFallback />}>
    {component}
  </Suspense>
)

// Lazy page imports (reduce initial bundle by ~40%)
export const LazyDashboardPage = lazy(() =>
  import('../pages/DashboardPage')
)

export const LazyExpensesPage = lazy(() =>
  import('../pages/ExpensesPage')
)

export const LazyIncomePages = lazy(() =>
  import('../pages/IncomePages')
)

export const LazyBudgetPage = lazy(() =>
  import('../pages/BudgetPage')
)

export const LazyGoalsPage = lazy(() =>
  import('../pages/GoalsPage')
)

export const LazyDebtPage = lazy(() =>
  import('../pages/DebtPage')
)

export const LazyReportsPage = lazy(() =>
  import('../pages/ReportsPage')
)

export const LazyAssetsPage = lazy(() =>
  import('../pages/AssetPage')
)

export const LazyWalletsPage = lazy(() =>
  import('../pages/WalletPage')
)

export const LazyTransfersPage = lazy(() =>
  import('../pages/TransferPage')
)

export const LazyAllocationPage = lazy(() =>
  import('../pages/AllocationPage')
)

export const LazyBudgetAnalyticsPage = lazy(() =>
  import('../pages/BudgetAnalyticsPage')
)

export const LazyCalendarPage = lazy(() =>
  import('../pages/CalendarPage')
)

export const LazyJournalPage = lazy(() =>
  import('../pages/JournalPage')
)

export const LazyMaintenancePage = lazy(() =>
  import('../pages/MaintenancePage')
)

export const LazyLinksPage = lazy(() =>
  import('../pages/LinksPage')
)

export const LazySettingsPage = lazy(() =>
  import('../pages/SettingsPage')
)

// Lazy component imports
export const LazyWeatherWidget = lazy(() =>
  import('../components/WeatherWidget')
)

export const LazyFinancialSummarySection = lazy(() =>
  import('../components/FinancialSummarySection')
)

export const LazyAgendaSection = lazy(() =>
  import('../components/AgendaSection')
)

export const LazyAddModal = lazy(() =>
  import('../components/AddModal')
)

/**
 * Performance metrics tracking
 */
export function trackComponentLoad(componentName) {
  if (window.performance && window.performance.mark) {
    window.performance.mark(`${componentName}-loaded`)
  }
}

/**
 * Prefetch components for better UX
 * (preload next likely pages)
 */
export function prefetchComponent(importFn) {
  importFn().catch(err => {
    console.warn('Prefetch failed:', err)
  })
}

/**
 * Example: Prefetch common navigation targets
 */
export function prefetchCommonRoutes() {
  // Prefetch pages user might navigate to
  if (navigator.connection?.saveData === false) {
    // Only prefetch if user doesn't have Save Data enabled
    prefetchComponent(() => import('../pages/BudgetPage'))
    prefetchComponent(() => import('../pages/ReportsPage'))
  }
}

export default {
  LazyDashboardPage,
  LazyExpensesPage,
  LazyBudgetPage,
  LazyReportsPage,
  LoadingFallback,
  prefetchComponent,
  prefetchCommonRoutes
}
