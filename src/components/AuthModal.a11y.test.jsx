import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AuthModal from './AuthModal'
import useAuthStore from '../store/authStore'
import { authApi } from '../services/api'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn(), verifyEmail: vi.fn(), resendVerification: vi.fn() },
  }
})

const renderModal = () => render(
  <MemoryRouter>
    <AuthModal />
  </MemoryRouter>
)

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ modalOpen: true, modalMode: 'login', user: null, token: null })
})

describe('AuthModal — dialog semantics', () => {
  it('is exposed as a modal dialog named by its heading', () => {
    renderModal()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName(/bienvenue/i)
  })

  it('moves focus inside the dialog when it opens', () => {
    renderModal()

    expect(screen.getByRole('button', { name: /fermer/i })).toHaveFocus()
  })

  it('closes on Escape', async () => {
    renderModal()

    await userEvent.keyboard('{Escape}')

    await waitFor(() => expect(useAuthStore.getState().modalOpen).toBe(false))
  })

  it('traps Tab inside the dialog', async () => {
    renderModal()

    // On parcourt largement plus d'éléments que la boîte n'en contient : le
    // focus doit toujours être resté à l'intérieur.
    for (let i = 0; i < 12; i++) await userEvent.tab()

    expect(screen.getByRole('dialog')).toContainElement(document.activeElement)
  })
})

describe('AuthModal — form accessibility', () => {
  it('labels every field so it can be found by its name', () => {
    renderModal()

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
  })

  it('announces the backend error and ties it to the fields', async () => {
    authApi.login.mockRejectedValue({ response: { status: 401, data: { message: 'Invalid email or password' } } })
    renderModal()

    await userEvent.type(screen.getByLabelText(/^email$/i), 'ada@example.com')
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    // role="alert" => la région est annoncée dès son apparition.
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Invalid email or password')

    const email = screen.getByLabelText(/^email$/i)
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription('Invalid email or password')
  })
})
