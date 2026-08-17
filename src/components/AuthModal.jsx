import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import useFocusTrap from '../hooks/useFocusTrap'
import { authApi, getApiError } from '../services/api'

const ERROR_ID = 'auth-modal-error'
const TITLE_ID = 'auth-modal-title'

export default function AuthModal() {
  const { modalOpen, modalMode, closeModal, switchMode, login } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const loginEmailRef    = useRef()
  const loginPasswordRef = useRef()
  const regFirstRef      = useRef()
  const regLastRef       = useRef()
  const regEmailRef      = useRef()
  const regPasswordRef   = useRef()

  // Piège le focus, ferme sur Échap et rend le focus au déclencheur.
  const dialogRef = useFocusTrap(modalOpen, closeModal)

  useEffect(() => { setError('') }, [modalMode])

  // Le message d'erreur décrit le champ fautif : on le rattache aux champs.
  const describedBy = error ? ERROR_ID : undefined

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login({
        email:    loginEmailRef.current.value.trim(),
        password: loginPasswordRef.current.value,
      })
      login(data.user, data.token)
      closeModal()
    } catch (err) {
      const msg = getApiError(err)
      const status = err?.response?.status
      if (status === 403 && msg.toLowerCase().includes('verif')) {
        setError(t('auth.login.unverified'))
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.register({
        firstName: regFirstRef.current.value.trim(),
        lastName:  regLastRef.current.value.trim(),
        email:     regEmailRef.current.value.trim(),
        password:  regPasswordRef.current.value,
      })
      login(data.user, data.token)
      closeModal()
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (!modalOpen) return null

  const inp = "w-full h-11 rounded-xl border border-[color:var(--field-border)] bg-[#FDFAF4] px-4 text-sm text-[#1A1410] outline-none focus:border-[#C8864B] transition-colors"
  const lbl = "block text-sm font-bold text-[#252840] mb-1"

  return (
    <div
      className="fixed inset-0 z-[500] bg-[rgba(26,20,16,0.6)] backdrop-blur-sm flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="w-full max-w-md rounded-3xl border border-[#E8DDC7] bg-white p-8 shadow-soft relative"
      >
        <button
          onClick={closeModal}
          aria-label={t('actions.close')}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F8F4EA] border-none cursor-pointer text-[#756B5B] flex items-center justify-center hover:bg-[#E8DDC7] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
        </button>

        <div className="flex justify-center mb-5">
          <img src="/skillbridge-logo.webp" alt="SkillBridge" className="h-8 w-auto" />
        </div>

        {modalMode === 'login' && (
          <form onSubmit={handleLogin}>
            <h2 id="auth-modal-title" className="text-2xl font-black tracking-tight text-[#252840] mb-1">{t('auth.login.title')}</h2>
            <p className="text-sm text-[#756B5B] mb-6">{t('auth.login.subtitle')}</p>

            {error && (
              <p id="auth-modal-error" role="alert" className="text-red-600 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="mb-3">
              <label htmlFor="login-email" className={lbl}>{t('auth.fields.email')}</label>
              <input id="login-email" ref={loginEmailRef} type="email" autoComplete="email"
                placeholder={t('auth.fields.emailPlaceholder')} required className={inp}
                aria-invalid={!!error} aria-describedby={describedBy} />
            </div>

            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="login-password" className={lbl}>{t('auth.fields.password')}</label>
              </div>
              <input id="login-password" ref={loginPasswordRef} type="password" autoComplete="current-password"
                placeholder={t('auth.fields.passwordPlaceholder')} required className={inp}
                aria-invalid={!!error} aria-describedby={describedBy} />
              <button
                type="button"
                onClick={() => { closeModal(); navigate('/forgot-password') }}
                className="text-xs text-[#756B5B] hover:text-[#252840] bg-transparent border-none cursor-pointer transition-colors mt-1"
              >
                {t('auth.login.forgot')}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl border-none bg-warm-strong text-white text-sm font-bold cursor-pointer hover:bg-warm-dk transition-colors disabled:opacity-50 mt-4">
              {loading ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>

            <p className="text-center text-sm text-[#756B5B] mt-4">
              {t('auth.login.noAccount')}{' '}
              <button type="button" onClick={() => switchMode('register')}
                className="text-[#252840] font-bold bg-transparent border-none cursor-pointer hover:text-[color:var(--warm-strong)] transition-colors">
                {t('nav.register')}
              </button>
            </p>
          </form>
        )}

        {modalMode === 'register' && (
          <form onSubmit={handleRegister}>
            <h2 id="auth-modal-title" className="text-2xl font-black tracking-tight text-[#252840] mb-1">{t('auth.register.title')}</h2>
            <p className="text-sm text-[#756B5B] mb-6">{t('auth.register.subtitle')}</p>

            {error && (
              <p id="auth-modal-error" role="alert" className="text-red-600 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label htmlFor="register-first-name" className={lbl}>{t('auth.fields.firstName')}</label>
                <input id="register-first-name" ref={regFirstRef} type="text" autoComplete="given-name"
                  placeholder={t('auth.fields.firstNamePlaceholder')} required className={inp} />
              </div>
              <div className="flex-1">
                <label htmlFor="register-last-name" className={lbl}>{t('auth.fields.lastName')}</label>
                <input id="register-last-name" ref={regLastRef} type="text" autoComplete="family-name"
                  placeholder={t('auth.fields.lastNamePlaceholder')} required className={inp} />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="register-email" className={lbl}>{t('auth.fields.email')}</label>
              <input id="register-email" ref={regEmailRef} type="email" autoComplete="email"
                placeholder={t('auth.fields.emailPlaceholder')} required className={inp}
                aria-invalid={!!error} aria-describedby={describedBy} />
            </div>

            <div className="mb-4">
              <label htmlFor="register-password" className={lbl}>{t('auth.fields.passwordWithMin')}</label>
              <input id="register-password" ref={regPasswordRef} type="password" autoComplete="new-password"
                placeholder={t('auth.fields.passwordPlaceholder')} required minLength={8} className={inp}
                aria-invalid={!!error} aria-describedby={describedBy} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl border-none bg-warm-strong text-white text-sm font-bold cursor-pointer hover:bg-warm-dk transition-colors disabled:opacity-50">
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
            </button>

            <p className="text-center text-sm text-[#756B5B] mt-4">
              {t('auth.register.hasAccount')}{' '}
              <button type="button" onClick={() => switchMode('login')}
                className="text-[#252840] font-bold bg-transparent border-none cursor-pointer hover:text-[color:var(--warm-strong)] transition-colors">
                {t('auth.register.switch')}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
