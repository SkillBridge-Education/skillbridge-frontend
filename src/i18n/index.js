// src/i18n/index.js — configuration i18next (fr par défaut, en secondaire)
//
// Les traductions sont chargées statiquement (pas de backend HTTP) : l'init est
// donc synchrone, ce qui évite tout état de suspense au premier rendu.
//
// Ajouter une langue :
//   1. créer src/i18n/locales/<code>/common.json et <code>/legal.json
//   2. les importer ci-dessous et les ajouter à `resources`
//   3. ajouter une entrée dans SUPPORTED_LANGUAGES
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import frCommon from './locales/fr/common.json'
import frLegal  from './locales/fr/legal.json'
import enCommon from './locales/en/common.json'
import enLegal  from './locales/en/legal.json'

export const LANGUAGE_STORAGE_KEY = 'sb_lang'

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', labelKey: 'language.fr', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', labelKey: 'language.en', nativeName: 'English',  flag: '🇬🇧' },
]

export const DEFAULT_LANGUAGE = 'fr'

const resources = {
  fr: { common: frCommon, legal: frLegal },
  en: { common: enCommon, legal: enLegal },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES.map(l => l.code),
    nonExplicitSupportedLngs: true, // fr-FR / fr-BE → fr
    load: 'languageOnly',
    ns: ['common', 'legal'],
    defaultNS: 'common',
    interpolation: { escapeValue: false }, // React échappe déjà
    detection: {
      // 1. choix explicite de l'utilisateur, 2. langue du navigateur
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  })

// Garde <html lang="…"> synchronisé — accessibilité + SEO.
if (typeof document !== 'undefined') {
  const applyLang = (lng) => { document.documentElement.lang = lng || DEFAULT_LANGUAGE }
  applyLang(i18n.resolvedLanguage)
  i18n.on('languageChanged', applyLang)
}

export default i18n
