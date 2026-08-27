import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './Toast'

function Trigger() {
  const addToast = useToast()
  return (
    <>
      <button type="button" onClick={() => addToast('Session enregistrée', 'success')}>Succès</button>
      <button type="button" onClick={() => addToast('La connexion a échoué', 'error')}>Erreur</button>
    </>
  )
}

const renderToasts = () => render(
  <ToastProvider>
    <Trigger />
  </ToastProvider>
)

describe('ToastProvider', () => {
  it('renders both live regions before any toast exists', () => {
    renderToasts()

    // Une région live ajoutée en même temps que son contenu n'est pas annoncée :
    // les deux conteneurs doivent donc préexister, vides.
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('announces a normal toast politely, inside the pre-existing region', async () => {
    renderToasts()
    const politeRegion = screen.getByRole('status')

    await userEvent.click(screen.getByRole('button', { name: 'Succès' }))

    expect(politeRegion).toHaveTextContent('Session enregistrée')
    expect(politeRegion).toHaveAttribute('aria-live', 'polite')
    // Le conteneur n'a pas été remplacé : c'est bien le même noeud.
    expect(screen.getByRole('status')).toBe(politeRegion)
  })

  it('routes errors to the assertive region', async () => {
    renderToasts()
    const assertiveRegion = screen.getByRole('alert')

    await userEvent.click(screen.getByRole('button', { name: 'Erreur' }))

    expect(assertiveRegion).toHaveTextContent('La connexion a échoué')
    expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive')
    expect(screen.getByRole('status')).not.toHaveTextContent('La connexion a échoué')
  })
})
