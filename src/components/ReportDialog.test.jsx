import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportDialog from './ReportDialog'

describe('ReportDialog', () => {
  it('renders nothing when closed', () => {
    render(<ReportDialog open={false} onClose={() => {}} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the report form prefilled with the reported target', () => {
    render(<ReportDialog open onClose={() => {}} targetType="profile" target="Léa Arnaud" />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/qui ou quoi/i)).toHaveValue('Léa Arnaud')
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
