import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const RESEND_DELAY = 60

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 no-underline">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#C8864B] text-white flex-shrink-0">
        <span className="text-sm font-black leading-none">S</span>
      </span>
      <span className="text-xl font-black tracking-tight">
        <span className="text-[#252840]">Skill</span>
        <span className="text-[#C8864B]">Bridge</span>
      </span>
    </Link>
  )
}

export default function ForgotPassword() {
  const navigate  = useNavigate()
  const [email,    setEmail]    = useState('')
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading || countdown > 0) return
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
      startCountdown()
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFAF4] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-3xl border border-[#E8DDC7] bg-white p-8 shadow-soft">
          {sent ? (
            <div className="animate-fade-up text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[rgba(61,92,40,0.15)] text-[#3D5C28] mb-5">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="6" width="28" height="20" rx="3"/>
                  <path d="M2 11l14 9 14-9"/>
                </svg>
              </span>
              <h1 className="text-2xl font-black tracking-tight text-[#252840]">Email envoyé</h1>
              <p className="mt-2 text-sm text-[#756B5B] leading-relaxed">
                Si un compte existe pour{' '}
                <span className="font-semibold text-[#252840]">{email}</span>,
                tu recevras un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="mt-2 text-sm text-[#B0A898]">
                Pense à vérifier ton dossier spam si tu ne vois rien.
              </p>

              <button
                onClick={handleSubmit}
                disabled={loading || countdown > 0}
                className="mt-5 w-full py-2.5 rounded-full border border-[#E8DDC7] text-sm font-semibold text-[#756B5B] bg-transparent cursor-pointer hover:border-[#252840] hover:text-[#252840] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Envoi…'
                  : countdown > 0
                    ? `Renvoyer dans 0:${String(countdown).padStart(2, '0')}`
                    : 'Renvoyer le lien'}
              </button>

              <Link
                to="/"
                className="mt-4 flex w-full items-center justify-center rounded-full bg-[#252840] px-4 py-3 text-sm font-bold text-white no-underline hover:bg-[#363B6B] transition-colors"
              >
                Retour à l'accueil
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black tracking-tight text-[#252840]">
                Réinitialise ton mot de passe
              </h1>
              <p className="mt-2 text-sm text-[#756B5B] mb-6">
                Entre ton adresse email et nous t'enverrons un lien de réinitialisation.
              </p>

              {error && (
                <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#252840] mb-1">Email</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A898]" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <rect x="2" y="4" width="14" height="11" rx="2"/>
                      <path d="M2 8l7 5 7-5"/>
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="toi@exemple.com"
                      required
                      className="w-full h-11 rounded-xl border border-[#E8DDC7] bg-[#FDFAF4] pl-10 pr-4 text-sm outline-none focus:border-[#C8864B] transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-[#C8864B] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#B07030] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Envoi…' : 'Envoyer le lien'}
                </button>
              </form>

              <button
                onClick={() => navigate('/')}
                className="mt-5 flex w-full items-center justify-center gap-1 text-sm font-semibold text-[#756B5B] bg-transparent border-none cursor-pointer hover:text-[#252840] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M9 2L4 7l5 5"/>
                </svg>
                Retour à la connexion
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
