// src/components/CookieBanner.jsx
// S'affiche une seule fois au premier chargement du site

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'

export default function CookieBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // On vérifie si l'utilisateur a déjà répondu
    const choice = localStorage.getItem('sb_cookie')
    if (!choice) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('sb_cookie', 'ok')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('sb_cookie', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  const linkCls = 'text-[#C8864B] no-underline hover:underline'

  return (
    <div className="
      fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]
      bg-[#1A1410] text-[rgba(253,250,244,0.82)]
      rounded-2xl px-6 py-[18px]
      flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5
      max-w-[680px] w-[calc(100vw-32px)]
      shadow-[0_8px_40px_rgba(0,0,0,0.28)]
      animate-[slideUp_0.4s_cubic-bezier(0.4,0,0.2,1)]
    ">
      <p className="text-[13px] leading-[1.55] flex-1">
        <Trans
          i18nKey="cookies.text"
          components={{
            privacy: <Link to="/privacy" className={linkCls} />,
            terms:   <Link to="/terms"   className={linkCls} />,
          }}
        />
      </p>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={decline}
          className="px-4 py-2 rounded-lg bg-transparent text-[rgba(253,250,244,0.6)] border border-white/15 text-xs font-bold cursor-pointer hover:border-white/40 transition-all font-inter"
        >
          {t('cookies.decline')}
        </button>
        <button
          onClick={accept}
          className="px-4 py-2 rounded-lg bg-[#C8864B] text-white border-none text-xs font-bold cursor-pointer hover:bg-[#8C5A1E] transition-all font-inter"
        >
          {t('cookies.accept')}
        </button>
      </div>
    </div>
  )
}
