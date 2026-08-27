import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'
import useAuthStore from '../store/authStore'

vi.mock('../hooks/useNotifications', () => ({
  default: () => ({ notifications: [], dismiss: vi.fn(), dismissAll: vi.fn(), unreadCount: 0 }),
}))

// La barre et le dock se relaient selon la largeur : on simule un grand écran.
function setViewport(isDesktop) {
  window.matchMedia = (query) => ({
    matches: query.includes('min-width: 1024px') ? isDesktop : false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

const renderNavbar = () => render(
  <MemoryRouter>
    <Navbar />
  </MemoryRouter>
)

beforeEach(() => {
  useAuthStore.setState({ user: { id: '1', firstName: 'Ada', lastName: 'L', credits: 10 }, token: 'jwt', authReady: true })
  setViewport(false)
})

afterEach(() => {
  window.scrollY = 0
})

describe('Navbar — hidden regions', () => {
  it('marks the scroll dock inert while it is faded out', () => {
    setViewport(true)
    const { container } = renderNavbar()

    // En haut de page le dock est à opacity-0 : invisible, donc il ne doit être
    // ni tabulable ni lu par les lecteurs d'écran.
    const dock = container.querySelector('aside')
    expect(dock).toHaveAttribute('inert')
    expect(dock).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps the header reachable while it is the visible navigation', () => {
    setViewport(true)
    const { container } = renderNavbar()

    const header = container.querySelector('header')
    expect(header).not.toHaveAttribute('inert')
    expect(header).not.toHaveAttribute('aria-hidden')
  })
})

describe('Navbar — mobile drawer', () => {
  it('announces the toggle state on the hamburger button', async () => {
    renderNavbar()
    const toggle = screen.getByRole('button', { name: /ouvrir le menu/i })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(toggle)

    expect(screen.getByRole('button', { name: /fermer le menu/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('exposes the drawer as a modal dialog and moves focus into it', async () => {
    renderNavbar()

    await userEvent.click(screen.getByRole('button', { name: /ouvrir le menu/i }))

    const drawer = screen.getByRole('dialog')
    expect(drawer).toHaveAttribute('aria-modal', 'true')
    expect(within(drawer).getAllByRole('link')[0]).toHaveFocus()
  })

  it('closes on Escape and gives focus back to the hamburger button', async () => {
    renderNavbar()
    const toggle = screen.getByRole('button', { name: /ouvrir le menu/i })

    await userEvent.click(toggle)
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ouvrir le menu/i })).toHaveFocus()
  })
})
