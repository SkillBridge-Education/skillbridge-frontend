// src/components/ReportForm.jsx
// Formulaire de signalement réutilisable : utilisé par la page /report et
// exposé via <ReportDialog /> pour un signalement contextuel (profil, message).
//
// Le signalement part réellement sur POST /reports. L'API identifie la personne
// par son id : un signalement sans `reportedUserId` ne peut pas être envoyé, la
// page appelante doit donc fournir la cible.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Check, ShieldAlert } from 'lucide-react'
import { reportApi, REPORT_REASONS, getApiError } from '../services/api'

const MIN_DETAILS = 20

export default function ReportForm({
  reportedUserId,
  reportedName = '',
  messageId,
  onSubmitted,
}) {
  const { t } = useTranslation()

  const [reason,      setReason]      = useState('')
  const [description, setDescription] = useState('')
  const [errors,      setErrors]      = useState({})
  const [sending,     setSending]     = useState(false)
  const [formError,   setFormError]   = useState('')
  const [sent,        setSent]        = useState(false)

  const inp = 'w-full rounded-xl border border-[color:var(--field-border)] bg-light-cream px-4 text-sm text-navy outline-none focus:border-warm transition-colors'
  const lbl = 'block text-sm font-bold text-navy mb-1'
  const err = 'mt-1 text-xs font-semibold text-red-600'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!reason) next.reason = t('report.errors.reason')
    // L'API accepte une description vide, mais un « autre motif » sans
    // explication n'est pas exploitable par la modération.
    if (reason === 'OTHER' && description.trim().length < MIN_DETAILS) {
      next.description = t('report.errors.details')
    }
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return

    setSending(true)
    try {
      const report = await reportApi.create({
        reportedUserId,
        reason,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(messageId ? { messageId } : {}),
      })
      setSent(true)
      onSubmitted?.(report)
    } catch (e2) {
      const status = e2?.response?.status
      if (status === 409)      setFormError(t('report.errors.alreadyPending'))
      else if (status === 429) setFormError(t('report.errors.tooMany'))
      else if (status === 400) setFormError(getApiError(e2))
      else                     setFormError(t('report.errors.failed'))
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl border-2 border-sage bg-[rgba(61,92,40,0.08)] p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-sage text-white">
            <Check size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-navy">{t('report.sentTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">
              {t('report.sentText')}
            </p>
          </div>
        </div>
        <p className="mt-5 rounded-2xl bg-cream p-4 text-xs leading-relaxed text-[color:var(--muted-fg)]">
          {t('report.emergency')}
        </p>
      </div>
    )
  }

  // Sans cible identifiée, l'envoi est impossible : on le dit au lieu de
  // laisser l'utilisateur remplir un formulaire qui échouera.
  if (!reportedUserId) {
    return (
      <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-warm-strong" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-bold text-navy">{t('report.noTargetTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">
              {t('report.noTargetText')}
            </p>
          </div>
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

      {reportedName && (
        <p className="mb-4 text-sm text-[color:var(--muted-fg)]">
          {t('report.targetUser')} : <span className="font-bold text-navy">{reportedName}</span>
        </p>
      )}

      {formError && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {formError}
        </p>
      )}

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
          {REPORT_REASONS.map(key => (
            <option key={key} value={key}>{t(`report.reasons.${key}`)}</option>
          ))}
        </select>
        {errors.reason && <p id="report-reason-error" className={err} role="alert">{errors.reason}</p>}
      </div>

      <div className="mb-5">
        <label htmlFor="report-details" className={lbl}>
          {t('report.fields.details')}
          {reason !== 'OTHER' && (
            <span className="ml-1 font-normal text-[color:var(--muted-fg)]">({t('report.optional')})</span>
          )}
        </label>
        <textarea
          id="report-details"
          rows={5}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('report.fields.detailsPlaceholder')}
          aria-invalid={!!errors.description || undefined}
          aria-describedby={errors.description ? 'report-details-error' : undefined}
          className={`${inp} py-3 resize-y`}
        />
        {errors.description && <p id="report-details-error" className={err} role="alert">{errors.description}</p>}
      </div>

      <button
        type="submit"
        disabled={sending}
        className="w-full cursor-pointer rounded-full border-none bg-warm-strong py-3 text-sm font-bold text-white hover:bg-warm-dk transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? t('actions.sending') : t('report.submit')}
      </button>

      <p className="mt-4 rounded-2xl bg-cream p-4 text-xs leading-relaxed text-[color:var(--muted-fg)]">
        {t('report.emergency')}
      </p>
    </form>
  )
}
