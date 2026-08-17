// src/components/LanguageSwitcher.jsx
// Sélecteur de langue réutilisable (utilisé dans la page Paramètres).
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { SUPPORTED_LANGUAGES } from '../i18n'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage || i18n.language

  return (
    <div role="radiogroup" aria-label={t('language.select')} className="grid gap-3 sm:grid-cols-2">
      {SUPPORTED_LANGUAGES.map(({ code, nativeName, flag }) => {
        const active = current === code
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            lang={code}
            onClick={() => i18n.changeLanguage(code)}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold cursor-pointer transition-colors ${
              active
                ? 'border-2 border-warm bg-[rgba(200,134,75,0.1)] text-navy'
                : 'border border-[color:var(--border)] bg-light-cream text-navy hover:border-navy'
            }`}
          >
            <span aria-hidden="true" className="text-lg leading-none">{flag}</span>
            <span className="flex-1">{nativeName}</span>
            {active && <Check size={16} className="text-warm-strong flex-shrink-0" aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}
