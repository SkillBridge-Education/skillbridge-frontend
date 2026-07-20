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
    authApi: {
      login: vi.fn(),
      register: vi.fn(),
      me: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
    },
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

describe('AuthModal — login', () => {
  it('logs in with the entered credentials and closes the modal', async () => {
    authApi.login.mockResolvedValue({ user: { id: '1', firstName: 'Ada' }, token: 'jwt-token' })
    renderModal()

    await userEvent.type(screen.getByPlaceholderText('vous@exemple.com'), 'ada@example.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(authApi.login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'password123' })
    await waitFor(() => expect(useAuthStore.getState().modalOpen).toBe(false))
    expect(useAuthStore.getState().user).toEqual({ id: '1', firstName: 'Ada' })
  })

  it('shows the backend error message on failed login', async () => {
    authApi.login.mockRejectedValue({
      response: { status: 401, data: { message: 'Invalid email or password' } },
    })
    renderModal()

    await userEvent.type(screen.getByPlaceholderText('vous@exemple.com'), 'ada@example.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
    expect(useAuthStore.getState().modalOpen).toBe(true)
  })
})

describe('AuthModal — register', () => {
  it('registers with the entered fields and closes the modal', async () => {
    useAuthStore.setState({ modalMode: 'register' })
    authApi.register.mockResolvedValue({ user: { id: '2', firstName: 'Grace' }, token: 'jwt-token-2' })
    renderModal()

    await userEvent.type(screen.getByPlaceholderText('Alice'), 'Grace')
    await userEvent.type(screen.getByPlaceholderText('Martin'), 'Hopper')
    await userEvent.type(screen.getByPlaceholderText('vous@exemple.com'), 'grace@example.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))

    expect(authApi.register).toHaveBeenCalledWith({
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      password: 'password123',
    })
    await waitFor(() => expect(useAuthStore.getState().modalOpen).toBe(false))
  })
})
