import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import UserProfile from './UserProfile'
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

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/qui ou quoi/i)).toHaveValue('Léa Arnaud')
    expect(screen.getByLabelText(/que veux-tu signaler/i)).toHaveValue('profile')
  })
})
