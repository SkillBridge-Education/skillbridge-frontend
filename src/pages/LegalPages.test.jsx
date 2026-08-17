import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LegalNotice from './LegalNotice'
import PrivacyPolicy from './PrivacyPolicy'
import Terms from './Terms'
import i18n from '../i18n'

const PAGES = [
  { name: 'Mentions légales',              Page: LegalNotice,   heading: /mentions légales/i },
  { name: 'Politique de confidentialité',  Page: PrivacyPolicy, heading: /politique de confidentialité/i },
  { name: 'CGU',                           Page: Terms,         heading: /conditions générales d'utilisation/i },
]

const renderPage = (Page) => render(
  <MemoryRouter>
    <Page />
  </MemoryRouter>
)

beforeEach(async () => { await i18n.changeLanguage('fr') })
afterEach(async () => { await i18n.changeLanguage('fr') })

describe.each(PAGES)('$name', ({ Page, heading }) => {
  it('renders its title and its sections', () => {
    renderPage(Page)

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(5)
  })

  it('warns that the document is a template to be reviewed by a lawyer', () => {
    renderPage(Page)

    const note = screen.getByRole('note')
    expect(within(note).getByText(/faire relire par un juriste/i)).toBeInTheDocument()
    expect(within(note).getByText(/gabarit/i)).toBeInTheDocument()
  })

  it('keeps the factual details as visible placeholders', () => {
    const { container } = renderPage(Page)

    expect(container.textContent).toMatch(/\[[A-ZÀ-Ü0-9][^\]]*\]/)
    expect(container.textContent).toContain('[DATE DE MISE À JOUR]')
  })

  it('offers a table of contents linking to each section', () => {
    renderPage(Page)

    const toc = screen.getByRole('navigation', { name: /sommaire/i })
    const links = within(toc).getAllByRole('link')
    expect(links.length).toBeGreaterThan(5)
    expect(links[0]).toHaveAttribute('href', '#section-1')
  })
})

describe('Legal pages — i18n', () => {
  it('renders the English version when the language changes', async () => {
    renderPage(PrivacyPolicy)
    await i18n.changeLanguage('en')

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /privacy policy/i })).toBeInTheDocument()
    )
    expect(screen.getByText(/must be reviewed by a lawyer/i)).toBeInTheDocument()
  })
})
