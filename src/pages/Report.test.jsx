import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Report from './Report'
import useAuthStore from '../store/authStore'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return { ...actual, reportApi: { create: vi.fn(), mine: vi.fn() } }
})

const renderReport = (path = '/report') => render(
  <MemoryRouter initialEntries={[path]}>
    <Report />
  </MemoryRouter>
)

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, authReady: true })
})

describe('Report page', () => {
  it('renders the report form for a targeted user', () => {
    renderReport('/report?userId=user-42&name=L%C3%A9a')

    expect(screen.getByRole('heading', { level: 1, name: /signaler un utilisateur/i })).toBeInTheDocument()
    expect(screen.getByText('Léa')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /envoyer le signalement/i })).toBeInTheDocument()
  })

  it('offers the API reasons rather than free text', () => {
    renderReport('/report?userId=user-42')

    const reason = screen.getByLabelText(/motif du signalement/i)
    const values = Array.from(reason.options).map(o => o.value).filter(Boolean)
    expect(values).toEqual([
      'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'CHILD_SAFETY', 'IMPERSONATION', 'SPAM', 'OTHER',
    ])
  })

  it('explains what to do when the URL carries no user', () => {
    renderReport('/report')

    // Un signalement sans cible ne peut pas partir : mieux vaut le dire que
    // laisser remplir un formulaire voué à échouer.
    expect(screen.getByText(/introuvable/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /envoyer le signalement/i })).not.toBeInTheDocument()
  })
})
