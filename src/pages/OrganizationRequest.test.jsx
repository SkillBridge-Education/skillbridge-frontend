import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import OrganizationRequest from './OrganizationRequest'
import useAuthStore from '../store/authStore'
import { organizationApi } from '../services/api'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return { ...actual, organizationApi: { requestAccess: vi.fn() } }
})

const setup = () => userEvent.setup({ delay: null })

const renderPage = () => render(
  <MemoryRouter>
    <OrganizationRequest />
  </MemoryRouter>
)

const fillRequired = async (user) => {
  await user.type(screen.getByLabelText(/nom de l'établissement/i), 'Lycée Victor Hugo')
  await user.type(screen.getByLabelText(/votre nom/i), 'Claire Dubois')
  await user.type(screen.getByLabelText(/votre email professionnel/i), 'claire@lycee.fr')
}

beforeEach(() => {
  vi.clearAllMocks()
  // La page est publique : elle doit fonctionner sans session.
  useAuthStore.setState({ user: null, token: null, authReady: true })
})

describe('OrganizationRequest', () => {
  it('renders the request form for a visitor without an account', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: /inscrire mon établissement/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /envoyer la demande/i })).toBeInTheDocument()
  })

  it('validates the required fields before calling the API', async () => {
    const user = setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /envoyer la demande/i }))

    expect(await screen.findByText(/indiquez le nom de l'établissement/i)).toBeInTheDocument()
    expect(screen.getByText(/indiquez votre nom/i)).toBeInTheDocument()
    expect(screen.getByText(/adresse email valide/i)).toBeInTheDocument()
    expect(organizationApi.requestAccess).not.toHaveBeenCalled()
  })

  it('sends the request and confirms it is pending review', async () => {
    const user = setup()
    organizationApi.requestAccess.mockResolvedValue({ id: 'org1', status: 'PENDING' })
    renderPage()

    await fillRequired(user)
    await user.type(screen.getByLabelText(/domaine email/i), 'lycee.fr')
    await user.click(screen.getByRole('button', { name: /envoyer la demande/i }))

    expect(organizationApi.requestAccess).toHaveBeenCalledWith({
      name: 'Lycée Victor Hugo',
      contactName: 'Claire Dubois',
      contactEmail: 'claire@lycee.fr',
      emailDomain: 'lycee.fr',
    })
    expect(await screen.findByText(/demande envoyée/i)).toBeInTheDocument()
    // Le statut réel est PENDING : la page ne doit pas laisser croire à une
    // activation immédiate.
    expect(screen.getByText(/en attente d'examen/i)).toBeInTheDocument()
  })

  it('omits the optional domain when it is left empty', async () => {
    const user = setup()
    organizationApi.requestAccess.mockResolvedValue({ id: 'org1' })
    renderPage()

    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /envoyer la demande/i }))

    expect(organizationApi.requestAccess).toHaveBeenCalledWith({
      name: 'Lycée Victor Hugo',
      contactName: 'Claire Dubois',
      contactEmail: 'claire@lycee.fr',
    })
  })

  it('keeps the form and shows the server message when the call fails', async () => {
    const user = setup()
    organizationApi.requestAccess.mockRejectedValue({
      response: { status: 400, data: { message: 'This school is already registered' } },
    })
    renderPage()

    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /envoyer la demande/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('This school is already registered')
    expect(screen.getByRole('button', { name: /envoyer la demande/i })).toBeInTheDocument()
  })
})
