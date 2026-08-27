import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportDialog from './ReportDialog'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return { ...actual, reportApi: { create: vi.fn(), mine: vi.fn() } }
})

describe('ReportDialog', () => {
  it('renders nothing when closed', () => {
    render(<ReportDialog open={false} onClose={() => {}} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the report form for the reported member', () => {
    render(<ReportDialog open onClose={() => {}} reportedUserId="user-42" reportedName="Léa Arnaud" />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Léa Arnaud')).toBeInTheDocument()
    expect(screen.getByLabelText(/motif du signalement/i)).toBeInTheDocument()
  })

  it('closes on the close button and on Escape', async () => {
    const onClose = vi.fn()
    render(<ReportDialog open onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
