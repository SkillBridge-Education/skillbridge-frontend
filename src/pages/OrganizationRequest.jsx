// src/pages/OrganizationRequest.jsx
// Demande d'inscription d'un établissement — page PUBLIQUE : l'endpoint
// POST /organizations/requests ne demande pas d'authentification, puisque la
// personne qui remplit le formulaire n'a par définition pas encore de compte.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, School } from 'lucide-react'
import Footer from '../components/Footer'
import { organizationApi, getApiError } from '../services/api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function OrganizationRequest() {
  const { t } = useTranslation()

  const [name,         setName]         = useState('')
  const [contactName,  setContactName]  = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [emailDomain,  setEmailDomain]  = useState('')
  const [errors,       setErrors]       = useState({})
  const [formError,    setFormError]    = useState('')
  const [sending,      setSending]      = useState(false)
  const [sent,         setSent]         = useState(false)

  const inp = 'w-full h-11 rounded-xl border border-[color:var(--field-border)] bg-light-cream px-4 text-sm text-navy outline-none focus:border-warm transition-colors'
  const lbl = 'block text-sm font-bold text-navy mb-1'
  const err = 'mt-1 text-xs font-semibold text-red-600'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!name.trim())        next.name         = t('orgRequest.errors.name')
    if (!contactName.trim()) next.contactName  = t('orgRequest.errors.contactName')
    if (!EMAIL_RE.test(contactEmail.trim())) next.contactEmail = t('orgRequest.errors.contactEmail')
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return

    setSending(true)
    try {
      await organizationApi.requestAccess({
        name: name.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        ...(emailDomain.trim() ? { emailDomain: emailDomain.trim() } : {}),
      })
      setSent(true)
    } catch (e2) {
      setFormError(getApiError(e2) || t('orgRequest.errors.failed'))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-2xl px-6 py-12">

          <p className="text-xs font-bold uppercase tracking-widest text-warm-strong">{t('orgRequest.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">{t('orgRequest.title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">{t('orgRequest.subtitle')}</p>

          {sent ? (
            <section className="mt-8 rounded-3xl border-2 border-sage bg-[rgba(61,92,40,0.08)] p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-sage text-white">
                  <Check size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-navy">{t('orgRequest.sentTitle')}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">
                    {t('orgRequest.sentText')}
                  </p>
                  <p className="mt-3 inline-block rounded-full bg-cream px-3 py-1 text-xs font-bold uppercase tracking-wider text-[color:var(--muted-fg)]">
                    {t('orgRequest.pendingNotice')}
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-8 rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-card sm:p-8"
            >
              <div className="mb-5 flex items-start gap-3 rounded-2xl bg-cream p-4">
                <School size={16} className="mt-0.5 flex-shrink-0 text-sage" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-[color:var(--muted-fg)]">{t('orgRequest.intro')}</p>
              </div>

              {formError && (
                <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {formError}
                </p>
              )}

              <div className="mb-4">
                <label htmlFor="org-name" className={lbl}>{t('orgRequest.fields.name')}</label>
                <input
                  id="org-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('orgRequest.fields.namePlaceholder')}
                  aria-invalid={!!errors.name || undefined}
                  aria-describedby={errors.name ? 'org-name-error' : undefined}
                  className={inp}
                />
                {errors.name && <p id="org-name-error" className={err} role="alert">{errors.name}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="org-contact-name" className={lbl}>{t('orgRequest.fields.contactName')}</label>
                <input
                  id="org-contact-name"
                  type="text"
                  autoComplete="name"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder={t('orgRequest.fields.contactNamePlaceholder')}
                  aria-invalid={!!errors.contactName || undefined}
                  aria-describedby={errors.contactName ? 'org-contact-name-error' : undefined}
                  className={inp}
                />
                {errors.contactName && <p id="org-contact-name-error" className={err} role="alert">{errors.contactName}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="org-contact-email" className={lbl}>{t('orgRequest.fields.contactEmail')}</label>
                <input
                  id="org-contact-email"
                  type="email"
                  autoComplete="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder={t('orgRequest.fields.contactEmailPlaceholder')}
                  aria-invalid={!!errors.contactEmail || undefined}
                  aria-describedby={errors.contactEmail ? 'org-contact-email-error' : undefined}
                  className={inp}
                />
                {errors.contactEmail && <p id="org-contact-email-error" className={err} role="alert">{errors.contactEmail}</p>}
              </div>

              <div className="mb-5">
                <label htmlFor="org-domain" className={lbl}>
                  {t('orgRequest.fields.emailDomain')}
                  <span className="ml-1 font-normal text-[color:var(--muted-fg)]">({t('report.optional')})</span>
                </label>
                <input
                  id="org-domain"
                  type="text"
                  value={emailDomain}
                  onChange={e => setEmailDomain(e.target.value)}
                  placeholder={t('orgRequest.fields.emailDomainPlaceholder')}
                  aria-describedby="org-domain-hint"
                  className={inp}
                />
                <p id="org-domain-hint" className="mt-1 text-xs text-[color:var(--muted-fg)]">
                  {t('orgRequest.fields.emailDomainHint')}
                </p>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full cursor-pointer rounded-full border-none bg-warm-strong py-3 text-sm font-bold text-white hover:bg-warm-dk transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? t('actions.sending') : t('orgRequest.submit')}
              </button>
            </form>
          )}

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
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
