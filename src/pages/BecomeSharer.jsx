// src/pages/BecomeSharer.jsx — Créer son profil de donneur
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import useAuthStore from '../store/authStore'

const ALL_SKILLS = [
  // Langues
  'French', 'English', 'Spanish', 'Arabic', 'Japanese', 'Chinese', 'Portuguese', 'Italian', 'German',
  // Tech
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Photography', 'Video editing', 'Data Analysis',
  // Design
  'Design', 'Figma', 'Illustration', 'Drawing', 'Painting', 'Graphic Design',
  // Musique
  'Guitar', 'Piano', 'Drums', 'Singing', 'Music Theory', 'Violin', 'Bass',
  // Sciences
  'Mathematics', 'Physics', 'Chemistry', 'Philosophy', 'Biology', 'Statistics',
  // Bien-être
  'Yoga', 'Cooking', 'Chess', 'Writing', 'Meditation', 'Running', 'Swimming',
  // Business
  'Business', 'Finance', 'Marketing', 'Entrepreneurship', 'Accounting',
]

// `key` est la valeur envoyée au backend : jamais traduite.
const DAYS = [
  { key: 'Lun', labelKey: 'daysShort.mon' },
  { key: 'Mar', labelKey: 'daysShort.tue' },
  { key: 'Mer', labelKey: 'daysShort.wed' },
  { key: 'Jeu', labelKey: 'daysShort.thu' },
  { key: 'Ven', labelKey: 'daysShort.fri' },
  { key: 'Sam', labelKey: 'daysShort.sat' },
  { key: 'Dim', labelKey: 'daysShort.sun' },
]
const SLOTS = ['slots.morning', 'slots.afternoon', 'slots.evening']

const EMPTY_SCHEDULE = Object.fromEntries(DAYS.map(d => [d.key, [false, false, false]]))

export default function BecomeSharer() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, setUser } = useAuthStore()

  const [step,     setStep]    = useState(1) // 1=skills 2=bio+schedule 3=success
  const [skills,   setSkills]  = useState([])
  const [bio,      setBio]     = useState(user?.bio || '')
  const [schedule, setSchedule] = useState(EMPTY_SCHEDULE)
  const [credits,  setCredits] = useState(1)
  const [loading,  setLoading] = useState(false)
  const [error,    setError]   = useState('')

  const toggleSkill = (skill) => {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const toggleSlot = (day, idx) => {
    setSchedule(prev => {
      const slots = [...prev[day]]
      slots[idx] = !slots[idx]
      return { ...prev, [day]: slots }
    })
  }

  const availableSlotCount = Object.values(schedule).reduce(
    (sum, slots) => sum + slots.filter(Boolean).length, 0
  )

  const handleSubmit = async () => {
    if (skills.length === 0) { setError(t('becomeSharer.errors.skills')); return }
    setError('')
    setLoading(true)
    try {
      // Add each skill
      for (const skill of skills) {
        try {
          await api.post('/users/skills', { name: skill })
        } catch {
          // Skill may already exist, ignore
        }
      }
      // Update bio
      if (bio.trim()) {
        const res = await api.patch('/users/me', { bio: bio.trim() })
        if (res.data.user) setUser(res.data.user)
      }
      setStep(3)
    } catch (e) {
      setError(e.response?.data?.message || t('becomeSharer.errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  if (step === 3) {
    return (
      <main className="pt-[62px] min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-[#3D5C28]/20 flex items-center justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#3D5C28" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 14l6 6L23 8"/>
          </svg>
        </div>
        <h1 className="text-[28px] font-black tracking-tight text-[#1A1410] mb-2 text-center">
          {t('becomeSharer.doneTitle')}
        </h1>
        <p className="text-[14px] text-[#7A6E5C] text-center max-w-[400px] mb-8">
          {t('becomeSharer.doneText')}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/connection')}
            className="px-6 py-3 rounded-xl border-[1.5px] border-[#252840] text-[#252840] text-[13px] font-semibold bg-transparent cursor-pointer hover:bg-[#252840] hover:text-white transition-all"
          >
            {t('becomeSharer.seeConnections')}
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 rounded-xl bg-[#252840] text-white text-[13px] font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-all"
          >
            {t('becomeSharer.myProfile')}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-[62px] min-h-screen bg-white">
      <div className="max-w-[680px] mx-auto px-6 py-10">

        <button onClick={() => step === 1 ? navigate(-1) : setStep(1)}
          className="flex items-center gap-2 text-[13px] text-[#7A6E5C] font-medium bg-transparent border-none cursor-pointer hover:text-[#1A1410] transition-all mb-6">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M9 2L4 7l5 5"/>
          </svg>
          {step === 1 ? t('becomeSharer.back') : t('becomeSharer.previousStep')}
        </button>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all
                ${step >= s ? 'bg-[#252840] text-white' : 'bg-black/[0.08] text-[#7A6E5C]'}`}>
                {s}
              </div>
              {s < 2 && <div className={`h-[2px] w-16 rounded-full transition-all ${step > s ? 'bg-[#252840]' : 'bg-black/[0.08]'}`} />}
            </div>
          ))}
          <span className="ml-2 text-[12px] text-[#7A6E5C]">
            {step === 1 ? t('becomeSharer.step1Label') : t('becomeSharer.step2Label')}
          </span>
        </div>

        <h1 className="text-[28px] font-black tracking-tight text-[#1A1410] mb-2">
          {step === 1 ? t('becomeSharer.step1Title') : t('becomeSharer.step2Title')}
        </h1>
        <p className="text-[14px] text-[#7A6E5C] mb-8">
          {step === 1
            ? t('becomeSharer.step1Text')
            : t('becomeSharer.step2Text')}
        </p>

        {error && (
          <p className="text-red-500 text-[13px] bg-red-50 px-4 py-3 rounded-xl mb-5">{error}</p>
        )}

        {/* ── Étape 1 : Compétences ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-black/[0.09] p-8">
            <div className="flex flex-wrap gap-2 mb-6">
              {ALL_SKILLS.map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-[8px] rounded-full text-[13px] font-semibold border-[1.5px] cursor-pointer transition-all
                    ${skills.includes(skill)
                      ? 'bg-[#252840] text-white border-[#252840]'
                      : 'bg-white text-[#7A6E5C] border-black/[0.09] hover:border-[#252840] hover:text-[#1A1410]'}`}
                >
                  {skill}
                </button>
              ))}
            </div>

            {skills.length > 0 && (
              <div className="bg-[#ECEEF8] rounded-xl px-5 py-3 mb-6">
                <p className="text-[13px] font-bold text-[#252840]">
                  {skills.length} compétence{skills.length > 1 ? 's' : ''} sélectionnée{skills.length > 1 ? 's' : ''} :{' '}
                  <span className="font-normal">{skills.join(', ')}</span>
                </p>
              </div>
            )}

            <button
              onClick={() => {
                if (skills.length === 0) { setError('Sélectionnez au moins une compétence.'); return }
                setError('')
                setStep(2)
              }}
              disabled={skills.length === 0}
              className="w-full py-3 rounded-xl bg-[#252840] text-white text-[14px] font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-all disabled:opacity-40"
            >
              {t('becomeSharer.continue')}
            </button>
          </div>
        )}

        {/* ── Étape 2 : Bio + Planning + Tarif ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-black/[0.09] p-8 flex flex-col gap-6">

            {/* Bio */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#7A6E5C] block mb-1">
                {t('becomeSharer.bio')}
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={t('becomeSharer.bioPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-black/[0.09] bg-white text-[14px] text-[#1A1410] outline-none focus:border-[#252840] transition-all resize-none h-28"
              />
            </div>

            {/* Tarif */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#7A6E5C] block mb-1">
                {t('becomeSharer.rate')}
              </label>
              <select
                value={credits}
                onChange={e => setCredits(Number(e.target.value))}
                className="w-full px-4 py-[10px] rounded-xl border-[1.5px] border-black/[0.09] bg-white text-[14px] text-[#1A1410] outline-none focus:border-[#252840] transition-all"
              >
                {[1, 2, 3].map(n => (
                  <option key={n} value={n}>{t('becomeSharer.rateOption', { count: n })}</option>
                ))}
              </select>
            </div>

            {/* Grille planning */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#7A6E5C] block mb-3">
                {t('becomeSharer.slots')}
              </label>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="text-left text-[#7A6E5C] font-semibold pb-2 pr-3 w-[50px]" />
                      {SLOTS.map(slotKey => (
                        <th key={slotKey} className="text-center text-[#7A6E5C] font-semibold pb-2 px-1 min-w-[80px]">
                          {t(slotKey)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day.key}>
                        <td className="text-[12px] font-bold py-[4px] pr-3 text-[#1A1410]">{t(day.labelKey)}</td>
                        {schedule[day.key].map((active, i) => (
                          <td key={i} className="px-1 py-[4px] text-center">
                            <button
                              onClick={() => toggleSlot(day.key, i)}
                              aria-pressed={active}
                              aria-label={t('register.availability.toggleSlot', { day: t(day.labelKey), slot: t(SLOTS[i]) })}
                              className={`w-full h-[28px] rounded-lg text-[10px] font-bold transition-all border-none cursor-pointer
                                ${active
                                  ? 'bg-[#3D5C28] text-white hover:bg-[#4E6035]'
                                  : 'bg-[#F5F3EE] text-[#B0A898] hover:bg-[#E4EED8] hover:text-[#3D5C28]'}`}
                            >
                              {active ? t('member.available') : t('member.unavailable')}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[12px] text-[#7A6E5C] mt-2">
                {availableSlotCount} créneau{availableSlotCount !== 1 ? 'x' : ''} sélectionné{availableSlotCount !== 1 ? 's' : ''}
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#3D5C28] text-white text-[14px] font-bold border-none cursor-pointer hover:bg-[#4E6035] transition-all disabled:opacity-50"
            >
              {loading ? t('actions.saving') : t('becomeSharer.submit')}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}