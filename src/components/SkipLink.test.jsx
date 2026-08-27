import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SkipLink from './SkipLink'

function Page() {
  return (
    <MemoryRouter>
      <SkipLink />
      <nav>
        <a href="/somewhere">Un lien de navigation</a>
      </nav>
      <div id="main-content" tabIndex={-1}>
        <button type="button">Premier bouton du contenu</button>
      </div>
    </MemoryRouter>
  )
}

describe('SkipLink', () => {
  it('is the first element reached with the Tab key', async () => {
    render(<Page />)

    await userEvent.tab()

    expect(screen.getByRole('link', { name: /aller au contenu principal/i })).toHaveFocus()
  })

  it('moves focus into the main content when activated', async () => {
    render(<Page />)
    const main = document.getElementById('main-content')

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(main).toHaveFocus()
  })

  it('lets the next Tab reach the content instead of the navigation', async () => {
    render(<Page />)

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await userEvent.tab()

    expect(screen.getByRole('button', { name: /premier bouton du contenu/i })).toHaveFocus()
    expect(screen.getByRole('link', { name: /un lien de navigation/i })).not.toHaveFocus()
  })
})
