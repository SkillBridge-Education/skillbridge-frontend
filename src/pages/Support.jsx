// src/pages/Support.jsx — Contacter l'assistance
//
// Le formulaire crée un vrai ticket via POST /support/tickets, sans exiger de
// compte : les personnes qui ont le plus besoin d'assistance sont justement
// celles qui ne peuvent pas entrer.
//
// Il proposait auparavant un email pré-rempli vers support@skillbridge.example
// — un domaine réservé par la RFC 2606, incapable de recevoir du courrier. Toute
// demande partait dans le vide, y compris celles des comptes suspendus que la
// page invite à passer par ici.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LifeBuoy } from 'lucide-react'
import useAuthStore from '../store/authStore'
import Footer from '../components/Footer'
import { supportApi, getApiError } from '../services/api'

const TOPICS = ['account', 'credits', 'sessions', 'bug', 'privacy', 'report', 'other']

// Le formulaire propose sept sujets, l'API en connaît quatre. On envoie la
// catégorie la plus proche pour le tri côté modération, et on garde le sujet
// exact en tête du message : réduire sept choix à quatre ne doit pas faire
// perdre l'information que la personne a pris le temps de préciser.
const TOPIC_TO_CATEGORY = {
  account:  'UNBLOCK_REQUEST',
  credits:  'CREDITS',
  sessions: 'OTHER',
  bug:      'BUG',
  privacy:  'OTHER',
  report:   'OTHER',
  other:    'OTHER',
}
const MIN_MESSAGE = 20
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Support() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const [topic,   setTopic]   = useState('')
  const [email,   setEmail]   = useState(user?.email ?? '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [errors,  setErrors]  = useState({})
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [sent,    setSent]    = useState(null)

  const inp = 'w-full rounded-xl border border-[color:var(--field-border)] bg-light-cream px-4 text-sm text-navy outline-none focus:border-warm transition-colors'
  const lbl = 'block text-sm font-bold text-navy mb-1'
  const errCls = 'mt-1 text-xs font-semibold text-red-600'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!topic)                              next.topic   = t('support.errors.topic')
    if (!EMAIL_RE.test(email.trim()))        next.email   = t('support.errors.email')
    if (!subject.trim())                     next.subject = t('support.errors.subject')
    if (message.trim().length < MIN_MESSAGE) next.message = t('support.errors.message')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSending(true)
    setSubmitError('')
    try {
      await supportApi.createTicket({
        subject: subject.trim(),
        // Le sujet choisi ouvre le corps du ticket, pour que le modérateur
        // voie « Confidentialité » et pas seulement « Autre ».
        body: `${t(`support.topics.${topic}`)} — ${message.trim()}`,
        category: TOPIC_TO_CATEGORY[topic] ?? 'OTHER',
        email: email.trim(),
      })
      setSent({ topic, email: email.trim(), subject: subject.trim(), message: message.trim() })
    } catch (err) {
      setSubmitError(getApiError(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-2xl px-6 py-12">

          <p className="text-xs font-bold uppercase tracking-widest text-warm-strong">{t('support.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">{t('support.title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">{t('support.subtitle')}</p>

          {sent ? (
            <div className="mt-8 rounded-3xl bg-[rgba(200,134,75,0.1)] p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-warm-strong text-white">
                  <LifeBuoy size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-navy">{t('support.sentTitle')}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">
                    {t('support.sentText', { email: sent.email })}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-navy break-words">
                  [{t(`support.topics.${sent.topic}`)}] {sent.subject}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--muted-fg)] break-words">
                  {sent.message}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-warm-strong px-5 py-3 text-sm font-bold text-white no-underline hover:bg-warm-dk transition-colors"
                >
                  {t('actions.backHome')}
                </Link>
                <button
                  type="button"
                  onClick={() => setSent(null)}
                  className="flex-1 cursor-pointer rounded-full bg-white px-5 py-3 text-sm font-bold text-navy shadow-sm hover:bg-navy hover:text-white transition-colors"
                >
                  {t('support.newRequest')}
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-8 rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-card sm:p-8"
            >
              <div className="mb-4">
                <label htmlFor="support-topic" className={lbl}>{t('support.fields.topic')}</label>
                <select
                  id="support-topic"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  aria-invalid={!!errors.topic || undefined}
                  aria-describedby={errors.topic ? 'support-topic-error' : undefined}
                  className={`${inp} h-11`}
                >
                  <option value="">{t('support.fields.topicPlaceholder')}</option>
                  {TOPICS.map(key => (
                    <option key={key} value={key}>{t(`support.topics.${key}`)}</option>
                  ))}
                </select>
                {errors.topic && <p id="support-topic-error" className={errCls} role="alert">{errors.topic}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="support-email" className={lbl}>{t('support.fields.email')}</label>
                <input
                  id="support-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('support.fields.emailPlaceholder')}
                  aria-invalid={!!errors.email || undefined}
                  aria-describedby={errors.email ? 'support-email-error' : 'support-email-hint'}
                  className={`${inp} h-11`}
                />
                {errors.email
                  ? <p id="support-email-error" className={errCls} role="alert">{errors.email}</p>
                  : <p id="support-email-hint" className="mt-1 text-xs text-[color:var(--muted-fg)]">{t('support.fields.emailHint')}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="support-subject" className={lbl}>{t('support.fields.subject')}</label>
                <input
                  id="support-subject"
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={t('support.fields.subjectPlaceholder')}
                  aria-invalid={!!errors.subject || undefined}
                  aria-describedby={errors.subject ? 'support-subject-error' : undefined}
                  className={`${inp} h-11`}
                />
                {errors.subject && <p id="support-subject-error" className={errCls} role="alert">{errors.subject}</p>}
              </div>

              <div className="mb-5">
                <label htmlFor="support-message" className={lbl}>{t('support.fields.message')}</label>
                <textarea
                  id="support-message"
                  rows={6}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t('support.fields.messagePlaceholder')}
                  aria-invalid={!!errors.message || undefined}
                  aria-describedby={errors.message ? 'support-message-error' : undefined}
                  className={`${inp} resize-y py-3`}
                />
                {errors.message && <p id="support-message-error" className={errCls} role="alert">{errors.message}</p>}
              </div>

              {submitError ? (
                <p role="alert" className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {submitError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={sending}
                className="w-full cursor-pointer rounded-full border-none bg-warm-strong py-3 text-sm font-bold text-white hover:bg-warm-dk transition-colors disabled:cursor-wait disabled:opacity-50"
              >
                {sending ? t('actions.sending') : t('support.submit')}
              </button>

              <p className="mt-4 text-center text-xs text-[color:var(--muted-fg)]">{t('support.responseTime')}</p>
            </form>
          )}

          {/* Urgence + renvoi vers l'aide */}
          <div className="mt-6 rounded-3xl border border-[color:var(--border)] bg-white p-6">
            <div className="flex items-start gap-3">
              <LifeBuoy size={16} className="mt-0.5 flex-shrink-0 text-sage" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-[color:var(--muted-fg)]">{t('support.emergency')}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/help"
                className="rounded-full border border-[color:var(--field-border)] bg-light-cream px-4 py-2 text-sm font-semibold text-navy no-underline hover:border-navy transition-colors"
              >
                {t('footer.helpCenter')}
              </Link>
              <Link
                to="/report"
                className="rounded-full border border-[color:var(--field-border)] bg-light-cream px-4 py-2 text-sm font-semibold text-navy no-underline hover:border-navy transition-colors"
              >
                {t('footer.report')}
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
