import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Support from './Support'
import useAuthStore from '../store/authStore'

const renderSupport = () => render(
  <MemoryRouter>
    <Support />
  </MemoryRouter>
)

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, authReady: true })
})

describe('Support', () => {
  it('renders the contact form', () => {
    renderSupport()

    expect(screen.getByRole('heading', { level: 1, name: /contacter l'assistance/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/sujet de la demande/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /envoyer ma demande/i })).toBeInTheDocument()
  })

  it('prefills the email of the logged-in user', () => {
    useAuthStore.setState({ user: { id: '1', firstName: 'Ada', email: 'ada@example.com' }, token: 'jwt' })
    renderSupport()

    expect(screen.getByLabelText(/ton email/i)).toHaveValue('ada@example.com')
  })

  it('shows validation errors instead of submitting an empty request', async () => {
    renderSupport()

    await userEvent.click(screen.getByRole('button', { name: /envoyer ma demande/i }))

    expect(await screen.findByText(/sélectionne un sujet/i)).toBeInTheDocument()
    expect(screen.getByText(/adresse email valide/i)).toBeInTheDocument()
    expect(screen.getByText(/donne un objet/i)).toBeInTheDocument()
  })

  it('states that the request was not sent and offers a prefilled email', async () => {
    // delay: null — la frappe caractère par caractère est trop lente ici.
    const user = userEvent.setup({ delay: null })
    renderSupport()

    await user.selectOptions(screen.getByLabelText(/sujet de la demande/i), 'bug')
    await user.type(screen.getByLabelText(/ton email/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^objet$/i), 'Minuteur bloqué')
    await user.type(screen.getByLabelText(/^message$/i), 'Le minuteur reste bloqué à zéro.')
    await user.click(screen.getByRole('button', { name: /envoyer ma demande/i }))

    expect(await screen.findByText(/envoi automatique pas encore disponible/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ouvrir mon email pré-rempli/i }))
      .toHaveAttribute('href', expect.stringContaining('mailto:support@'))
  })
})
