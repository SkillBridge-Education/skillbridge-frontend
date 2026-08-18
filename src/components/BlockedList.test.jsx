import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BlockedList from './BlockedList'
import { blockApi } from '../services/api'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return { ...actual, blockApi: { list: vi.fn(), block: vi.fn(), unblock: vi.fn() } }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BlockedList', () => {
  it('tells the user when nobody is blocked', async () => {
    blockApi.list.mockResolvedValue([])
    render(<BlockedList />)

    expect(await screen.findByText(/n'as bloqué personne/i)).toBeInTheDocument()
  })

  it('lists blocked people', async () => {
    blockApi.list.mockResolvedValue([
      { blockedUserId: 'u1', blockedUser: { id: 'u1', firstName: 'Léa', lastName: 'Arnaud' }, createdAt: '2026-08-01T10:00:00.000Z' },
    ])
    render(<BlockedList />)

    expect(await screen.findByText('Léa Arnaud')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /débloquer/i })).toBeInTheDocument()
  })

  it('unblocks a person and removes the row', async () => {
    blockApi.list.mockResolvedValue([
      { blockedUserId: 'u1', blockedUser: { id: 'u1', firstName: 'Léa', lastName: 'Arnaud' } },
    ])
    blockApi.unblock.mockResolvedValue({})
    render(<BlockedList />)

    await userEvent.click(await screen.findByRole('button', { name: /débloquer/i }))

    expect(blockApi.unblock).toHaveBeenCalledWith('u1')
    expect(screen.queryByText('Léa Arnaud')).not.toBeInTheDocument()
    expect(await screen.findByText(/n'as bloqué personne/i)).toBeInTheDocument()
  })

  it('keeps the row and explains when unblocking fails', async () => {
    blockApi.list.mockResolvedValue([
      { blockedUserId: 'u1', blockedUser: { id: 'u1', firstName: 'Léa', lastName: 'Arnaud' } },
    ])
    blockApi.unblock.mockRejectedValue(new Error('network'))
    render(<BlockedList />)

    await userEvent.click(await screen.findByRole('button', { name: /débloquer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/action a échoué/i)
    expect(screen.getByText('Léa Arnaud')).toBeInTheDocument()
  })

  it('reports a loading failure instead of showing an empty list', async () => {
    blockApi.list.mockRejectedValue(new Error('network'))
    render(<BlockedList />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible de charger/i)
  })
})
