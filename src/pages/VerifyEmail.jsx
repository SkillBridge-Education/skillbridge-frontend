import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '../services/api'

const RESEND_DELAY = 60

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 no-underline">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-warm-strong text-white flex-shrink-0">
        <span className="text-sm font-black leading-none">S</span>
      </span>
      <span className="text-xl font-black tracking-tight">
        <span className="text-[#252840]">Skill</span>
        <span className="text-[color:var(--warm-strong)]">Bridge</span>
      </span>
    </Link>
  )
}

export default function VerifyEmail() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const { t }     = useTranslation()
  const token     = params.get('token')

  const [phase,     setPhase]     = useState('loading')
  const [email,     setEmail]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [resent,    setResent]    = useState(false)
  const [resendErr, setResendErr] = useState('')
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!token) { setPhase('error'); return }
    authApi.verifyEmail(token)
      .then(() => setPhase('success'))
      .catch(() => setPhase('error'))
  }, [token])

  const startCountdown = () => {
    setCountdown(RESEND_DELAY)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const handleResend = async (e) => {
    e.preventDefault()
    if (!email.trim() || sending || countdown > 0) return
    setSending(true); setResendErr('')
    try {
      await authApi.resendVerification(email.trim().toLowerCase())
      setResent(true)
      startCountdown()
    } catch (err) {
      setResendErr(err.response?.data?.message || t('verifyEmail.resendError'))
    } finally { setSending(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFAF4] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-3xl border border-[#E8DDC7] bg-white p-8 shadow-soft">

          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-8 h-8 border-2 border-[#252840]/20 border-t-[#252840] rounded-full animate-spin" />
              <p className="text-sm text-[#756B5B]">{t('verifyEmail.checking')}</p>
            </div>
          )}

          {phase === 'success' && (
            <div className="text-center animate-fade-up">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[rgba(61,92,40,0.15)] text-[#3D5C28] mb-5">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 14l7 7L24 7"/>
                </svg>
              </span>
              <h1 className="text-2xl font-black tracking-tight text-[#252840]">{t('verifyEmail.successTitle')}</h1>
              <p className="mt-2 text-sm text-[#756B5B] mb-6">
                {t('verifyEmail.successText')}
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-full bg-warm-strong text-white text-sm font-bold border-none cursor-pointer hover:bg-warm-dk transition-colors"
              >
                {t('nav.login')}
              </button>
            </div>
          )}

          {phase === 'error' && (
            <div className="animate-fade-up">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-400 mb-5 mx-auto block">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="14" cy="14" r="12"/>
                  <path d="M14 9v5M14 18h.01"/>
                </svg>
              </span>
              <h1 className="text-2xl font-black tracking-tight text-[#252840] text-center">{t('verifyEmail.errorTitle')}</h1>
              <p className="mt-2 text-sm text-[#756B5B] mb-6 text-center">
                {t('verifyEmail.errorText')}
              </p>

              {resent && (
                <div className="flex items-center gap-2 bg-[#3D5C28]/10 px-4 py-3 rounded-xl mb-3">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#3D5C28" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3 3 7-6"/></svg>
                  <p className="text-sm font-semibold text-[#3D5C28]">{t('verifyEmail.resent')}</p>
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-3">
                {resendErr && (
                  <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{resendErr}</p>
                )}
                <div>
                  <label htmlFor="verify-email" className="block text-sm font-bold text-[#252840] mb-1">
                    {t('verifyEmail.emailLabel')}
                  </label>
                  <input
                    id="verify-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('forgotPassword.emailPlaceholder')}
                    required
                    className="w-full h-11 rounded-xl border border-[#E8DDC7] bg-[#FDFAF4] px-4 text-sm outline-none focus:border-[#C8864B] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || countdown > 0}
                  className="w-full py-3 rounded-full bg-[#252840] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending
                    ? t('actions.sending')
                    : countdown > 0
                      ? t('auth.resendIn', { seconds: String(countdown).padStart(2, '0') })
                      : t('verifyEmail.resend')}
                </button>
              </form>

              <p className="mt-3 text-xs text-center text-[color:var(--muted-fg)]">
                {t('auth.spamHint')}
              </p>

              <button
                onClick={() => navigate('/')}
                className="mt-4 flex w-full items-center justify-center gap-1 text-sm font-semibold text-[#756B5B] bg-transparent border-none cursor-pointer hover:text-[#252840] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>
                {t('actions.backHome')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
