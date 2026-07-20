import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ForgotPassword from './ForgotPassword'
import api from '../services/api'

describe('ForgotPassword', () => {
  it('renders the request form', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    )

    expect(screen.getByText(/réinitialise ton mot de passe/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('toi@exemple.com')).toBeInTheDocument()
  })

  it('shows a confirmation screen after a successful request', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: {} })
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    )

    await userEvent.type(screen.getByPlaceholderText('toi@exemple.com'), 'user@example.com')
    await userEvent.click(screen.getByRole('button', { name: /envoyer le lien/i }))

    expect(await screen.findByText(/email envoyé/i)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'user@example.com' })

    vi.restoreAllMocks()
  })
})
