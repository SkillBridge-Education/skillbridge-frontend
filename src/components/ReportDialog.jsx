// src/components/ReportDialog.jsx
// Enveloppe modale autour de <ReportForm /> pour signaler depuis un contexte
// précis (profil, message, session) sans quitter la page.
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ReportForm from './ReportForm'

export default function ReportDialog({ open, onClose, targetType = 'user', target = '', reporterEmail = '' }) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[500] flex items-start justify-center overflow-y-auto bg-[rgba(26,20,16,0.6)] px-4 py-10 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('report.title')}
        className="animate-modal-in relative w-full max-w-lg"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('actions.close')}
          className="absolute -top-3 right-2 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-white text-[color:var(--muted-fg)] shadow-card hover:bg-cream transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>

        <h2 className="mb-3 text-xl font-black tracking-tight text-white">{t('report.title')}</h2>

        <ReportForm
          targetType={targetType}
          target={target}
          reporterEmail={reporterEmail}
          onSubmitted={() => {}}
        />
      </div>
    </div>
  )
}
