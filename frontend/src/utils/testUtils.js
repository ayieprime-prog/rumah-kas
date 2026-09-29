import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Custom render function that wraps components with Router
function render(
  ui,
  {
    route = '/',
    ...renderOptions
  } = {},
) {
  // Set the initial route
  window.history.pushState({}, 'Test page', route)

  function Wrapper({ children }) {
    return <BrowserRouter>{children}</BrowserRouter>
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

export * from '@testing-library/react'
export { render }
