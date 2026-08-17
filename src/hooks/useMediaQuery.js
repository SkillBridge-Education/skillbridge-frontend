// src/hooks/useMediaQuery.js
// Permet à React de savoir ce que le CSS affiche réellement. Utile quand un
// élément est masqué par une media query : il faut alors le neutraliser pour
// le clavier et les lecteurs d'écran (attribut `inert`), ce que le CSS seul
// ne fait pas.
import { useEffect, useState } from 'react'

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    setMatches(mql.matches)
    // addEventListener n'existe pas sur les vieux Safari : repli sur addListener.
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [query])

  return matches
}
