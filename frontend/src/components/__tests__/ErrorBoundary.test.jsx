import React from 'react'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test error')
}

// Component that renders successfully
const WorkingComponent = () => <div>Working component</div>

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Working component')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument()
    expect(screen.getByText(/mengalami masalah/i)).toBeInTheDocument()
  })

  it('shows reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    const reloadButton = screen.getByRole('button', {
      name: /muat ulang/i
    })
    expect(reloadButton).toBeInTheDocument()
  })

  it('logs error to console when error occurs', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
