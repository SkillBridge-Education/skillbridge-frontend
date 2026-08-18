import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BlockButton from './BlockButton'
import { blockApi } from '../services/api'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return { ...actual, blockApi: { list: vi.fn(), block: vi.fn(), unblock: vi.fn() } }
})

beforeEach(() => {
  vi.clearAllMocks()
})

const renderButton = () => render(<BlockButton userId="user-42" userName="Léa Arnaud" />)

describe('BlockButton', () => {
  it('asks for confirmation before blocking anyone', async () => {
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: /^bloquer$/i }))

    expect(screen.getByRole('alertdialog')).toHaveAccessibleName(/bloquer léa arnaud/i)
    expect(blockApi.block).not.toHaveBeenCalled()
  })

  it('states that blocking is not a report', async () => {
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: /^bloquer$/i }))

    // Les deux gestes sont distincts : le confondre laisserait croire que la
    // modération a été alertée.
    expect(screen.getByRole('alertdialog')).toHaveTextContent(/n'alerte pas la modération/i)
  })

  it('blocks the user once confirmed and reflects the new state', async () => {
    blockApi.block.mockResolvedValue({ id: 'b1' })
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: /^bloquer$/i }))
    await userEvent.click(screen.getByRole('button', { name: /bloquer cette personne/i }))

    expect(blockApi.block).toHaveBeenCalledWith('user-42')
    expect(await screen.findByText(/^bloqué$/i)).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('keeps the dialog open and explains when the API fails', async () => {
    blockApi.block.mockRejectedValue(new Error('network'))
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: /^bloquer$/i }))
    await userEvent.click(screen.getByRole('button', { name: /bloquer cette personne/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/action a échoué/i)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('can be dismissed with Escape without blocking', async () => {
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: /^bloquer$/i }))
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(blockApi.block).not.toHaveBeenCalled()
  })
})
