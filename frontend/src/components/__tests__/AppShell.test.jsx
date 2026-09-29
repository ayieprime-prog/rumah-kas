import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../AppShell/AppShell'

function renderShell(ui, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}

describe('AppShell', () => {
  it('renders the RumahKas header and its children', () => {
    renderShell(
      <AppShell>
        <div>Page Content</div>
      </AppShell>
    )

    expect(screen.getByText('RumahKas')).toBeInTheDocument()
    expect(screen.getByText('Page Content')).toBeInTheDocument()
  })

  it('does not render a user badge when no user is provided', () => {
    renderShell(<AppShell>{null}</AppShell>)
    expect(screen.queryByText('U')).not.toBeInTheDocument()
  })

  it("renders the user's initial and name when a user is provided", () => {
    renderShell(<AppShell user={{ name: 'Budi' }}>{null}</AppShell>)

    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('Budi')).toBeInTheDocument()
  })

  it('falls back to "U" / "User" for a user without a name', () => {
    renderShell(<AppShell user={{}}>{null}</AppShell>)

    expect(screen.getByText('U')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('renders all five navigation items in both mobile and desktop nav', () => {
    renderShell(<AppShell>{null}</AppShell>)

    // Each label appears twice: once in BottomNavigation, once in SideNavigation
    expect(screen.getAllByText('Beranda')).toHaveLength(2)
    expect(screen.getAllByText('Keuangan')).toHaveLength(2)
    expect(screen.getAllByText('Kalender')).toHaveLength(2)
    expect(screen.getAllByText('Berdua')).toHaveLength(2)
    expect(screen.getAllByText('Lainnya')).toHaveLength(2)
  })

  it('marks the link matching the current route as the active page', () => {
    renderShell(<AppShell>{null}</AppShell>, { route: '/keuangan' })

    const keuanganLinks = screen.getAllByText('Keuangan').map(el => el.closest('a'))
    keuanganLinks.forEach(link => expect(link).toHaveAttribute('aria-current', 'page'))

    const berandaLinks = screen.getAllByText('Beranda').map(el => el.closest('a'))
    berandaLinks.forEach(link => expect(link).not.toHaveAttribute('aria-current'))
  })
})
