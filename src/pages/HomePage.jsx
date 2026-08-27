import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { BookOpen, GraduationCap, Heart, ArrowRight, Sparkles } from 'lucide-react'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import TechIcon from '../components/TechIcon'
import useAuthStore from '../store/authStore'

const HERO_IMGS = ['/hero-1.webp', '/hero-2.webp', '/hero-3.webp']

// `name` est la clé canonique consommée par <TechIcon /> : elle reste en
// français. `labelKey` ne sert qu'à l'affichage des matières traduisibles ;
// les noms propres (React, Docker…) n'en ont pas.
const PILLS = [
  { name: 'React'      },
  { name: 'Python'     },
  { name: 'Maths',      labelKey: 'subjects.maths'    },
  { name: 'Anglais',    labelKey: 'subjects.english'  },
  { name: 'Design UI',  labelKey: 'subjects.designUi' },
  { name: 'Guitare',    labelKey: 'subjects.guitar'   },
  { name: 'Cuisine',    labelKey: 'subjects.cooking'  },
  { name: 'Docker'     },
  { name: 'Physique',   labelKey: 'subjects.physics'  },
  { name: 'TypeScript' },
  { name: 'Réseau',     labelKey: 'subjects.network'  },
]

const SUBJECTS = [
  { name: 'React'      },
  { name: 'Python'     },
  { name: 'Git'        },
  { name: 'Docker'     },
  { name: 'TypeScript' },
  { name: 'Node.js'    },
  { name: 'Maths',            labelKey: 'subjects.maths'         },
  { name: 'Physique',         labelKey: 'subjects.physics'       },
  { name: 'Réseau',           labelKey: 'subjects.network'       },
  { name: 'Cybersécurité',    labelKey: 'subjects.cybersecurity' },
  { name: 'Anglais',          labelKey: 'subjects.english'       },
  { name: 'Base de données',  labelKey: 'subjects.database'      },
  { name: 'Design UI',        labelKey: 'subjects.designUi'      },
  { name: 'Data Science',     labelKey: 'subjects.dataScience'   },
]

const USAGES = [
  { key: 'catchUp',      icon: BookOpen,       color: 'var(--peach)',    line: 'var(--orange-warm)' },
  { key: 'learnTech',    icon: GraduationCap,  color: 'var(--mint)',     line: 'var(--learn)'       },
  { key: 'sharePassion', icon: Heart,          color: 'var(--lavender)', line: 'var(--ink)'         },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, openModal } = useAuthStore()
  const [slide, setSlide] = useState(0)

  const label = ({ name, labelKey }) => (labelKey ? t(labelKey) : name)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_IMGS.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--cream)]">

      {/* ── HERO ── */}
      <section className="relative isolate overflow-hidden">
        {/* Photo carousel */}
        <div className="absolute inset-0 -z-10">
          {HERO_IMGS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden="true"
              loading={i === 0 ? 'eager' : 'lazy'}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms]"
              style={{ opacity: slide === i ? 1 : 0 }}
            />
          ))}
          <div className="absolute inset-0 bg-[#252840]/55" />
        </div>

        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {t('home.badge')}
            </span>
          </Reveal>

          <Reveal delay={1}>
            <h1 className="mt-6 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
              {t('home.heroTitleLine1')}<br />
              <span style={{ color: 'var(--orange-warm)' }}>{t('home.heroTitleLine2')}</span>
            </h1>
          </Reveal>

          <Reveal delay={2}>
            <p className="mt-6 max-w-2xl text-base text-white/85 sm:text-lg leading-relaxed">
              {t('home.heroText')}
            </p>
          </Reveal>

          <Reveal delay={3}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <button
                  onClick={() => navigate('/connection')}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 border-none cursor-pointer"
                  style={{ background: 'var(--orange-warm)' }}
                >
                  {t('home.ctaExplore')} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 border-none cursor-pointer"
                    style={{ background: 'var(--orange-warm)' }}
                  >
                    {t('home.ctaJoin')} <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openModal('login')}
                    className="rounded-full border border-white/60 px-6 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-[#252840] bg-transparent cursor-pointer"
                  >
                    {t('nav.login')}
                  </button>
                </>
              )}
            </div>
          </Reveal>

          <Reveal delay={4}>
            <div className="mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2">
              {PILLS.map(p => (
                <span key={p.name} className="pill bg-white/95 backdrop-blur">{label(p)}</span>
              ))}
            </div>
          </Reveal>

          {/* Pagination dots */}
          <div className="absolute bottom-8 flex gap-2">
            {HERO_IMGS.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={t('home.slideLabel', { index: i + 1 })}
                className={`h-1.5 rounded-full border-none cursor-pointer transition-all duration-300 ${
                  i === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 façons de progresser ── */}
      <section className="relative overflow-hidden py-24">
        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="text-center text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--orange-warm)' }}>
              {t('home.how.eyebrow')}
            </p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="mx-auto mt-3 max-w-3xl text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t('home.how.title')}
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {USAGES.map((c, i) => (
              <Reveal key={c.key} delay={(i + 1)}>
                <article className="card-lift relative h-full overflow-hidden rounded-3xl bg-white p-7 shadow-sm">
                  <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: c.line }} />
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: c.color }}>
                    <c.icon className="h-9 w-9 text-[#252840]" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold tracking-tight">{t(`home.usages.${c.key}.title`)}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    {t(`home.usages.${c.key}.text`)}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Matières & technos ── */}
      <section className="relative overflow-hidden py-24" style={{ background: '#fdfaf2' }}>
        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="text-center text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--learn)' }}>
              {t('home.catalog.eyebrow')}
            </p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="mx-auto mt-3 max-w-3xl text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t('home.catalog.title')}
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-3 max-w-2xl text-center" style={{ color: 'var(--muted-foreground)' }}>
              {t('home.catalog.text')}
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {SUBJECTS.map((s, i) => (
              <Reveal key={s.name} delay={((i % 5) + 1)}>
                <div className="card-lift flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
                  <TechIcon name={s.name} />
                  <span className="text-center text-sm font-semibold">{label(s)}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={3}>
            <div className="mt-12 text-center">
              <button
                onClick={() => navigate('/connection')}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 border-none cursor-pointer"
                style={{ background: 'var(--ink)' }}
              >
                {t('home.catalog.cta')} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Système de crédits ── */}
      <section className="relative overflow-hidden py-24 text-white" style={{ background: 'var(--ink)' }}>
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Reveal>
                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--orange-warm)' }}>
                  {t('home.creditsSection.eyebrow')}
                </p>
              </Reveal>
              <Reveal delay={1}>
                <h2 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                  <Trans
                    i18nKey="home.creditsSection.title"
                    components={{ highlight: <span style={{ color: 'var(--orange-warm)' }} /> }}
                  />
                </h2>
              </Reveal>
              <Reveal delay={2}>
                <p className="mt-5 max-w-xl text-white/80 leading-relaxed">
                  {t('home.creditsSection.text')}
                </p>
              </Reveal>
              <Reveal delay={3}>
                <ul className="mt-6 space-y-3 text-white/85">
                  {[
                    t('home.creditsSection.bullet1'),
                    t('home.creditsSection.bullet2'),
                    t('home.creditsSection.bullet3'),
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ background: 'var(--orange-warm)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { v: '120',   l: t('home.creditsSection.stat1'), c: 'var(--orange-warm)' },
                { v: '500',   l: t('home.creditsSection.stat2'), c: 'var(--peach)'       },
                { v: '1 min', l: t('home.creditsSection.stat3'), c: 'var(--mint)'        },
                { v: '0 €',   l: t('home.creditsSection.stat4'), c: 'var(--lavender)'    },
              ].map((s, i) => (
                <Reveal key={s.l} delay={(i + 1)}>
                  <div className="card-lift rounded-3xl p-6 backdrop-blur ring-1 ring-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="text-5xl font-extrabold tracking-tight" style={{ color: s.c }}>{s.v}</div>
                    <div className="mt-2 text-sm text-white/75">{s.l}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
