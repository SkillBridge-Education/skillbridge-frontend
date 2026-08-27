import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const TABS = [
  {
    to: '/',
    labelKey: 'nav.home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M8 20v-8h6v8"/>
      </svg>
    ),
  },
  {
    to: '/connection',
    labelKey: 'nav.connections',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="8" cy="8" r="3.5"/>
        <path d="M2 19c0-3.3 2.7-6 6-6"/>
        <circle cx="16" cy="8" r="3.5"/>
        <path d="M12 19c0-3.3 2.7-6 6-6"/>
      </svg>
    ),
  },
  {
    to: '/sessions',
    labelKey: 'nav.sessions',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="2" y="5" width="14" height="12" rx="2.5"/>
        <path d="M16 9l4-2.5v9L16 13"/>
      </svg>
    ),
  },
  {
    to: '/chat',
    labelKey: 'nav.messages',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M2 3h18a1 1 0 011 1v12a1 1 0 01-1 1H6l-4 4V4a1 1 0 011-1z"/>
      </svg>
    ),
  },
  {
    to: '/profile',
    labelKey: 'nav.profile',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="11" cy="8" r="4"/>
        <path d="M3 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const isActive = (to) =>
    to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/')

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F8F4EA]/95 backdrop-blur-md border-t border-black/[0.09]">
      <div className="flex h-16 items-center pb-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}>
        {TABS.map(tab => {
          const active = isActive(tab.to)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 no-underline transition-colors"
              style={{ color: active ? '#C8864B' : '#7A6E5C' }}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold leading-none">{t(tab.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
