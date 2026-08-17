import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import useFocusTrap from './useFocusTrap'

function Dialog({ onClose }) {
  const ref = useFocusTrap(true, onClose)
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Boîte de test">
      <button type="button">Premier</button>
      <button type="button">Second</button>
      <button type="button">Dernier</button>
    </div>
  )
}

function Harness({ onClose = () => {} }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Ouvrir</button>
      <button type="button">Bouton de la page</button>
      {open && <Dialog onClose={() => { setOpen(false); onClose() }} />}
    </>
  )
}

describe('useFocusTrap', () => {
  it('moves focus into the dialog when it opens', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))

    expect(screen.getByRole('button', { name: 'Premier' })).toHaveFocus()
  })

  it('keeps Tab inside the dialog instead of escaping to the page', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Dernier' })).toHaveFocus()

    // Depuis le dernier élément, Tab revient au premier — pas vers la page.
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Premier' })).toHaveFocus()
  })

  it('wraps backwards with Shift+Tab from the first element', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))

    await userEvent.tab({ shift: true })

    expect(screen.getByRole('button', { name: 'Dernier' })).toHaveFocus()
  })

  it('calls onEscape when Escape is pressed', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('restores focus to the trigger when the dialog closes', async () => {
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Ouvrir' })

    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })
})
