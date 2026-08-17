// src/components/ReportForm.jsx
// Formulaire de signalement réutilisable : utilisé par la page /report et
// exposé via <ReportDialog /> pour un signalement contextuel (profil, message…).
//
// ⚠️ Aucun endpoint backend ne reçoit encore les signalements
// (cf. PENDING_ENDPOINTS.report). Le formulaire ne prétend donc PAS avoir
// transmis quoi que ce soit : il affiche un état « non transmis » explicite et
// propose un envoi par email pré-rempli.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Mail, ShieldAlert } from 'lucide-react'
import { REPORT_EMAIL } from '../config/legal'

const TARGET_TYPES = ['user', 'message', 'profile', 'session', 'other']
const REASONS = [
  'harassment', 'sexual', 'hate', 'violence', 'danger',
  'spam', 'scam', 'fake', 'minor', 'other',
]

const MIN_DETAILS = 20

export default function ReportForm({
  targetType: initialTargetType = 'user',
  target: initialTarget = '',
  reporterEmail = '',
  onSubmitted,
}) {
  const { t } = useTranslation()

  const [targetType, setTargetType] = useState(initialTargetType)
  const [target,     setTarget]     = useState(initialTarget)
  const [reason,     setReason]     = useState('')
  const [details,    setDetails]    = useState('')
  const [contact,    setContact]    = useState(reporterEmail)
  const [errors,     setErrors]     = useState({})
  const [submitted,  setSubmitted]  = useState(null)

  const inp = 'w-full rounded-xl border border-[color:var(--border)] bg-light-cream px-4 text-sm text-navy outline-none focus:border-warm transition-colors'
  const lbl = 'block text-sm font-bold text-navy mb-1'
  const err = 'mt-1 text-xs font-semibold text-red-600'

  const validate = () => {
    const next = {}
    if (!target.trim())                    next.target  = t('report.errors.target')
    if (!reason)                           next.reason  = t('report.errors.reason')
    if (details.trim().length < MIN_DETAILS) next.details = t('report.errors.details')
    return next
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    // TODO(backend): POST /reports { targetType, target, reason, details, contact }
    // puis remplacer cet état par un vrai accusé de réception serveur.
    const payload = { targetType, target: target.trim(), reason, details: details.trim(), contact: contact.trim() }
    setSubmitted(payload)
    onSubmitted?.(payload)
  }

  if (submitted) {
    const lines = [
      `${t('report.fields.targetType')} : ${t(`report.targetTypes.${submitted.targetType}`)}`,
      `${t('report.fields.target')} : ${submitted.target}`,
      `${t('report.fields.reason')} : ${t(`report.reasons.${submitted.reason}`)}`,
      `${t('report.fields.details')} :`,
      submitted.details,
      submitted.contact ? `${t('report.fields.contact')} : ${submitted.contact}` : '',
    ].filter(Boolean)

    const mailto = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(
      `[Signalement] ${t(`report.reasons.${submitted.reason}`)}`
    )}&body=${encodeURIComponent(lines.join('\n'))}`

    return (
      <div className="rounded-3xl border-2 border-warm bg-[rgba(200,134,75,0.1)] p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-warm-strong text-white">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-navy">{t('report.pendingTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">
              {t('report.pendingText')}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[color:var(--border)] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-warm-strong">{t('report.summary')}</p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {lines.map((line, i) => (
              <li key={i} className="text-sm leading-relaxed text-[color:var(--muted-fg)] break-words">{line}</li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a
            href={mailto}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-warm-strong px-5 py-3 text-sm font-bold text-white no-underline hover:bg-warm-dk transition-colors"
          >
            <Mail size={15} aria-hidden="true" />
            {t('report.openMail')}
          </a>
          <button
            type="button"
            onClick={() => setSubmitted(null)}
            className="flex-1 cursor-pointer rounded-full border-2 border-navy bg-transparent px-5 py-3 text-sm font-bold text-navy hover:bg-navy hover:text-white transition-colors"
          >
            {t('report.editReport')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-card sm:p-8">
      <div className="mb-5 flex items-start gap-3 rounded-2xl bg-cream p-4">
        <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-sage" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-[color:var(--muted-fg)]">{t('report.confidential')}</p>
      </div>

      <div className="mb-4">
        <label htmlFor="report-target-type" className={lbl}>{t('report.fields.targetType')}</label>
        <select
          id="report-target-type"
          value={targetType}
          onChange={e => setTargetType(e.target.value)}
          className={`${inp} h-11`}
        >
          {TARGET_TYPES.map(key => (
            <option key={key} value={key}>{t(`report.targetTypes.${key}`)}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="report-target" className={lbl}>{t('report.fields.target')}</label>
        <input
          id="report-target"
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder={t('report.fields.targetPlaceholder')}
          aria-invalid={!!errors.target || undefined}
          aria-describedby={errors.target ? 'report-target-error' : undefined}
          className={`${inp} h-11`}
        />
        {errors.target && <p id="report-target-error" className={err} role="alert">{errors.target}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="report-reason" className={lbl}>{t('report.fields.reason')}</label>
        <select
          id="report-reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          aria-invalid={!!errors.reason || undefined}
          aria-describedby={errors.reason ? 'report-reason-error' : undefined}
          className={`${inp} h-11`}
        >
          <option value="">{t('report.fields.reasonPlaceholder')}</option>
          {REASONS.map(key => (
            <option key={key} value={key}>{t(`report.reasons.${key}`)}</option>
          ))}
        </select>
        {errors.reason && <p id="report-reason-error" className={err} role="alert">{errors.reason}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="report-details" className={lbl}>{t('report.fields.details')}</label>
        <textarea
          id="report-details"
          rows={5}
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder={t('report.fields.detailsPlaceholder')}
          aria-invalid={!!errors.details || undefined}
          aria-describedby={errors.details ? 'report-details-error' : undefined}
          className={`${inp} py-3 resize-y`}
        />
        {errors.details && <p id="report-details-error" className={err} role="alert">{errors.details}</p>}
      </div>

      <div className="mb-5">
        <label htmlFor="report-contact" className={lbl}>{t('report.fields.contact')}</label>
        <input
          id="report-contact"
          type="email"
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder={t('report.fields.contactPlaceholder')}
          aria-describedby="report-contact-hint"
          className={`${inp} h-11`}
        />
        <p id="report-contact-hint" className="mt-1 text-xs text-[color:var(--muted-fg)]">{t('report.fields.contactHint')}</p>
      </div>

      <button
        type="submit"
        className="w-full cursor-pointer rounded-full border-none bg-warm-strong py-3 text-sm font-bold text-white hover:bg-warm-dk transition-colors"
      >
        {t('report.submit')}
      </button>

      <p className="mt-4 rounded-2xl bg-cream p-4 text-xs leading-relaxed text-[color:var(--muted-fg)]">
        {t('report.emergency')}
      </p>
    </form>
  )
}
