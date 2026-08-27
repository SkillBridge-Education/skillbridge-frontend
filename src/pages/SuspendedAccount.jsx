// src/pages/SuspendedAccount.jsx
// Écran affiché quand le backend répond 403 avec un chemin de recours.
//
// Le règlement européen sur les services numériques (DSA) impose qu'une
// restriction de compte soit MOTIVÉE et puisse être CONTESTÉE : on affiche donc
// le motif retenu et un formulaire de recours (POST /appeals), plutôt qu'un
// simple « accès refusé ».
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Check, LogOut } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { appealApi, getApiError } from '../services/api'

const MIN_MESSAGE = 20
const MAX_MESSAGE = 2000

export default function SuspendedAccount() {
  const { t } = useTranslation()
  const { suspension, logout } = useAuthStore()

  const [message, setMessage] = useState('')
  const [error,   setError]   = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const value = message.trim()
    if (value.length < MIN_MESSAGE) { setError(t('suspension.errors.tooShort')); return }
    if (value.length > MAX_MESSAGE) { setError(t('suspension.errors.tooLong')); return }

    setError('')
    setSending(true)
    try {
      await appealApi.create(value, suspension?.appealPath || '/appeals')
      setSent(true)
    } catch (e2) {
      const status = e2?.response?.status
      if (status === 409)      setError(t('suspension.errors.alreadyPending'))
      else if (status === 400) setError(getApiError(e2) || t('suspension.errors.notSuspended'))
      else                     setError(t('suspension.errors.failed'))
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-12">

        <p className="text-xs font-bold uppercase tracking-widest text-warm-strong">{t('suspension.eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">
          {t('suspension.title')}
        </h1>

        {/* Motivation de la sanction */}
        <section className="mt-6 rounded-3xl border-2 border-warm-strong bg-[rgba(200,134,75,0.1)] p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-warm-strong text-white">
              <AlertTriangle size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
                {t('suspension.reasonLabel')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-navy">
                {suspension?.reason || suspension?.message || t('suspension.noReason')}
              </p>
              {suspension?.reason && suspension?.message && suspension.message !== suspension.reason && (
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">
                  {suspension.message}
                </p>
              )}
            </div>
          </div>
        </section>

        <p className="mt-6 text-sm leading-relaxed text-[color:var(--muted-fg)]">
          {t('suspension.rights')}
        </p>

        {/* Recours */}
        {sent ? (
          <section className="mt-6 rounded-3xl border-2 border-sage bg-[rgba(61,92,40,0.08)] p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-sage text-white">
                <Check size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-navy">{t('suspension.sentTitle')}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-fg)]">
                  {t('suspension.sentText')}
                </p>
              </div>
            </div>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-6 rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-card sm:p-8"
          >
            <h2 className="text-lg font-bold text-navy">{t('suspension.appealTitle')}</h2>

            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </p>
            )}

            <div className="mt-5">
              <label htmlFor="appeal-message" className="block text-sm font-bold text-navy mb-1">
                {t('suspension.appealLabel')}
              </label>
              <textarea
                id="appeal-message"
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('suspension.appealPlaceholder')}
                maxLength={MAX_MESSAGE}
                aria-invalid={!!error || undefined}
                aria-describedby="appeal-hint"
                className="w-full resize-y rounded-xl border border-[color:var(--field-border)] bg-light-cream px-4 py-3 text-sm text-navy outline-none focus:border-warm transition-colors"
              />
              <p id="appeal-hint" className="mt-1 text-xs text-[color:var(--muted-fg)]">
                {t('suspension.appealHint')} · {message.trim().length}/{MAX_MESSAGE}
              </p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="mt-5 w-full cursor-pointer rounded-full border-none bg-warm-strong py-3 text-sm font-bold text-white hover:bg-warm-dk transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? t('actions.sending') : t('suspension.submit')}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={logout}
          className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[color:var(--border)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[color:var(--muted-fg)] hover:border-navy hover:text-navy transition-colors"
        >
          <LogOut size={14} aria-hidden="true" />
          {t('suspension.logout')}
        </button>

      </div>
    </main>
  )
}
