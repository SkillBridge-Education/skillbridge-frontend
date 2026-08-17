import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import VerifyEmail from './VerifyEmail'
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

const renderVerify = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <VerifyEmail />
  </MemoryRouter>
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('VerifyEmail', () => {
  it('confirms the email when the token is valid', async () => {
    authApi.verifyEmail.mockResolvedValue({})
    renderVerify('/verify-email?token=good-token')

    expect(await screen.findByText(/email vérifié/i)).toBeInTheDocument()
    expect(authApi.verifyEmail).toHaveBeenCalledWith('good-token')
  })

  it('offers to resend a link when the token is rejected', async () => {
    authApi.verifyEmail.mockRejectedValue(new Error('expired'))
    renderVerify('/verify-email?token=bad-token')

    expect(await screen.findByText(/lien invalide ou expiré/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ton adresse email/i)).toBeInTheDocument()
  })

  it('resends a verification email from the error state', async () => {
    const user = userEvent.setup({ delay: null })
    authApi.verifyEmail.mockRejectedValue(new Error('expired'))
    authApi.resendVerification.mockResolvedValue({})
    renderVerify('/verify-email?token=bad-token')

    await user.type(await screen.findByLabelText(/ton adresse email/i), 'Ada@Example.com')
    await user.click(screen.getByRole('button', { name: /renvoyer le lien/i }))

    expect(await screen.findByText(/email de vérification envoyé/i)).toBeInTheDocument()
    expect(authApi.resendVerification).toHaveBeenCalledWith('ada@example.com')
  })
})
