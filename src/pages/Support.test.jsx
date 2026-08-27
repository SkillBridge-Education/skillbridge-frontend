import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Support from './Support'
import useAuthStore from '../store/authStore'

// Le formulaire cree un vrai ticket : il construisait un mailto: auparavant.
const createTicket = vi.fn().mockResolvedValue({ ticket: { id: 't1' } })
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return { ...actual, supportApi: { createTicket: (...args) => createTicket(...args) } }
})

const renderSupport = () => render(
  <MemoryRouter>
    <Support />
  </MemoryRouter>
)

beforeEach(() => {
  createTicket.mockClear()
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

  it('actually sends the request to the API', async () => {
    // delay: null — la frappe caractère par caractère est trop lente ici.
    const user = userEvent.setup({ delay: null })
    renderSupport()

    await user.selectOptions(screen.getByLabelText(/sujet de la demande/i), 'bug')
    await user.type(screen.getByLabelText(/ton email/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^objet$/i), 'Minuteur bloque')
    await user.type(screen.getByLabelText(/^message$/i), 'Le minuteur reste bloqué à zéro.')
    await user.click(screen.getByRole('button', { name: /envoyer ma demande/i }))

    // Le formulaire construisait un mailto: vers support@skillbridge.example,
    // un domaine reserve par la RFC 2606 qui ne peut pas recevoir de courrier :
    // toute demande partait dans le vide, y compris celles des comptes suspendus
    // que la page invite a passer par ici.
    await waitFor(() => expect(createTicket).toHaveBeenCalled())
    expect(createTicket.mock.calls[0][0]).toMatchObject({
      subject: 'Minuteur bloque',
      category: 'BUG',
      email: 'ada@example.com',
    })

    expect(await screen.findByText(/ta demande est envoyée/i)).toBeInTheDocument()
  })
})
