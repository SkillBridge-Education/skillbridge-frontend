import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Feed from './Feed'
import useAuthStore from '../store/authStore'
import i18n from '../i18n'

const renderFeed = () => render(
  <MemoryRouter>
    <Feed />
  </MemoryRouter>
)

beforeEach(async () => {
  await i18n.changeLanguage('fr')
  useAuthStore.setState({ user: null, token: null, authReady: true })
})

afterEach(async () => { await i18n.changeLanguage('fr') })

describe('Feed', () => {
  it('renders the empty state for a visitor', () => {
    renderFeed()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/ce que les membres partagent/i)
    expect(screen.getByText(/aucun post pour l'instant/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rejoindre skillbridge/i })).toBeInTheDocument()
  })

  it('marks the selected filter as pressed', async () => {
    renderFeed()

    const tech = screen.getByRole('button', { name: 'Tech' })
    expect(screen.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(tech)

    expect(tech).toHaveAttribute('aria-pressed', 'true')
  })

  it('lets a logged-in member publish a post', async () => {
    const user = userEvent.setup({ delay: null })
    useAuthStore.setState({ user: { id: '1', firstName: 'Ada', lastName: 'Lovelace' }, token: 'jwt' })
    renderFeed()

    await user.click(screen.getByRole('button', { name: /partagez une découverte/i }))
    await user.type(screen.getByPlaceholderText(/partagez votre progression/i), 'Première session de Python !')
    await user.click(screen.getByRole('button', { name: /publier/i }))

    expect(await screen.findByText(/première session de python/i)).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText(/0 commentaire$/)).toBeInTheDocument()
  })

  it('renders in English when the language changes', async () => {
    renderFeed()
    await i18n.changeLanguage('en')

    await waitFor(() => expect(screen.getByText(/no posts yet/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
  })
})
