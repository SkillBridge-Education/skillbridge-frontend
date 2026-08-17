import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import api, { authApi } from '../services/api'

const RESEND_DELAY = 60

function ResendVerification({ email }) {
  const { t } = useTranslation()
  const [sent,      setSent]      = useState(false)
  const [err,       setErr]       = useState('')
  const [busy,      setBusy]      = useState(false)
  const [countdown, setCountdown] = useState(RESEND_DELAY)
  const timerRef = useRef(null)

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

  useEffect(() => {
    startCountdown()
    return () => clearInterval(timerRef.current)
  }, [])

  const send = async () => {
    if (!email || countdown > 0 || busy) return
    setBusy(true); setErr('')
    try {
      await authApi.resendVerification(email)
      setSent(true)
      startCountdown()
    } catch (e) {
      setErr(e.response?.data?.message || t('register.verify.resendError'))
    } finally { setBusy(false) }
  }

  return (
    <div className="mt-5">
      {err && <p className="text-xs text-red-500 mb-2">{err}</p>}
      {sent && (
        <p className="text-sm font-semibold text-[#3D5C28] mb-2">{t('register.verify.resent')}</p>
      )}
      <button
        onClick={send}
        disabled={countdown > 0 || busy}
        className="text-sm font-semibold text-[#756B5B] bg-transparent border-none cursor-pointer hover:text-[#252840] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy
          ? t('actions.sending')
          : countdown > 0
            ? t('auth.resendIn', { seconds: String(countdown).padStart(2, '0') })
            : t('register.verify.resend')}
      </button>
    </div>
  )
}

const CLOUD_NAME    = 'derho2rib'
const UPLOAD_PRESET = 'skillbridge_avatars'
const AVATAR_KEY    = 'sb_avatar'

const ALL_SKILLS = [
  'Mathematics','English','French','Spanish','Japanese','Chinese','Arabic','Portuguese',
  'Guitar','Piano','Drums','Singing','Drawing','Painting','Photography','Illustration',
  'Python','JavaScript','TypeScript','React','Node.js','Design','Figma','Video editing',
  'Cooking','Yoga','Chess','Writing','Philosophy','Physics','Chemistry','Biology',
  'Music Theory','Violin','Business','Marketing','Finance','Statistics','Data Analysis',
]

// `key` est la valeur PERSISTÉE (côté API et localStorage) : elle ne doit jamais
// être traduite. Seul l'affichage passe par i18n.
const DAYS = [
  { key: 'Lundi',    labelKey: 'days.mon', shortKey: 'daysShort.mon' },
  { key: 'Mardi',    labelKey: 'days.tue', shortKey: 'daysShort.tue' },
  { key: 'Mercredi', labelKey: 'days.wed', shortKey: 'daysShort.wed' },
  { key: 'Jeudi',    labelKey: 'days.thu', shortKey: 'daysShort.thu' },
  { key: 'Vendredi', labelKey: 'days.fri', shortKey: 'daysShort.fri' },
]
const SLOTS = [
  { key: 'Matin', labelKey: 'slots.morning' },
  { key: 'Midi',  labelKey: 'slots.noon'    },
  { key: 'Soir',  labelKey: 'slots.evening' },
]

const STEP_META = ['account', 'skills', 'availability']

export default function Register() {
  const navigate   = useNavigate()
  const { t }      = useTranslation()
  const { login }  = useAuthStore()
  const fileRef    = useRef()

  const [step,      setStep]      = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [avatar,    setAvatar]    = useState('')
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', bio: '',
    teaches: [], wants: [],
  })

  const [avail,         setAvail]         = useState({})
  const [skillToggle,   setSkillToggle]   = useState('teaches')
  const [skillSearch,   setSkillSearch]   = useState('')
  const [customSkill,   setCustomSkill]   = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const toggleSkill = (skill) => {
    const arr = form[skillToggle]
    set(skillToggle, arr.includes(skill) ? arr.filter(s => s !== skill) : [...arr, skill])
  }

  const addCustomSkill = () => {
    const s = customSkill.trim()
    if (!s) return
    if (!form[skillToggle].includes(s)) set(skillToggle, [...form[skillToggle], s])
    setCustomSkill('')
  }

  const toggleAvail = (day, slot) =>
    setAvail(prev => ({ ...prev, [`${day}_${slot}`]: !prev[`${day}_${slot}`] }))

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', UPLOAD_PRESET)
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.secure_url) { localStorage.setItem(AVATAR_KEY, data.secure_url); setAvatar(data.secure_url) }
    } catch (e) { console.error(e) }
    finally { setUploading(false) }
  }

  const handleStep0 = () => {
    if (!form.firstName.trim()) { setError(t('register.errors.firstName')); return }
    if (!form.lastName.trim())  { setError(t('register.errors.lastName')); return }
    if (!form.email.trim())     { setError(t('register.errors.email')); return }
    if (form.password.length < 8) { setError(t('register.errors.password')); return }
    setError(''); setStep(1)
  }

  const handleStep1 = async () => {
    if (form.teaches.length === 0 && form.wants.length === 0) {
      setError(t('register.errors.bothSkills'))
      return
    }
    if (form.teaches.length === 0) { setSkillToggle('teaches'); setError(t('register.errors.teaches')); return }
    if (form.wants.length   === 0) { setSkillToggle('wants');   setError(t('register.errors.wants')); return }
    setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim().toLowerCase(),
        password:  form.password,
        bio:       form.bio.trim() || undefined,
      })
      const { user, token } = res.data

      // If the backend returned a token, auto-login. Otherwise show email verification screen.
      if (token) {
        login(user, token)
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        const base    = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        await Promise.allSettled([
          ...form.teaches.map(skill => fetch(`${base}/users/skills`, { method: 'POST', headers, body: JSON.stringify({ name: skill, category: 'General' }) }).catch(() => {})),
          ...form.wants.map(skill   => fetch(`${base}/users/learning-goals`, { method: 'POST', headers, body: JSON.stringify({ name: skill, category: 'General' }) }).catch(() => {})),
        ])
        setStep(2)
      } else {
        setStep('verify-email')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('register.errors.failed'))
    } finally { setLoading(false) }
  }

  const handleStep2 = async () => {
    const json = JSON.stringify(avail)
    await api.put('/users/me', { availability: json }).catch(() => {})
    setStep(3)
  }

  const initials = `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`.toUpperCase() || '?'

  const filteredSkills = ALL_SKILLS.filter(s =>
    s.toLowerCase().includes(skillSearch.toLowerCase())
  )

  if (step === 'verify-email') {
    return (
      <div className="min-h-screen bg-[#F8F4EA] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-fade-up">
          <div className="rounded-3xl border border-[#E8DDC7] bg-white p-10 shadow-soft text-center">
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-[rgba(61,92,40,0.12)] text-[#3D5C28]">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="8" width="30" height="22" rx="3"/><path d="M3 15l15 9 15-9"/>
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#252840]">{t('register.verify.title')}</h1>
            <p className="mt-3 text-sm text-[#756B5B] leading-relaxed">
              <Trans
                i18nKey="register.verify.text"
                values={{ email: form.email }}
                components={{ strong: <strong className="text-[#252840]" /> }}
              />
            </p>
            <p className="mt-2 text-sm text-[#B0A898]">
              {t('auth.spamHint')}
            </p>
            <ResendVerification email={form.email} />
          </div>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#F8F4EA] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center animate-fade-up">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-[rgba(61,92,40,0.15)] text-[#3D5C28]">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 19l7 7L30 10"/>
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#252840]">{t('register.done.title')}</h1>
          <p className="mt-3 text-[#756B5B]">{t('register.done.subtitle')}</p>
          <div className="mt-6 rounded-3xl bg-[#252840] p-6 text-center">
            <p className="text-sm text-[#F8F4EA]/70 mb-1">{t('register.done.welcomeCredits')}</p>
            <p className="text-5xl font-black text-[#C8864B]">120</p>
            <p className="text-sm font-semibold text-[#F8F4EA]/60 mt-1">{t('register.done.creditsHint')}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button onClick={() => navigate('/connection')}
              className="w-full py-3 rounded-full bg-[#C8864B] text-white font-bold border-none cursor-pointer hover:bg-[#B07030] transition-colors">
              {t('register.done.explore')}
            </button>
            <button onClick={() => navigate('/profile')}
              className="w-full py-3 rounded-full bg-transparent text-[#756B5B] font-semibold border-none cursor-pointer hover:text-[#252840] transition-colors">
              {t('register.done.completeProfile')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex flex-col w-80 flex-shrink-0 bg-gradient-to-br from-[#252840] via-[#2D3158] to-[#363B6B] p-10">
        <div className="mb-12">
          <img src="/skillbridge-logo-dark.webp" alt="SkillBridge" className="h-10 w-auto" />
        </div>

        <h2 className="text-2xl font-black text-white mb-2">{t('register.aside.title')}</h2>
        <p className="text-white/50 text-sm mb-12">{t('register.aside.subtitle')}</p>

        <div className="flex flex-col gap-6">
          {STEP_META.map((stepKey, i) => (
            <div key={stepKey} className="flex items-start gap-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 transition-all ${
                i < step ? 'bg-[rgba(61,92,40,0.9)] text-white' :
                i === step ? 'bg-[#C8864B] text-white' :
                'bg-white/10 text-white/40'
              }`}>
                {i < step
                  ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7l4 4 6-6"/></svg>
                  : i + 1}
              </div>
              <div className={`pt-1 ${i === step ? 'opacity-100' : 'opacity-50'}`}>
                <p className={`text-sm font-bold ${i === step ? 'text-white' : 'text-white/60'}`}>
                  {t(`register.steps.${stepKey}.label`)}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{t(`register.steps.${stepKey}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 bg-[#FDFAF4] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <img src="/skillbridge-logo.webp" alt="SkillBridge" className="h-8 w-auto" />
            </div>
          </div>

          {/* Mobile progress */}
          <div className="flex items-center gap-1.5 mb-8 lg:hidden">
            {STEP_META.map((stepKey, i) => (
              <div key={stepKey} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-[#C8864B]' : 'bg-[#E8DDC7]'}`} />
            ))}
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm font-semibold">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 5v3M8 11h.01"/></svg>
              {error}
            </div>
          )}

          {/* STEP 0 — Compte */}
          {step === 0 && (
            <div className="rounded-3xl border border-[#E8DDC7] bg-white p-8 shadow-soft">
              <h2 className="text-2xl font-black tracking-tight text-[#252840]">{t('register.account.title')}</h2>
              <p className="mt-1 text-sm text-[#756B5B] mb-6">{t('register.account.subtitle')}</p>

              {/* Avatar cliquable */}
              <div className="flex justify-center mb-6">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label={t('register.account.addPhoto')}
                  className="relative h-24 w-24 rounded-full border-2 border-dashed border-[#E8DDC7] overflow-hidden cursor-pointer bg-[#F8F4EA] hover:border-[#C8864B] transition-colors flex items-center justify-center"
                >
                  {avatar ? (
                    <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#B0A898]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <span className="text-xs font-semibold">{t('register.account.photo')}</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold text-[#252840] uppercase tracking-wide mb-1">{t('auth.fields.firstName')}</label>
                  <input
                    className="w-full h-11 rounded-xl border border-[#E8DDC7] bg-[#FDFAF4] px-4 text-sm outline-none focus:border-[#C8864B] transition-colors"
                    placeholder={t('auth.fields.firstNamePlaceholder')}
                    value={form.firstName}
                    onChange={e => set('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#252840] uppercase tracking-wide mb-1">{t('auth.fields.lastName')}</label>
                  <input
                    className="w-full h-11 rounded-xl border border-[#E8DDC7] bg-[#FDFAF4] px-4 text-sm outline-none focus:border-[#C8864B] transition-colors"
                    placeholder={t('auth.fields.lastNamePlaceholder')}
                    value={form.lastName}
                    onChange={e => set('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-bold text-[#252840] uppercase tracking-wide mb-1">{t('auth.fields.email')}</label>
                <input
                  type="email"
                  className="w-full h-11 rounded-xl border border-[#E8DDC7] bg-[#FDFAF4] px-4 text-sm outline-none focus:border-[#C8864B] transition-colors"
                  placeholder={t('register.account.emailPlaceholder')}
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-bold text-[#252840] uppercase tracking-wide mb-1">{t('auth.fields.password')}</label>
                <input
                  type="password"
                  className="w-full h-11 rounded-xl border border-[#E8DDC7] bg-[#FDFAF4] px-4 text-sm outline-none focus:border-[#C8864B] transition-colors"
                  placeholder={t('register.account.passwordPlaceholder')}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-[#252840] uppercase tracking-wide mb-1">{t('register.account.bio')}</label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-[#E8DDC7] bg-[#FDFAF4] px-4 py-3 text-sm outline-none focus:border-[#C8864B] transition-colors resize-none"
                  placeholder={t('register.account.bioPlaceholder')}
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                />
              </div>

              <button onClick={handleStep0}
                className="w-full py-3 rounded-full bg-[#C8864B] text-white font-bold border-none cursor-pointer hover:bg-[#B07030] transition-colors">
                {t('register.continue')}
              </button>
              <p className="text-center text-xs text-[#756B5B] mt-4">
                {t('auth.register.hasAccount')}{' '}
                <button onClick={() => navigate('/')} className="font-bold text-[#252840] bg-transparent border-none cursor-pointer hover:text-[#C8864B]">
                  {t('nav.login')}
                </button>
              </p>
            </div>
          )}

          {/* STEP 1 — Compétences */}
          {step === 1 && (
            <div className="rounded-3xl border border-[#E8DDC7] bg-white p-8 shadow-soft">
              <h2 className="text-2xl font-black tracking-tight text-[#252840]">{t('register.skills.title')}</h2>
              <p className="mt-1 text-sm text-[#756B5B] mb-4">{t('register.skills.subtitle')}</p>

              {/* Mini barre d'étapes */}
              <div className="flex items-center gap-2 mb-5">
                {[['teaches', t('register.skills.teaches')], ['wants', t('register.skills.wants')]].map(([v, l], i) => (
                  <div key={v} className="flex items-center gap-2 flex-1">
                    <div className={`flex-1 h-1 rounded-full transition-all ${form[v].length > 0 ? 'bg-[#C8864B]' : skillToggle === v ? 'bg-[#252840]' : 'bg-[#E8DDC7]'}`} />
                    <span className={`text-[10px] font-bold whitespace-nowrap ${form[v].length > 0 ? 'text-[#C8864B]' : skillToggle === v ? 'text-[#252840]' : 'text-[#B0A898]'}`}>
                      {i + 1}. {l}
                    </span>
                  </div>
                ))}
              </div>

              {/* Toggle */}
              <div className="inline-flex rounded-full border border-[#E8DDC7] bg-[#F8F4EA] p-1 mb-5">
                {[['teaches', t('register.skills.teaches')], ['wants', t('register.skills.wants')]].map(([v, l]) => (
                  <button key={v} onClick={() => setSkillToggle(v)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold border-none cursor-pointer transition-colors ${
                      skillToggle === v
                        ? v === 'teaches' ? 'bg-[#252840] text-[#F8F4EA]' : 'bg-[#3D5C28] text-white'
                        : 'bg-transparent text-[#756B5B] hover:text-[#252840]'
                    }`}>
                    {l} ({form[v].length})
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A898]" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="7" cy="7" r="5"/><path d="M12 12l2 2"/>
                </svg>
                <input
                  value={skillSearch}
                  onChange={e => setSkillSearch(e.target.value)}
                  placeholder={t('register.skills.searchPlaceholder')}
                  className="w-full h-10 rounded-full border border-[#E8DDC7] bg-[#FDFAF4] pl-9 pr-4 text-sm outline-none focus:border-[#C8864B] transition-colors"
                />
              </div>

              <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto mb-4">
                {filteredSkills.map(skill => {
                  const selected = form[skillToggle].includes(skill)
                  return (
                    <button key={skill} onClick={() => toggleSkill(skill)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold border cursor-pointer transition-all ${
                        selected
                          ? skillToggle === 'teaches'
                            ? 'bg-[#252840] text-[#F8F4EA] border-[#252840]'
                            : 'bg-[#3D5C28] text-white border-[#3D5C28]'
                          : 'bg-transparent text-[#756B5B] border-[#E8DDC7] hover:border-[#252840] hover:text-[#252840]'
                      }`}>
                      {skill}
                    </button>
                  )
                })}
              </div>

              {/* Custom skill */}
              <div className="flex gap-2 mb-5">
                <input
                  value={customSkill}
                  onChange={e => setCustomSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomSkill()}
                  placeholder={t('register.skills.customPlaceholder')}
                  className="flex-1 h-10 rounded-full border border-[#E8DDC7] bg-[#FDFAF4] px-4 text-sm outline-none focus:border-[#C8864B] transition-colors"
                />
                <button onClick={addCustomSkill} aria-label={t('register.skills.addCustom')}
                  className="h-10 w-10 rounded-full bg-[#C8864B] text-white border-none cursor-pointer hover:bg-[#B07030] transition-colors flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
                </button>
              </div>

              {(form.teaches.length === 0 || form.wants.length === 0) && !loading && (
                <p className="text-xs text-[#C8864B] bg-[rgba(200,134,75,0.1)] rounded-xl px-4 py-2 mb-1">
                  {t('register.skills.hint')}
                </p>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setError(''); setStep(0) }}
                  className="px-5 py-3 rounded-full border border-[#E8DDC7] text-[#756B5B] text-sm font-semibold bg-transparent cursor-pointer hover:border-[#252840] transition-colors">
                  {t('register.back')}
                </button>
                <button onClick={handleStep1}
                  disabled={loading}
                  className="flex-1 py-3 rounded-full bg-[#C8864B] text-white font-bold border-none cursor-pointer hover:bg-[#B07030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? t('register.skills.creating') : t('register.continue')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Disponibilités */}
          {step === 2 && (
            <div className="rounded-3xl border border-[#E8DDC7] bg-white p-8 shadow-soft">
              <h2 className="text-2xl font-black tracking-tight text-[#252840]">{t('register.availability.title')}</h2>
              <p className="mt-1 text-sm text-[#756B5B] mb-5">{t('register.availability.subtitle')}</p>

              <div className="overflow-hidden rounded-2xl border border-[#E8DDC7] mb-6">
                <div className="grid bg-[#F8F4EA]" style={{ gridTemplateColumns: '56px repeat(5, 1fr)' }}>
                  <div className="p-2" />
                  {DAYS.map(d => (
                    <div key={d.key} className="p-2 text-center text-xs font-bold text-[#252840] border-l border-[#E8DDC7]">
                      {t(d.shortKey)}
                    </div>
                  ))}
                </div>
                {SLOTS.map((slot, si) => (
                  <div key={slot.key} className={`grid ${si < SLOTS.length - 1 ? 'border-t border-[#E8DDC7]' : ''}`}
                    style={{ gridTemplateColumns: '56px repeat(5, 1fr)' }}>
                    <div className="p-2 flex items-center">
                      <span className="text-xs font-semibold text-[#252840]">{t(slot.labelKey)}</span>
                    </div>
                    {DAYS.map(day => {
                      const active = !!avail[`${day.key}_${slot.key}`]
                      return (
                        <button key={day.key} onClick={() => toggleAvail(day.key, slot.key)}
                          aria-pressed={active}
                          aria-label={t('register.availability.toggleSlot', { day: t(day.labelKey), slot: t(slot.labelKey) })}
                          className={`border-l border-[#E8DDC7] p-3 flex items-center justify-center cursor-pointer transition-all ${
                            active ? 'bg-[#3D5C28]' : 'bg-white hover:bg-[#F8F4EA]'
                          }`}>
                          {active ? (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M2 7l4 4L12 3"/></svg>
                          ) : (
                            <div className="w-4 h-4 rounded border-[1.5px] border-[#D0C8B8]" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-full border border-[#E8DDC7] text-[#756B5B] text-sm font-semibold bg-transparent cursor-pointer hover:border-[#252840] transition-colors">
                  {t('register.back')}
                </button>
                <button onClick={handleStep2}
                  className="flex-1 py-3 rounded-full bg-[#C8864B] text-white font-bold border-none cursor-pointer hover:bg-[#B07030] transition-colors">
                  {t('register.availability.finish')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
