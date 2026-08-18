import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Feed from './Feed'
import useAuthStore from '../store/authStore'

const renderFeed = () => render(
  <MemoryRouter>
    <Feed />
  </MemoryRouter>
)

beforeEach(() => {
  useAuthStore.setState({ user: { id: '1', firstName: 'Ada', lastName: 'Lovelace' }, token: 'jwt', authReady: true })
})

describe('Feed — composer dialog', () => {
  it('moves focus into the dialog when it opens', async () => {
    renderFeed()

    await userEvent.click(screen.getByRole('button', { name: /partagez une découverte/i }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toContainElement(document.activeElement)
  })

  it('closes on Escape and hands focus back to the opener', async () => {
    renderFeed()
    const opener = screen.getByRole('button', { name: /partagez une découverte/i })

    await userEvent.click(opener)
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /partagez une découverte/i })).toHaveFocus()
  })

  it('keeps Tab inside the dialog', async () => {
    renderFeed()
    await userEvent.click(screen.getByRole('button', { name: /partagez une découverte/i }))

    for (let i = 0; i < 8; i++) await userEvent.tab()

    expect(screen.getByRole('dialog')).toContainElement(document.activeElement)
  })
})
