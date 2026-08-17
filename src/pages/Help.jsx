// src/pages/Help.jsx — Aide / FAQ (contenu dans les fichiers de traduction)
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, LifeBuoy, Search } from 'lucide-react'
import Footer from '../components/Footer'

export default function Help() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [openIndex, setOpenIndex] = useState(0)

  const faq = t('help.faq', { returnObjects: true })

  const filtered = useMemo(() => {
    const items = Array.isArray(faq) ? faq : []
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(item =>
      item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    )
  }, [faq, query])

  return (
    <>
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-12">

          <p className="text-xs font-bold uppercase tracking-widest text-warm-strong">{t('help.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">{t('help.title')}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--muted-fg)]">{t('help.subtitle')}</p>

          {/* Recherche */}
          <div className="relative mt-6">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted-fg)]"
            />
            <input
              type="search"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpenIndex(-1) }}
              placeholder={t('help.searchPlaceholder')}
              aria-label={t('help.searchPlaceholder')}
              className="h-12 w-full rounded-full border border-[color:var(--border)] bg-white pl-11 pr-4 text-sm text-navy outline-none focus:border-warm transition-colors"
            />
          </div>

          {/* Questions */}
          <div className="mt-6 flex flex-col gap-3">
            {filtered.length === 0 && (
              <p className="rounded-3xl border border-[color:var(--border)] bg-white p-6 text-center text-sm text-[color:var(--muted-fg)]">
                {t('help.noResults')}
              </p>
            )}

            {filtered.map((item, i) => {
              const open = openIndex === i
              return (
                <div key={item.q} className="overflow-hidden rounded-3xl border border-[color:var(--border)] bg-white shadow-card">
                  <h2>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenIndex(open ? -1 : i)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent p-5 text-left text-sm font-bold text-navy hover:bg-light-cream transition-colors sm:p-6"
                    >
                      {item.q}
                      <ChevronDown
                        size={18}
                        aria-hidden="true"
                        className={`flex-shrink-0 text-warm-strong transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </h2>
                  {open && (
                    <p className="px-5 pb-5 text-sm leading-relaxed text-[color:var(--muted-fg)] sm:px-6 sm:pb-6">
                      {item.a}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Toujours bloqué ? */}
          <div className="mt-8 rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-cream text-warm-strong">
                <LifeBuoy size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-navy">{t('help.stillStuck')}</h2>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted-fg)]">{t('help.stillStuckText')}</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/support"
                    className="flex-1 rounded-full bg-warm-strong px-5 py-3 text-center text-sm font-bold text-white no-underline hover:bg-warm-dk transition-colors"
                  >
                    {t('help.contactCta')}
                  </Link>
                  <Link
                    to="/report"
                    className="flex-1 rounded-full border-2 border-navy bg-transparent px-5 py-3 text-center text-sm font-bold text-navy no-underline hover:bg-navy hover:text-white transition-colors"
                  >
                    {t('help.reportCta')}
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
