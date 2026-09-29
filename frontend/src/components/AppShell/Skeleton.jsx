/**
 * Skeleton Loading Components
 * Placeholders while content loads progressively
 */

import { Suspense } from 'react'

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4 p-4">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonList() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden animate-pulse">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>

      {/* Rows */}
      {[1, 2, 3].map(row => (
        <div key={row} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          {[1, 2, 3, 4].map(col => (
            <div key={col} className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="space-y-2 mb-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-2">
            <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
      <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  )
}

export function SkeletonForm() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i}>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
      {/* Page title */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>

      {/* Content */}
      <SkeletonDashboard />
    </div>
  )
}

/**
 * Skeleton provider component
 */
export function withSkeleton(Component, SkeletonComponent) {
  return function SkeletonWrapper(props) {
    return (
      <Suspense fallback={<SkeletonComponent />}>
        <Component {...props} />
      </Suspense>
    )
  }
}

export default {
  SkeletonCard,
  SkeletonDashboard,
  SkeletonList,
  SkeletonTable,
  SkeletonChart,
  SkeletonForm,
  SkeletonPage,
  withSkeleton
}
