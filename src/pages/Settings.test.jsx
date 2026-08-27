import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Settings from './Settings'
import useAuthStore from '../store/authStore'
import i18n from '../i18n'

// La carte « Personnes bloquées » interroge l'API au montage, et les deux
// actions RGPD appellent le serveur.
const exportData = vi.fn().mockResolvedValue({ user: { id: '1' }, sessions: [] })
const deleteAccount = vi.fn().mockResolvedValue(undefined)

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    blockApi: { list: vi.fn().mockResolvedValue([]), block: vi.fn(), unblock: vi.fn() },
    privacyApi: {
      exportData: (...args) => exportData(...args),
      deleteAccount: (...args) => deleteAccount(...args),
    },
  }
})

const renderSettings = () => render(
  <MemoryRouter>
    <Settings />
  </MemoryRouter>
)

beforeEach(async () => {
  localStorage.clear()
  await i18n.changeLanguage('fr')
  useAuthStore.setState({ user: null, token: null, authReady: true })
})

afterEach(async () => {
  await i18n.changeLanguage('fr')
})

describe('Settings', () => {
  it('renders every settings section', () => {
    renderSettings()

    expect(screen.getByRole('heading', { level: 1, name: /paramètres/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^langue$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^notifications$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^confidentialité$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /mon compte/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /informations légales/i })).toBeInTheDocument()
  })

  it('exposes the language switcher and translates the page when it changes', async () => {
    renderSettings()

    await userEvent.click(screen.getByRole('radio', { name: /english/i }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /^settings$/i })).toBeInTheDocument()
    )
  })

  it('persists a notification preference in localStorage', async () => {
    renderSettings()

    const pushToggle = screen.getByRole('switch', { name: /notifications sur l'appareil/i })
    expect(pushToggle).toHaveAttribute('aria-checked', 'false')

    await userEvent.click(pushToggle)

    expect(pushToggle).toHaveAttribute('aria-checked', 'true')
    expect(JSON.parse(localStorage.getItem('sb_prefs')).notifPush).toBe(true)
    expect(screen.getByText(/préférences enregistrées/i)).toBeInTheDocument()
  })

  it('persists the profile visibility choice', async () => {
    renderSettings()

    await userEvent.click(screen.getByRole('radio', { name: /^public/i }))

    expect(JSON.parse(localStorage.getItem('sb_prefs')).visibility).toBe('public')
  })

  it('invites anonymous visitors to log in instead of showing account actions', () => {
    renderSettings()

    expect(screen.getByText(/connecte-toi pour exporter tes données/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /supprimer mon compte/i })).not.toBeInTheDocument()
  })

  // Ces deux droits sont garantis par la loi. Ils étaient affichés « bientôt
  // disponible » alors que les routes serveur existaient et fonctionnaient.
  it('exports the account data when asked', async () => {
    useAuthStore.setState({ user: { id: '1', firstName: 'Ada', email: 'ada@example.com' }, token: 'jwt' })
    const createObjectURL = vi.fn().mockReturnValue('blob:fake')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    renderSettings()

    const button = screen.getByRole('button', { name: /exporter mes données/i })
    expect(button).toBeEnabled()

    await userEvent.click(button)

    await waitFor(() => expect(exportData).toHaveBeenCalled())
    // L'export doit repartir en fichier : un droit à la portabilité qui ne
    // produit rien d'emportable n'en est pas un.
    expect(createObjectURL).toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  it('asks for the password before deleting the account', async () => {
    useAuthStore.setState({ user: { id: '1', firstName: 'Ada', email: 'ada@example.com' }, token: 'jwt' })
    renderSettings()

    await userEvent.click(screen.getByRole('button', { name: /supprimer mon compte/i }))

    // Irréversible : rien ne part tant que le mot de passe n'est pas saisi.
    const confirm = screen.getByRole('button', { name: /supprimer définitivement/i })
    expect(confirm).toBeDisabled()
    expect(deleteAccount).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText(/confirme avec ton mot de passe/i), 'mon-mot-de-passe')
    await userEvent.click(screen.getByRole('button', { name: /supprimer définitivement/i }))

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith('mon-mot-de-passe'))
  })

  it('links to the legal documents', () => {
    renderSettings()

    expect(screen.getAllByRole('link', { name: /mentions légales/i })[0]).toHaveAttribute('href', '/legal-notice')
    expect(screen.getAllByRole('link', { name: /politique de confidentialité/i })[0]).toHaveAttribute('href', '/privacy')
    expect(screen.getAllByRole('link', { name: /^cgu$/i })[0]).toHaveAttribute('href', '/terms')
  })
})
