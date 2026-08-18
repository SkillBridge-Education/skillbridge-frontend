import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import UserProfile from './UserProfile'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return { ...actual, reportApi: { create: vi.fn(), mine: vi.fn() } }
})
import useAuthStore from '../store/authStore'

const renderProfile = () => render(
  <MemoryRouter initialEntries={['/user/la']}>
    <Routes>
      <Route path="/user/:id" element={<UserProfile />} />
    </Routes>
  </MemoryRouter>
)

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, authReady: true })
})

describe('UserProfile — reporting', () => {
  it('opens the report dialog prefilled with the visited profile', async () => {
    renderProfile()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /signaler/i }))

    // Le nom apparait aussi dans la page derriere la boite : on cherche
    // dans la boite de dialogue elle-meme.
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Léa Arnaud')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/motif du signalement/i)).toBeInTheDocument()
  })
})
