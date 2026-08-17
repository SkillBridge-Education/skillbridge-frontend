import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Settings from './Settings'
import useAuthStore from '../store/authStore'
import i18n from '../i18n'

const renderSettings = () => render(
  <MemoryRouter>
    <Settings />
  </MemoryRouter>
)

beforeEach(async () => {
  localStorage.clear()
  await i18n.changeLanguage('fr')
  useAuthStore.setState({ user: null, token: null, authReady: true })
})

afterEach(async () => {
  await i18n.changeLanguage('fr')
})

describe('Settings', () => {
  it('renders every settings section', () => {
    renderSettings()

    expect(screen.getByRole('heading', { level: 1, name: /paramètres/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^langue$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^notifications$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^confidentialité$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /mon compte/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /informations légales/i })).toBeInTheDocument()
  })

  it('exposes the language switcher and translates the page when it changes', async () => {
    renderSettings()

    await userEvent.click(screen.getByRole('radio', { name: /english/i }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /^settings$/i })).toBeInTheDocument()
    )
  })

  it('persists a notification preference in localStorage', async () => {
    renderSettings()

    const pushToggle = screen.getByRole('switch', { name: /notifications sur l'appareil/i })
    expect(pushToggle).toHaveAttribute('aria-checked', 'false')

    await userEvent.click(pushToggle)

    expect(pushToggle).toHaveAttribute('aria-checked', 'true')
    expect(JSON.parse(localStorage.getItem('sb_prefs')).notifPush).toBe(true)
    expect(screen.getByText(/préférences enregistrées/i)).toBeInTheDocument()
  })

  it('persists the profile visibility choice', async () => {
    renderSettings()

    await userEvent.click(screen.getByRole('radio', { name: /^public/i }))

    expect(JSON.parse(localStorage.getItem('sb_prefs')).visibility).toBe('public')
  })

  it('invites anonymous visitors to log in instead of showing account actions', () => {
    renderSettings()

    expect(screen.getByText(/connecte-toi pour exporter tes données/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /supprimer mon compte/i })).not.toBeInTheDocument()
  })

  it('shows account actions as disabled while the backend endpoints do not exist', () => {
    useAuthStore.setState({ user: { id: '1', firstName: 'Ada', email: 'ada@example.com' }, token: 'jwt' })
    renderSettings()

    expect(screen.getByRole('button', { name: /exporter mes données/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /supprimer mon compte/i })).toBeDisabled()
    expect(screen.getAllByText(/bientôt disponible/i).length).toBeGreaterThan(0)
  })

  it('links to the legal documents', () => {
    renderSettings()

    expect(screen.getAllByRole('link', { name: /mentions légales/i })[0]).toHaveAttribute('href', '/legal-notice')
    expect(screen.getAllByRole('link', { name: /politique de confidentialité/i })[0]).toHaveAttribute('href', '/privacy')
    expect(screen.getAllByRole('link', { name: /^cgu$/i })[0]).toHaveAttribute('href', '/terms')
  })
})
