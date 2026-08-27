import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Register from './Register'
import i18n from '../i18n'

const renderRegister = () => render(
  <MemoryRouter>
    <Register />
  </MemoryRouter>
)

beforeEach(async () => { await i18n.changeLanguage('fr') })
afterEach(async () => { await i18n.changeLanguage('fr') })

describe('Register', () => {
  it('renders the account step', () => {
    renderRegister()

    expect(screen.getByRole('heading', { name: /créer votre compte/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Alice')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continuer/i })).toBeInTheDocument()
  })

  it('validates the account step before moving on', async () => {
    renderRegister()

    await userEvent.click(screen.getByRole('button', { name: /continuer/i }))

    expect(await screen.findByText(/le prénom est requis/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /créer votre compte/i })).toBeInTheDocument()
  })

  it('moves to the skills step once the account fields are valid', async () => {
    const user = userEvent.setup({ delay: null })
    renderRegister()

    await user.type(screen.getByPlaceholderText('Alice'), 'Ada')
    await user.type(screen.getByPlaceholderText('Martin'), 'Lovelace')
    await user.type(screen.getByPlaceholderText('alice@example.com'), 'ada@example.com')
    await user.type(screen.getByPlaceholderText('8 caractères minimum'), 'password123')
    await user.click(screen.getByRole('button', { name: /continuer/i }))

    expect(await screen.findByRole('heading', { name: /vos compétences/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /j'enseigne/i })).toBeInTheDocument()
  })

  it('renders in English when the language changes', async () => {
    renderRegister()
    await i18n.changeLanguage('en')

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    )
    expect(screen.getByText(/join the skill-exchange community/i)).toBeInTheDocument()
  })
})
