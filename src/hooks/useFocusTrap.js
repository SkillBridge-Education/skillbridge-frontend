// src/hooks/useFocusTrap.js
// Piégeage du focus pour les fenêtres modales (WCAG 2.1.2 « pas de piège au
// clavier » + 2.4.3 « ordre du focus »).
//
// Quand `active` passe à true :
//   1. on mémorise l'élément qui avait le focus (le déclencheur) ;
//   2. on déplace le focus dans la boîte de dialogue ;
//   3. Tab / Maj+Tab bouclent à l'intérieur au lieu de repartir dans la page ;
//   4. Échap appelle `onEscape` ;
//   5. à la fermeture, le focus revient sur le déclencheur.
import { useCallback, useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableWithin(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => {
    if (el.getAttribute('aria-hidden') === 'true') return false
    if (el.closest('[inert]')) return false
    // offsetParent est null pour un élément display:none ; en jsdom il l'est
    // toujours, d'où le repli sur la présence dans le document.
    return el.offsetParent !== null || el.ownerDocument === document
  })
}

export default function useFocusTrap(active, onEscape) {
  const containerRef = useRef(null)
  const escapeRef    = useRef(onEscape)
  const lastOutsideRef = useRef(null)
  const activeRef      = useRef(active)

  // Écrit pendant le rendu, donc AVANT le commit : c'est ce qui permet au
  // garde ci-dessous de voir la boîte comme « déjà ouverte » au moment où le
  // navigateur applique un éventuel `autoFocus`.
  activeRef.current = active

  // On mémorise en continu le dernier élément focalisé pendant que le piège
  // est inactif. Lire `document.activeElement` à l'ouverture ne suffit pas :
  // un champ `autoFocus` prend le focus pendant le commit, avant que l'effet
  // ne s'exécute, et on mémoriserait alors un élément de la boîte elle-même —
  // le focus ne reviendrait jamais au déclencheur.
  useEffect(() => {
    const onFocusIn = (e) => {
      if (activeRef.current) return
      lastOutsideRef.current = e.target
    }
    document.addEventListener('focusin', onFocusIn, true)
    return () => document.removeEventListener('focusin', onFocusIn, true)
  }, [])

  // On garde le callback dans une ref : le piège ne doit pas se ré-installer
  // à chaque rendu du parent simplement parce que la fonction change d'identité.
  useEffect(() => { escapeRef.current = onEscape }, [onEscape])

  const focusFirst = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const items = focusableWithin(container)
    if (items.length > 0) items[0].focus()
    else {
      // Boîte sans élément focusable : on rend le conteneur focusable pour que
      // le lecteur d'écran commence bien à l'intérieur.
      container.setAttribute('tabindex', '-1')
      container.focus()
    }
  }, [])

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const active_el = document.activeElement
    const previouslyFocused = active_el && !container.contains(active_el)
      ? active_el
      : lastOutsideRef.current
    focusFirst()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        escapeRef.current?.()
        return
      }
      if (e.key !== 'Tab') return

      const items = focusableWithin(container)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last  = items[items.length - 1]
      const current = document.activeElement

      if (!container.contains(current)) {
        e.preventDefault()
        first.focus()
        return
      }
      if (e.shiftKey && current === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && current === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)

      // Le focus revient au déclencheur, sauf s'il a disparu du DOM entre-temps.
      const restore = () => {
        if (previouslyFocused && document.contains(previouslyFocused)) {
          previouslyFocused.focus?.()
        }
      }
      restore()
      // React démonte la boîte après avoir exécuté ce nettoyage : la
      // suppression du noeud qui avait le focus le renvoie alors sur <body>,
      // ce qui annulerait la restitution. On la rejoue une fois le DOM stable.
      queueMicrotask(restore)
    }
  }, [active, focusFirst])

  return containerRef
}
