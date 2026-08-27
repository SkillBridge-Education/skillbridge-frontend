import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sessions from './Sessions'
import useAuthStore from '../store/authStore'
import { sessionApi } from '../services/api'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    sessionApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), end: vi.fn(), accept: vi.fn(), refuse: vi.fn(), update: vi.fn() },
  }
})

const SESSION = {
  id: 's1',
  title: 'Maths — Dérivées',
  status: 'SCHEDULED',
  creditsReserved: 60,
  startsAt: '2026-09-01T10:00:00.000Z',
  teacher: { id: '1', firstName: 'Ada', lastName: 'L' },
  learner: { id: '2', firstName: 'Kenji', lastName: 'M' },
}

const renderSessions = () => render(
  <MemoryRouter>
    <Sessions />
  </MemoryRouter>
)

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ user: { id: '1', firstName: 'Ada', lastName: 'L' }, token: 'jwt', authReady: true })
  sessionApi.list.mockResolvedValue([SESSION])
})

describe('Sessions — keyboard access to a card', () => {
  it('exposes the session title as a real control', async () => {
    renderSessions()

    const title = await screen.findByRole('button', { name: /maths — dérivées/i })
    expect(title).toBeInTheDocument()
  })

  it('opens the session detail with the keyboard alone', async () => {
    renderSessions()
    const title = await screen.findByRole('button', { name: /maths — dérivées/i })

    // On atteint le titre au clavier, puis on l'active avec Entrée : une carte
    // qui n'écoutait que le clic au pointeur était inutilisable ainsi.
    title.focus()
    expect(title).toHaveFocus()
    await userEvent.keyboard('{Enter}')

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('closes the detail dialog with Escape', async () => {
    renderSessions()
    const title = await screen.findByRole('button', { name: /maths — dérivées/i })

    await userEvent.click(title)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
