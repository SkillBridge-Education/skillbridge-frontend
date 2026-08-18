// src/pages/Report.jsx — Signaler un utilisateur
// La cible est identifiée par son id, exigé par POST /reports :
//   /report?userId=<id>&name=<affichage>&messageId=<id facultatif>
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReportForm from '../components/ReportForm'
import Footer from '../components/Footer'

export default function Report() {
  const { t } = useTranslation()
  const [params] = useSearchParams()

  const reportedUserId = params.get('userId') ?? ''
  const reportedName   = params.get('name') ?? ''
  const messageId      = params.get('messageId') ?? undefined

  return (
    <>
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-2xl px-6 py-12">

          <p className="text-xs font-bold uppercase tracking-widest text-warm-strong">{t('report.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">{t('report.title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">{t('report.subtitle')}</p>

          <div className="mt-8">
            <ReportForm
              reportedUserId={reportedUserId}
              reportedName={reportedName}
              messageId={messageId}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/connection"
              className="rounded-full border border-[color:var(--border)] bg-light-cream px-4 py-2 text-sm font-semibold text-navy no-underline hover:border-navy transition-colors"
            >
              {t('nav.connections')}
            </Link>
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
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
