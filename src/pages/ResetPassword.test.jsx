import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ResetPassword from './ResetPassword'
import api from '../services/api'

const renderReset = (path = '/reset-password?token=abc123') => render(
  <MemoryRouter initialEntries={[path]}>
    <ResetPassword />
  </MemoryRouter>
)

describe('ResetPassword', () => {
  it('asks for a new link when the token is missing', () => {
    renderReset('/reset-password')

    expect(screen.getByRole('heading', { name: /lien invalide/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /demander un nouveau lien/i }))
      .toHaveAttribute('href', '/forgot-password')
  })

  it('renders the form when a token is present', () => {
    renderReset()

    expect(screen.getByRole('heading', { name: /nouveau mot de passe/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/répéter le mot de passe/i)).toBeInTheDocument()
  })

  it('rejects two passwords that do not match', async () => {
    const user = userEvent.setup({ delay: null })
    renderReset()

    await user.type(screen.getByPlaceholderText('8 caractères minimum'), 'password123')
    await user.type(screen.getByPlaceholderText(/répéter le mot de passe/i), 'password456')
    await user.click(screen.getByRole('button', { name: /réinitialiser le mot de passe/i }))

    expect(await screen.findByText(/ne correspondent pas/i)).toBeInTheDocument()
  })

  it('confirms once the backend accepted the new password', async () => {
    const user = userEvent.setup({ delay: null })
    vi.spyOn(api, 'post').mockResolvedValue({ data: {} })
    renderReset()

    await user.type(screen.getByPlaceholderText('8 caractères minimum'), 'password123')
    await user.type(screen.getByPlaceholderText(/répéter le mot de passe/i), 'password123')
    await user.click(screen.getByRole('button', { name: /réinitialiser le mot de passe/i }))

    expect(await screen.findByText(/mot de passe réinitialisé/i)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token: 'abc123', password: 'password123' })

    vi.restoreAllMocks()
  })
})
