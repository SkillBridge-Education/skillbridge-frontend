import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Report from './Report'
import useAuthStore from '../store/authStore'

const renderReport = (path = '/report') => render(
  <MemoryRouter initialEntries={[path]}>
    <Report />
  </MemoryRouter>
)

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, authReady: true })
})

describe('Report page', () => {
  it('renders the report form', () => {
    renderReport()

    expect(screen.getByRole('heading', { level: 1, name: /signaler un utilisateur ou un contenu/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /envoyer le signalement/i })).toBeInTheDocument()
  })

  it('prefills the form from the URL parameters', () => {
    renderReport('/report?type=message&target=K%C3%A9nji')

    expect(screen.getByLabelText(/que veux-tu signaler/i)).toHaveValue('message')
    expect(screen.getByLabelText(/qui ou quoi/i)).toHaveValue('Kénji')
  })

  it('falls back to a user report when the type parameter is unknown', () => {
    renderReport('/report?type=banana')

    expect(screen.getByLabelText(/que veux-tu signaler/i)).toHaveValue('user')
  })

  it('prefills the contact email of the logged-in reporter', () => {
    useAuthStore.setState({ user: { id: '1', firstName: 'Ada', email: 'ada@example.com' }, token: 'jwt' })
    renderReport()

    expect(screen.getByLabelText(/ton email/i)).toHaveValue('ada@example.com')
  })
})
