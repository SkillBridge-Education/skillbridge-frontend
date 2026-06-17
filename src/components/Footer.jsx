import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/',           label: 'Accueil'    },
  { to: '/connection', label: 'Connexions' },
  { to: '/sessions',   label: 'Sessions'   },
  { to: '/chat',       label: 'Messages'   },
  { to: '/credits',    label: 'Crédits'    },
  { to: '/profile',    label: 'Profil'     },
]

const LEGAL_LINKS = [
  { href: '#', label: 'Mentions légales'           },
  { href: '#', label: 'Politique de confidentialité' },
  { href: '#', label: 'CGU'                        },
]

export default function Footer() {
  return (
    <footer className="border-t-2 border-[rgba(255,255,255,0.14)] bg-[#0E0F1C] text-[#F8F4EA]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">

        {/* 3 colonnes */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">

          {/* Colonne 1 — Logo + tagline */}
          <div className="flex flex-col gap-4">
            <div>
              <img src="/skillbridge-logo-dark.webp" alt="SkillBridge" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-[rgba(248,244,234,0.7)] leading-relaxed max-w-[220px]">
              Partager ce qu'on sait.<br />Apprendre ce qu'on aime.
            </p>
          </div>

          {/* Colonne 2 — Navigation */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#C8864B] mb-4">Navigation</p>
            <ul className="flex flex-col gap-3 list-none p-0 m-0">
              {NAV_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-[rgba(248,244,234,0.7)] hover:text-[#C8864B] transition-colors no-underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 3 — Légal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#C8864B] mb-4">Légal</p>
            <ul className="flex flex-col gap-3 list-none p-0 m-0">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-[rgba(248,244,234,0.7)] hover:text-[#C8864B] transition-colors no-underline"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bas */}
        <div className="mt-12 border-t border-[rgba(255,255,255,0.08)] pt-6 text-center">
          <p className="text-xs text-[rgba(248,244,234,0.4)]">
            SkillBridge · HETIC Fast Tracks 2026 · Jimel · Yanis · Mahamane · Yahia
          </p>
        </div>
      </div>
    </footer>
  )
}
