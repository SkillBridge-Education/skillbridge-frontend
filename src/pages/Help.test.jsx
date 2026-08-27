import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Help from './Help'

const renderHelp = () => render(
  <MemoryRouter>
    <Help />
  </MemoryRouter>
)

describe('Help', () => {
  it('renders the FAQ questions', () => {
    renderHelp()

    expect(screen.getByRole('heading', { level: 1, name: /aide & questions fréquentes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /qu'est-ce que skillbridge/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /comment fonctionnent les crédits/i })).toBeInTheDocument()
  })

  it('expands an answer when its question is clicked', async () => {
    renderHelp()

    const question = screen.getByRole('button', { name: /comment fonctionnent les crédits/i })
    expect(question).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(question)

    expect(question).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/1 crédit = 1 minute de cours/i)).toBeInTheDocument()
  })

  it('filters the questions with the search field', async () => {
    renderHelp()

    await userEvent.type(screen.getByRole('searchbox'), 'mot de passe')

    expect(screen.getByRole('button', { name: /oublié mon mot de passe/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /qu'est-ce que skillbridge/i })).not.toBeInTheDocument()
  })

  it('tells the user when nothing matches the search', async () => {
    renderHelp()

    await userEvent.type(screen.getByRole('searchbox'), 'zzzzzz')

    expect(screen.getByText(/aucune question ne correspond/i)).toBeInTheDocument()
  })

  it('points to support and to the report form', () => {
    renderHelp()

    expect(screen.getAllByRole('link', { name: /contacter l'assistance/i })[0]).toHaveAttribute('href', '/support')
    expect(screen.getAllByRole('link', { name: /signaler un utilisateur/i })[0]).toHaveAttribute('href', '/report')
  })
})
