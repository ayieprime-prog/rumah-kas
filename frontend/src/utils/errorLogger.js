/**
 * Central error logging utility
 * Logs errors to console with structured format
 */

export function logError(error, context = {}) {
  const errorInfo = {
    message: error?.message || 'Unknown error',
    code: error?.code,
    timestamp: new Date().toISOString(),
    context,
    stack: error?.stack
  }

  console.error('[App Error]', errorInfo)
}

export function logAsync(promise, operationName) {
  return promise.catch(error => {
    logError(error, { operation: operationName })
    throw error
  })
}

export function createAsyncHandler(operationName) {
  return (error) => {
    logError(error, { operation: operationName })
    throw error
  }
}
