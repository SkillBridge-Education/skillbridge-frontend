// src/pages/Report.jsx — Signaler un utilisateur ou un contenu
// Accepte des paramètres d'URL pour préremplir le formulaire depuis un contexte :
//   /report?type=message&target=Léa%20Arnaud
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import ReportForm from '../components/ReportForm'
import Footer from '../components/Footer'

const VALID_TYPES = ['user', 'message', 'profile', 'session', 'other']

export default function Report() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [params] = useSearchParams()

  const typeParam = params.get('type')
  const targetType = VALID_TYPES.includes(typeParam) ? typeParam : 'user'
  const target = params.get('target') ?? ''

  return (
    <>
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-2xl px-6 py-12">

          <p className="text-xs font-bold uppercase tracking-widest text-warm">{t('report.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">{t('report.title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">{t('report.subtitle')}</p>

          <div className="mt-8">
            <ReportForm
              targetType={targetType}
              target={target}
              reporterEmail={user?.email ?? ''}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/help"
              className="rounded-full border border-[color:var(--border)] bg-light-cream px-4 py-2 text-sm font-semibold text-navy no-underline hover:border-navy transition-colors"
            >
              {t('footer.helpCenter')}
            </Link>
            <Link
              to="/support"
              className="rounded-full border border-[color:var(--border)] bg-light-cream px-4 py-2 text-sm font-semibold text-navy no-underline hover:border-navy transition-colors"
            >
              {t('footer.support')}
            </Link>
            <Link
              to="/terms"
              className="rounded-full border border-[color:var(--border)] bg-light-cream px-4 py-2 text-sm font-semibold text-navy no-underline hover:border-navy transition-colors"
            >
              {t('footer.terms')}
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
