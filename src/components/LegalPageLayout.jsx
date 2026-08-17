// src/components/LegalPageLayout.jsx
// Mise en page commune aux documents juridiques (mentions légales, politique de
// confidentialité, CGU). Affiche systématiquement le bandeau « gabarit » : ces
// documents sont des modèles, pas des textes définitifs.
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Footer from './Footer'

const slugify = (index) => `section-${index + 1}`

export default function LegalPageLayout({ docKey, related = [] }) {
  const { t } = useTranslation('legal')
  const sections = t(`${docKey}.sections`, { returnObjects: true })
  const list = Array.isArray(sections) ? sections : []

  return (
    <>
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-12">

          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--muted-fg)] no-underline hover:text-navy transition-colors"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            {t('actions.backHome', { ns: 'common' })}
          </Link>

          <p className="text-xs font-bold uppercase tracking-widest text-warm">{t('eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">
            {t(`${docKey}.title`)}
          </h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-fg)]">
            {t('lastUpdated')}
          </p>

          {/* Bandeau d'avertissement — obligatoire sur chaque document type */}
          <aside
            role="note"
            className="mt-6 rounded-3xl border-2 border-warm bg-[rgba(200,134,75,0.1)] p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-warm text-white">
                <AlertTriangle size={18} aria-hidden="true" />
              </span>
              <div>
                <span className="inline-block rounded-full bg-warm px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  {t('disclaimer.badge')}
                </span>
                <p className="mt-2 text-sm font-bold leading-snug text-navy">
                  {t('disclaimer.title')}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">
                  {t('disclaimer.text')}
                </p>
              </div>
            </div>
          </aside>

          <p className="mt-8 text-sm leading-relaxed text-[color:var(--muted-fg)]">
            {t(`${docKey}.intro`)}
          </p>

          {/* Sommaire */}
          <nav aria-label={t('toc')} className="mt-8 rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-card">
            <p className="text-xs font-bold uppercase tracking-widest text-warm">{t('toc')}</p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {list.map((section, i) => (
                <li key={slugify(i)}>
                  <a
                    href={`#${slugify(i)}`}
                    className="text-sm text-[color:var(--muted-fg)] no-underline hover:text-warm transition-colors"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Corps du document */}
          <article className="mt-6 rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-card sm:p-8">
            {list.map((section, i) => (
              <section
                key={slugify(i)}
                id={slugify(i)}
                className="scroll-mt-24 mt-8 border-t border-[color:var(--border)] pt-8 first:mt-0 first:border-t-0 first:pt-0"
              >
                <h2 className="text-lg font-bold text-navy">{section.title}</h2>
                {(section.body ?? []).map((paragraph, j) => (
                  <p key={j} className="mt-3 text-sm leading-relaxed text-[color:var(--muted-fg)]">
                    {paragraph}
                  </p>
                ))}
                {section.items?.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-2">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-[color:var(--muted-fg)]">
                        <span aria-hidden="true" className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-warm" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>

          {/* Documents liés */}
          {related.length > 0 && (
            <div className="mt-6 rounded-3xl border border-[color:var(--border)] bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-warm">{t('relatedTitle')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {related.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="rounded-full border border-[color:var(--border)] bg-light-cream px-4 py-2 text-sm font-semibold text-navy no-underline hover:border-navy transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
