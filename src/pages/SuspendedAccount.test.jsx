import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SuspendedAccount from './SuspendedAccount'
import useAuthStore from '../store/authStore'
import { appealApi } from '../services/api'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return { ...actual, appealApi: { create: vi.fn(), mine: vi.fn() } }
})

const setup = () => userEvent.setup({ delay: null })
const APPEAL = 'Je pense que la sanction repose sur un malentendu, voici le contexte.'

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({
    user: { id: '1', firstName: 'Ada' },
    token: 'jwt',
    authReady: true,
    suspension: {
      message: 'Votre compte a été suspendu le 12 août.',
      reason: 'Harcèlement signalé par plusieurs membres',
      appealPath: '/appeals',
    },
  })
})

describe('SuspendedAccount', () => {
  it('states the reason for the sanction', () => {
    render(<SuspendedAccount />)

    // Le DSA impose une décision motivée : le motif doit être lisible.
    expect(screen.getByText(/harcèlement signalé par plusieurs membres/i)).toBeInTheDocument()
    expect(screen.getByText(/suspendu le 12 août/i)).toBeInTheDocument()
  })

  it('falls back to a clear message when no reason was sent', () => {
    useAuthStore.setState({ suspension: { appealPath: '/appeals' } })
    render(<SuspendedAccount />)

    expect(screen.getByText(/aucun motif détaillé/i)).toBeInTheDocument()
  })

  it('offers a way to challenge the decision', () => {
    render(<SuspendedAccount />)

    expect(screen.getByRole('heading', { name: /contester la décision/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/pourquoi cette décision te semble injustifiée/i)).toBeInTheDocument()
  })

  it('refuses an appeal shorter than the API minimum', async () => {
    const user = setup()
    render(<SuspendedAccount />)

    await user.type(screen.getByLabelText(/injustifiée/i), 'trop court')
    await user.click(screen.getByRole('button', { name: /envoyer mon recours/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/20 caractères/i)
    expect(appealApi.create).not.toHaveBeenCalled()
  })

  it('sends the appeal to the path the API provided', async () => {
    const user = setup()
    appealApi.create.mockResolvedValue({ id: 'a1' })
    useAuthStore.setState({ suspension: { reason: 'Spam', appealPath: '/appeals/v2' } })
    render(<SuspendedAccount />)

    await user.type(screen.getByLabelText(/injustifiée/i), APPEAL)
    await user.click(screen.getByRole('button', { name: /envoyer mon recours/i }))

    expect(appealApi.create).toHaveBeenCalledWith(APPEAL, '/appeals/v2')
    expect(await screen.findByText(/recours transmis/i)).toBeInTheDocument()
  })

  it('explains a 409 as an appeal already under review', async () => {
    const user = setup()
    appealApi.create.mockRejectedValue({ response: { status: 409 } })
    render(<SuspendedAccount />)

    await user.type(screen.getByLabelText(/injustifiée/i), APPEAL)
    await user.click(screen.getByRole('button', { name: /envoyer mon recours/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/déjà en cours d'examen/i)
  })

  it('lets a suspended user log out', async () => {
    const user = setup()
    render(<SuspendedAccount />)

    await user.click(screen.getByRole('button', { name: /se déconnecter/i }))

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().suspension).toBeNull()
  })
})
