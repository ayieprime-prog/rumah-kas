import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InstallPrompt } from '../PWA/InstallPrompt'

function firePrompt(overrides = {}) {
  const event = new Event('beforeinstallprompt', { cancelable: true })
  event.preventDefault = jest.fn()
  event.prompt = jest.fn()
  event.userChoice = Promise.resolve({ outcome: 'accepted' })
  Object.assign(event, overrides)
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

describe('InstallPrompt', () => {
  it('renders nothing before beforeinstallprompt fires', () => {
    const { container } = render(<InstallPrompt />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the install card once beforeinstallprompt fires', () => {
    render(<InstallPrompt />)
    firePrompt()

    expect(screen.getByText('Pasang Aplikasi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pasang' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nanti' })).toBeInTheDocument()
  })

  it('calls preventDefault on the captured event', () => {
    render(<InstallPrompt />)
    const event = firePrompt()
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
  })

  it('dismissing hides the card without prompting install', async () => {
    const user = userEvent.setup()
    render(<InstallPrompt />)
    const event = firePrompt()

    await user.click(screen.getByRole('button', { name: 'Nanti' }))

    expect(event.prompt).not.toHaveBeenCalled()
    expect(screen.queryByText('Pasang Aplikasi')).not.toBeInTheDocument()
  })

  it('clicking Pasang calls prompt() and hides the card on acceptance', async () => {
    const user = userEvent.setup()
    render(<InstallPrompt />)
    const event = firePrompt({ userChoice: Promise.resolve({ outcome: 'accepted' }) })

    await user.click(screen.getByRole('button', { name: 'Pasang' }))

    expect(event.prompt).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Pasang Aplikasi')).not.toBeInTheDocument()
  })

  it('keeps the card visible if the user dismisses the native prompt', async () => {
    const user = userEvent.setup()
    render(<InstallPrompt />)
    firePrompt({ userChoice: Promise.resolve({ outcome: 'dismissed' }) })

    await user.click(screen.getByRole('button', { name: 'Pasang' }))

    expect(screen.getByText('Pasang Aplikasi')).toBeInTheDocument()
  })

  it('hides the card when the app reports it was installed', () => {
    render(<InstallPrompt />)
    firePrompt()
    expect(screen.getByText('Pasang Aplikasi')).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })

    expect(screen.queryByText('Pasang Aplikasi')).not.toBeInTheDocument()
  })

  it('cleans up its event listeners on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = render(<InstallPrompt />)
    unmount()

    expect(removeSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function))
  })
})
