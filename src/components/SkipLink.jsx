// src/components/SkipLink.jsx
// Lien d'évitement (WCAG 2.4.1) : premier élément focusable de la page, il
// permet de sauter la navigation pour atteindre directement le contenu.
//
// On n'utilise pas <Link> : react-router intercepterait le clic et changerait
// l'URL sans déplacer le focus. Ici on gère le déplacement nous-mêmes pour que
// le lecteur d'écran reprenne la lecture au bon endroit.
import { useTranslation } from 'react-i18next'

export default function SkipLink({ targetId = 'main-content' }) {
  const { t } = useTranslation()

  const focusMain = (e) => {
    e.preventDefault()
    const main = document.getElementById(targetId)
    if (!main) return
    main.focus({ preventScroll: false })
    // scrollIntoView n'existe pas partout (jsdom, vieux WebView) : le focus
    // suffit, le défilement n'est qu'un confort.
    main.scrollIntoView?.({ block: 'start' })
  }

  return (
    <a href={`#${targetId}`} onClick={focusMain} className="skip-link">
      {t('a11y.skipToContent')}
    </a>
  )
}
