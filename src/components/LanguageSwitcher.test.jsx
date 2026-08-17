import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LanguageSwitcher from './LanguageSwitcher'
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n'

beforeEach(async () => {
  await i18n.changeLanguage('fr')
})

// Le changement de langue est global : on remet le français pour les tests suivants.
afterEach(async () => {
  await i18n.changeLanguage('fr')
})

describe('LanguageSwitcher', () => {
  it('lists the supported languages and marks the active one', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByRole('radio', { name: /français/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /english/i })).toHaveAttribute('aria-checked', 'false')
  })

  it('switches the language and persists the choice in localStorage', async () => {
    render(<LanguageSwitcher />)

    await userEvent.click(screen.getByRole('radio', { name: /english/i }))

    await waitFor(() => expect(i18n.resolvedLanguage).toBe('en'))
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: /english/i })).toHaveAttribute('aria-checked', 'true')
    )
  })

  it('keeps <html lang> in sync with the selected language', async () => {
    render(<LanguageSwitcher />)
    expect(document.documentElement.lang).toBe('fr')

    await userEvent.click(screen.getByRole('radio', { name: /english/i }))

    await waitFor(() => expect(document.documentElement.lang).toBe('en'))
  })
})
