import '@testing-library/jest-dom/vitest'
import i18n from './i18n'

// jsdom annonce une locale en-US : on force le français (langue par défaut de
// l'app) pour que les tests soient déterministes quelle que soit la machine.
// `await` au niveau module : Vitest attend la fin du setup avant de lancer les
// tests, donc aucun rendu ne peut partir en anglais.
await i18n.changeLanguage('fr')

// jsdom doesn't implement matchMedia; HomePage's reduced-motion check needs it.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom doesn't implement IntersectionObserver either; components/Reveal.jsx needs it.
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
