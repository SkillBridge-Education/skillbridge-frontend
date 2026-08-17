import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportForm from './ReportForm'

const DETAILS = 'Messages insultants pendant la session.'

// delay: null — sinon la frappe caractère par caractère rend la suite très lente.
const setup = () => userEvent.setup({ delay: null })

const fillValidReport = async (user) => {
  await user.type(screen.getByLabelText(/qui ou quoi/i), 'Léa Arnaud')
  await user.selectOptions(screen.getByLabelText(/motif du signalement/i), 'harassment')
  await user.type(screen.getByLabelText(/ce qui s'est passé/i), DETAILS)
}

describe('ReportForm', () => {
  it('renders the reporting fields', () => {
    render(<ReportForm />)

    expect(screen.getByLabelText(/que veux-tu signaler/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/motif du signalement/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /envoyer le signalement/i })).toBeInTheDocument()
  })

  it('prefills the target and the reporter email from its props', () => {
    render(<ReportForm targetType="message" target="Kenji Matsuda" reporterEmail="ada@example.com" />)

    expect(screen.getByLabelText(/qui ou quoi/i)).toHaveValue('Kenji Matsuda')
    expect(screen.getByLabelText(/ton email/i)).toHaveValue('ada@example.com')
    expect(screen.getByLabelText(/que veux-tu signaler/i)).toHaveValue('message')
  })

  it('blocks submission and shows one error per invalid field', async () => {
    const user = setup()
    const onSubmitted = vi.fn()
    render(<ReportForm onSubmitted={onSubmitted} />)

    await user.click(screen.getByRole('button', { name: /envoyer le signalement/i }))

    expect(await screen.findByText(/indique qui ou quoi tu signales/i)).toBeInTheDocument()
    expect(screen.getByText(/sélectionne un motif/i)).toBeInTheDocument()
    expect(screen.getByText(/20 caractères minimum/i)).toBeInTheDocument()
    expect(onSubmitted).not.toHaveBeenCalled()
  })

  it('is explicit about the report NOT being transmitted and offers an email fallback', async () => {
    const user = setup()
    const onSubmitted = vi.fn()
    render(<ReportForm onSubmitted={onSubmitted} />)

    await fillValidReport(user)
    await user.click(screen.getByRole('button', { name: /envoyer le signalement/i }))

    expect(await screen.findByText(/signalement non transmis/i)).toBeInTheDocument()
    expect(onSubmitted).toHaveBeenCalledWith({
      targetType: 'user',
      target: 'Léa Arnaud',
      reason: 'harassment',
      details: DETAILS,
      contact: '',
    })

    const mailLink = screen.getByRole('link', { name: /envoyer par email/i })
    expect(mailLink).toHaveAttribute('href', expect.stringContaining('mailto:moderation@'))
  })

  it('lets the user go back to the form to edit the report', async () => {
    const user = setup()
    render(<ReportForm />)

    await fillValidReport(user)
    await user.click(screen.getByRole('button', { name: /envoyer le signalement/i }))
    await user.click(await screen.findByRole('button', { name: /modifier mon signalement/i }))

    expect(screen.getByLabelText(/qui ou quoi/i)).toHaveValue('Léa Arnaud')
  })
})
