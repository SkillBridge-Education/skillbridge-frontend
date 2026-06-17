import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { authApi, getApiError } from '../services/api'

export default function AuthModal() {
  const { modalOpen, modalMode, closeModal, switchMode, login } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const loginEmailRef    = useRef()
  const loginPasswordRef = useRef()
  const regFirstRef      = useRef()
  const regLastRef       = useRef()
  const regEmailRef      = useRef()
  const regPasswordRef   = useRef()

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeModal])

  useEffect(() => { setError('') }, [modalMode])

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
        setError(`Ton email n'est pas encore vérifié. Vérifie ta boîte mail ou renvoie le lien depuis /verify-email.`)
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

  const inp = "w-full h-11 rounded-xl border border-[#E8DDC7] bg-[#FDFAF4] px-4 text-sm text-[#1A1410] outline-none focus:border-[#C8864B] transition-colors"
  const lbl = "block text-sm font-bold text-[#252840] mb-1"

  return (
    <div
      className="fixed inset-0 z-[500] bg-[rgba(26,20,16,0.6)] backdrop-blur-sm flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#E8DDC7] bg-white p-8 shadow-soft relative">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F8F4EA] border-none cursor-pointer text-[#756B5B] flex items-center justify-center hover:bg-[#E8DDC7] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
        </button>

        <div className="flex justify-center mb-5">
          <img src="/skillbridge-logo.webp" alt="SkillBridge" className="h-8 w-auto" />
        </div>

        {modalMode === 'login' && (
          <form onSubmit={handleLogin}>
            <h2 className="text-2xl font-black tracking-tight text-[#252840] mb-1">Bienvenue !</h2>
            <p className="text-sm text-[#756B5B] mb-6">Connectez-vous pour continuer vos échanges</p>

            {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="mb-3">
              <label className={lbl}>Email</label>
              <input ref={loginEmailRef} type="email" placeholder="vous@exemple.com" required className={inp} />
            </div>

            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <label className={lbl}>Mot de passe</label>
              </div>
              <input ref={loginPasswordRef} type="password" placeholder="••••••••" required className={inp} />
              <button
                type="button"
                onClick={() => { closeModal(); navigate('/forgot-password') }}
                className="text-xs text-[#756B5B] hover:text-[#252840] bg-transparent border-none cursor-pointer transition-colors mt-1"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl border-none bg-[#C8864B] text-white text-sm font-bold cursor-pointer hover:bg-[#B07030] transition-colors disabled:opacity-50 mt-4">
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>

            <p className="text-center text-sm text-[#756B5B] mt-4">
              Pas encore de compte ?{' '}
              <button type="button" onClick={() => switchMode('register')}
                className="text-[#252840] font-bold bg-transparent border-none cursor-pointer hover:text-[#C8864B] transition-colors">
                S'inscrire
              </button>
            </p>
          </form>
        )}

        {modalMode === 'register' && (
          <form onSubmit={handleRegister}>
            <h2 className="text-2xl font-black tracking-tight text-[#252840] mb-1">Rejoindre SkillBridge</h2>
            <p className="text-sm text-[#756B5B] mb-6">Créez votre compte et commencez à échanger</p>

            {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className={lbl}>Prénom</label>
                <input ref={regFirstRef} type="text" placeholder="Alice" required className={inp} />
              </div>
              <div className="flex-1">
                <label className={lbl}>Nom</label>
                <input ref={regLastRef} type="text" placeholder="Martin" required className={inp} />
              </div>
            </div>

            <div className="mb-3">
              <label className={lbl}>Email</label>
              <input ref={regEmailRef} type="email" placeholder="vous@exemple.com" required className={inp} />
            </div>

            <div className="mb-4">
              <label className={lbl}>Mot de passe (min. 8 caractères)</label>
              <input ref={regPasswordRef} type="password" placeholder="••••••••" required minLength={8} className={inp} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl border-none bg-[#C8864B] text-white text-sm font-bold cursor-pointer hover:bg-[#B07030] transition-colors disabled:opacity-50">
              {loading ? 'Création du compte…' : 'Créer mon compte'}
            </button>

            <p className="text-center text-sm text-[#756B5B] mt-4">
              Déjà un compte ?{' '}
              <button type="button" onClick={() => switchMode('login')}
                className="text-[#252840] font-bold bg-transparent border-none cursor-pointer hover:text-[#C8864B] transition-colors">
                Se connecter
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
