import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const NAV_LINKS = [
  { to: '/',           key: 'nav.home'        },
  { to: '/connection', key: 'nav.connections' },
  { to: '/sessions',   key: 'nav.sessions'    },
  { to: '/chat',       key: 'nav.messages'    },
  { to: '/credits',    key: 'nav.credits'     },
  { to: '/profile',    key: 'nav.profile'     },
]

const LEGAL_LINKS = [
  { to: '/legal-notice', key: 'footer.legalNotice' },
  { to: '/privacy',      key: 'footer.privacy'     },
  { to: '/terms',        key: 'footer.terms'       },
  { to: '/settings',     key: 'footer.settings'    },
]

const HELP_LINKS = [
  { to: '/help',    key: 'footer.helpCenter' },
  { to: '/support', key: 'footer.support'    },
  { to: '/report',  key: 'footer.report'     },
]

const linkCls = 'text-sm text-[rgba(248,244,234,0.7)] hover:text-[#C8864B] transition-colors no-underline'
const titleCls = 'text-xs font-bold uppercase tracking-widest text-[#C8864B] mb-4'

function LinkColumn({ title, links, t }) {
  return (
    <div>
      <p className={titleCls}>{title}</p>
      <ul className="flex flex-col gap-3 list-none p-0 m-0">
        {links.map(({ to, key }) => (
          <li key={to}>
            <Link to={to} className={linkCls}>{t(key)}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t-2 border-[rgba(255,255,255,0.14)] bg-[#0E0F1C] text-[#F8F4EA]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">

        {/* 4 colonnes */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">

          {/* Colonne 1 — Logo + tagline */}
          <div className="flex flex-col gap-4">
            <div>
              <img src="/skillbridge-logo-dark.webp" alt="SkillBridge" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-[rgba(248,244,234,0.7)] leading-relaxed max-w-[220px]">
              {t('app.taglineLine1')}<br />{t('app.taglineLine2')}
            </p>
          </div>

          {/* Colonne 2 — Navigation */}
          <LinkColumn title={t('footer.navigation')} links={NAV_LINKS} t={t} />

          {/* Colonne 3 — Légal */}
          <LinkColumn title={t('footer.legal')} links={LEGAL_LINKS} t={t} />

          {/* Colonne 4 — Aide */}
          <LinkColumn title={t('footer.help')} links={HELP_LINKS} t={t} />
        </div>

        {/* Bas */}
        <div className="mt-12 border-t border-[rgba(255,255,255,0.08)] pt-6 text-center">
          <p className="text-xs text-[rgba(248,244,234,0.4)]">
            {t('footer.credits')}
          </p>
        </div>
      </div>
    </footer>
  )
}
