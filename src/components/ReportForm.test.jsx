import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportForm from './ReportForm'
import { reportApi } from '../services/api'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    reportApi: { create: vi.fn(), mine: vi.fn() },
  }
})

const setup = () => userEvent.setup({ delay: null })

const renderForm = (props = {}) =>
  render(<ReportForm reportedUserId="user-42" reportedName="Léa Arnaud" {...props} />)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ReportForm', () => {
  it('names the person being reported', () => {
    renderForm()

    expect(screen.getByText('Léa Arnaud')).toBeInTheDocument()
    expect(screen.getByLabelText(/motif du signalement/i)).toBeInTheDocument()
  })

  it('refuses to submit without a reason', async () => {
    const user = setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /envoyer le signalement/i }))

    expect(await screen.findByText(/sélectionne un motif/i)).toBeInTheDocument()
    expect(reportApi.create).not.toHaveBeenCalled()
  })

  it('sends the report with the payload the API expects', async () => {
    const user = setup()
    reportApi.create.mockResolvedValue({ id: 'r1' })
    renderForm({ messageId: 'msg-7' })

    await user.selectOptions(screen.getByLabelText(/motif du signalement/i), 'HARASSMENT')
    await user.type(screen.getByLabelText(/ce qui s'est passé/i), 'Messages insultants pendant la session.')
    await user.click(screen.getByRole('button', { name: /envoyer le signalement/i }))

    expect(reportApi.create).toHaveBeenCalledWith({
      reportedUserId: 'user-42',
      reason: 'HARASSMENT',
      description: 'Messages insultants pendant la session.',
      messageId: 'msg-7',
    })
    expect(await screen.findByText(/signalement transmis/i)).toBeInTheDocument()
  })

  it('omits the description when it is left empty', async () => {
    const user = setup()
    reportApi.create.mockResolvedValue({ id: 'r1' })
    renderForm()

    await user.selectOptions(screen.getByLabelText(/motif du signalement/i), 'SPAM')
    await user.click(screen.getByRole('button', { name: /envoyer le signalement/i }))

    expect(reportApi.create).toHaveBeenCalledWith({ reportedUserId: 'user-42', reason: 'SPAM' })
  })

  it('requires an explanation when the reason is "other"', async () => {
    const user = setup()
    renderForm()

    await user.selectOptions(screen.getByLabelText(/motif du signalement/i), 'OTHER')
    await user.click(screen.getByRole('button', { name: /envoyer le signalement/i }))

    expect(await screen.findByText(/20 caractères minimum/i)).toBeInTheDocument()
    expect(reportApi.create).not.toHaveBeenCalled()
  })

  it('explains a 409 as an already pending report', async () => {
    const user = setup()
    reportApi.create.mockRejectedValue({ response: { status: 409 } })
    renderForm()

    await user.selectOptions(screen.getByLabelText(/motif du signalement/i), 'SPAM')
    await user.click(screen.getByRole('button', { name: /envoyer le signalement/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/déjà un signalement en cours/i)
    // Le formulaire reste rempli pour ne pas perdre la saisie.
    expect(screen.getByLabelText(/motif du signalement/i)).toHaveValue('SPAM')
  })

  it('explains a 429 as a rate limit', async () => {
    const user = setup()
    reportApi.create.mockRejectedValue({ response: { status: 429 } })
    renderForm()

    await user.selectOptions(screen.getByLabelText(/motif du signalement/i), 'SPAM')
    await user.click(screen.getByRole('button', { name: /envoyer le signalement/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/trop de signalements/i)
  })

  it('surfaces the server message on a 400, such as reporting yourself', async () => {
    const user = setup()
    reportApi.create.mockRejectedValue({
      response: { status: 400, data: { message: 'You cannot report yourself' } },
    })
    renderForm()

    await user.selectOptions(screen.getByLabelText(/motif du signalement/i), 'SPAM')
    await user.click(screen.getByRole('button', { name: /envoyer le signalement/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('You cannot report yourself')
  })

  it('does not offer a form at all when no user is targeted', () => {
    render(<ReportForm />)

    expect(screen.getByText(/introuvable/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /envoyer le signalement/i })).not.toBeInTheDocument()
  })
})
