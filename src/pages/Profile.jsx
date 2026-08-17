import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Camera, LogOut, Pencil } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import CreditIcon from '../components/CreditIcon'

const CLOUD_NAME    = 'derho2rib'
const UPLOAD_PRESET = 'skillbridge_avatars'
const AVAIL_KEY     = 'sb_availability'
const AVATAR_KEY    = 'sb_avatar'
const BANNER_KEY    = 'sb_banner'

const BANNER_SCENES = [
  { bg: 'linear-gradient(135deg,#3F6B4C 0%,#252840 100%)' },
  { bg: 'linear-gradient(135deg,#D98E4A 0%,#7a3f1a 100%)' },
  { bg: 'linear-gradient(135deg,#c9bce6 0%,#252840 100%)' },
  { bg: 'linear-gradient(135deg,#b9d4e8 0%,#3F6B4C 100%)' },
]

const ALL_SKILLS = [
  'Mathematics','English','French','Spanish','Japanese','Chinese','Arabic','Portuguese',
  'Guitar','Piano','Drums','Singing','Drawing','Painting','Photography','Illustration',
  'Python','JavaScript','TypeScript','React','Node.js','Design','Figma','Video editing',
  'Cooking','Yoga','Chess','Writing','Philosophy','Physics','Chemistry','Biology',
  'Music Theory','Violin','Business','Marketing','Finance','Statistics','Data Analysis',
]

// `key` est la valeur persistée (localStorage + PUT /users/me) : jamais traduite.
const DAYS = [
  { key: 'Lundi',    labelKey: 'days.mon' },
  { key: 'Mardi',    labelKey: 'days.tue' },
  { key: 'Mercredi', labelKey: 'days.wed' },
  { key: 'Jeudi',    labelKey: 'days.thu' },
  { key: 'Vendredi', labelKey: 'days.fri' },
]
const SLOTS = [
  { key: 'Matin', labelKey: 'slots.morning', hintKey: 'slotHints.morning' },
  { key: 'Midi',  labelKey: 'slots.noon',    hintKey: 'slotHints.noon'    },
  { key: 'Soir',  labelKey: 'slots.evening', hintKey: 'slotHints.evening' },
]

function loadAvailability() {
  try { return JSON.parse(localStorage.getItem(AVAIL_KEY) || '{}') } catch { return {} }
}

const TABS = ['skills', 'card', 'availability', 'sessions', 'transactions']

export default function Profile() {
  const { user, logout, setUser } = useAuthStore()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const fileRef   = useRef()
  const bannerRef = useRef()

  const [tab,        setTab]        = useState('skills')
  const [profile,    setProfile]    = useState(null)
  const [sessions,   setSessions]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [avail,      setAvail]      = useState(loadAvailability)
  const [availSaved, setAvailSaved] = useState(false)

  const [editing,    setEditing]    = useState(false)
  const [editFirst,  setEditFirst]  = useState('')
  const [editLast,   setEditLast]   = useState('')
  const [editBio,    setEditBio]    = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError,  setEditError]  = useState('')

  const [avatar,          setAvatar]          = useState(() => localStorage.getItem(AVATAR_KEY) || '')
  const [uploading,       setUploading]       = useState(false)
  const [banner,          setBanner]          = useState(() => localStorage.getItem(BANNER_KEY) || '')
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [bannerScene,     setBannerScene]     = useState(0)

  const [addingSkill, setAddingSkill] = useState(false)
  const [skillSearch, setSkillSearch] = useState('')
  const [skillSaving, setSkillSaving] = useState(false)

  // Animated banner gradient
  useEffect(() => {
    if (banner) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setBannerScene(s => (s + 1) % BANNER_SCENES.length), 4500)
    return () => clearInterval(id)
  }, [banner])

  const loadProfile = async () => {
    if (!user) return
    try {
      const [profRes, sessRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/sessions/mine'),
      ])
      const p = profRes.data.user
      setProfile(p)
      setSessions(sessRes.data.sessions ?? [])
      if (p.avatarUrl) setAvatar(p.avatarUrl)
      if (p.bannerUrl) { setBanner(p.bannerUrl); localStorage.setItem(BANNER_KEY, p.bannerUrl) }
      if (p.availability) { try { setAvail(JSON.parse(p.availability)) } catch {} }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadProfile() }, [user])

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#252840]/20 border-t-[#252840] rounded-full animate-spin" />
      </main>
    )
  }

  const displayName = `${profile?.firstName ?? user?.firstName ?? ''} ${profile?.lastName ?? user?.lastName ?? ''}`.trim()
  const initials    = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const credits     = profile?.credits ?? user?.credits ?? 0
  const teaches     = profile?.teachingSkills ?? []
  const wants       = profile?.learningGoals  ?? []

  const sessionsAsTeacher = sessions.filter(s => s.teacher?.id === user?.id)
  const sessionsAsLearner = sessions.filter(s => s.learner?.id  === user?.id)
  const totalEarned = sessionsAsTeacher.filter(s => s.status === 'COMPLETED').reduce((a, s) => a + (s.creditsConsumed ?? 0), 0)
  const totalSpent  = sessionsAsLearner.filter(s => s.status === 'COMPLETED').reduce((a, s) => a + (s.creditsConsumed ?? 0), 0)
  const countSelected = Object.values(avail).filter(Boolean).length

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const startEdit = () => {
    setEditFirst(profile?.firstName ?? user?.firstName ?? '')
    setEditLast(profile?.lastName   ?? user?.lastName  ?? '')
    setEditBio(profile?.bio ?? '')
    setEditError(''); setEditing(true)
  }

  const saveEdit = async () => {
    if (!editFirst.trim() || !editLast.trim()) { setEditError('Prénom et nom requis.'); return }
    setEditSaving(true); setEditError('')
    try {
      const res = await api.put('/users/me', { firstName: editFirst.trim(), lastName: editLast.trim(), bio: editBio.trim() || null })
      setProfile(res.data.user)
      if (setUser) setUser({ ...user, firstName: res.data.user.firstName, lastName: res.data.user.lastName })
      setEditing(false)
    } catch (e) {
      setEditError(e.response?.data?.message || 'Erreur.')
    } finally { setEditSaving(false) }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('upload_preset', UPLOAD_PRESET)
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: form })
      const data = await res.json()
      if (data.secure_url) {
        localStorage.setItem(AVATAR_KEY, data.secure_url)
        setAvatar(data.secure_url)
        await api.put('/users/me', { avatarUrl: data.secure_url }).catch(() => {})
      }
    } catch (e) { console.error('Upload failed', e) }
    finally { setUploading(false) }
  }

  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('upload_preset', UPLOAD_PRESET)
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: form })
      const data = await res.json()
      if (data.secure_url) {
        localStorage.setItem(BANNER_KEY, data.secure_url)
        setBanner(data.secure_url)
        await api.put('/users/me', { bannerUrl: data.secure_url }).catch(() => {})
      }
    } catch (e) { console.error('Banner upload failed', e) }
    finally { setUploadingBanner(false) }
  }

  const clearBanner = () => {
    localStorage.removeItem(BANNER_KEY)
    setBanner('')
  }

  const toggleSlot = (day, slot) => { setAvail(prev => ({ ...prev, [`${day}_${slot}`]: !prev[`${day}_${slot}`] })); setAvailSaved(false) }

  const handleSaveAvail = async () => {
    const json = JSON.stringify(avail)
    localStorage.setItem(AVAIL_KEY, json)
    await api.put('/users/me', { availability: json }).catch(() => {})
    setAvailSaved(true)
    setTimeout(() => setAvailSaved(false), 2000)
  }

  const handleAddSkill = async (skillName, type) => {
    if (!skillName.trim()) return
    setSkillSaving(true)
    try {
      if (type === 'teach') await api.post('/users/skills', { name: skillName, category: 'General' })
      else                  await api.post('/users/learning-goals', { name: skillName, category: 'General' })
      await loadProfile()
      setSkillSearch(''); setAddingSkill(false)
    } catch (e) { alert(e.response?.data?.message || t('profile.genericError')) }
    finally { setSkillSaving(false) }
  }

  const handleRemoveSkill = async (id, type) => {
    try {
      if (type === 'teach') await api.delete(`/users/skills/${id}`)
      else                  await api.delete(`/users/learning-goals/${id}`)
      await loadProfile()
    } catch (e) { alert(e.response?.data?.message || t('profile.genericError')) }
  }

  const filteredSkills = ALL_SKILLS.filter(s =>
    s.toLowerCase().includes(skillSearch.toLowerCase()) &&
    (addingSkill === 'teach'
      ? !teaches.some(t => (t.skill?.name ?? t) === s)
      : !wants.some(w   => (w.skill?.name ?? w) === s))
  )

  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)' }}>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="animate-modal-in bg-white rounded-3xl p-8 w-[440px] max-w-full max-h-[90vh] overflow-y-auto shadow-soft border border-[#E8DDC7]">
            <h2 className="text-xl font-black text-[#252840] mb-5">{t('profile.editModal.title')}</h2>
            {editError && <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{editError}</p>}
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#252840] uppercase tracking-wide mb-1">{t('auth.fields.firstName')}</label>
                <input value={editFirst} onChange={e => setEditFirst(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-[#E8DDC7] bg-[#FDFAF4] text-sm outline-none focus:border-[#C8864B] transition-colors" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#252840] uppercase tracking-wide mb-1">{t('auth.fields.lastName')}</label>
                <input value={editLast} onChange={e => setEditLast(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-[#E8DDC7] bg-[#FDFAF4] text-sm outline-none focus:border-[#C8864B] transition-colors" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#252840] uppercase tracking-wide mb-1">{t('profile.editModal.bio')}</label>
              <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3}
                placeholder={t('profile.editModal.bioPlaceholder')}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DDC7] bg-[#FDFAF4] text-sm outline-none focus:border-[#C8864B] transition-colors resize-none" />
            </div>
            <div className="flex items-center gap-3 mb-5 p-4 bg-[#F8F4EA] rounded-2xl">
              <div className="h-12 w-12 rounded-full bg-[#252840] flex items-center justify-center overflow-hidden flex-shrink-0">
                {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-black text-base">{initials}</span>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#252840]">{t('profile.editModal.avatar')}</p>
                <p className="text-xs text-[#756B5B]">{t('profile.editModal.avatarHint')}</p>
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="px-3 py-2 rounded-xl border border-[#E8DDC7] text-sm font-semibold text-[#252840] bg-white cursor-pointer hover:border-[#C8864B] transition-colors flex-shrink-0">
                {uploading ? t('profile.editModal.uploading') : t('profile.editModal.change')}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={editSaving}
                className="flex-1 py-3 rounded-full bg-[#252840] text-white font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-colors disabled:opacity-50">
                {editSaving ? t('actions.saving') : t('actions.save')}
              </button>
              <button onClick={() => setEditing(false)}
                className="px-5 py-3 rounded-full border border-[#E8DDC7] text-[#756B5B] font-semibold bg-transparent cursor-pointer hover:border-[#252840] transition-colors">
                {t('actions.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill add modal */}
      {addingSkill && (
        <div className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="animate-modal-in bg-white rounded-3xl p-6 w-[440px] max-w-full shadow-soft border border-[#E8DDC7]">
            <h2 className="text-lg font-black text-[#252840] mb-1">
              {addingSkill === 'teach' ? t('profile.skillModal.teachTitle') : t('profile.skillModal.learnTitle')}
            </h2>
            <p className="text-xs text-[#756B5B] mb-4">{t('profile.skillModal.subtitle')}</p>
            <input value={skillSearch} onChange={e => setSkillSearch(e.target.value)}
              placeholder={t('profile.skillModal.searchPlaceholder')}
              className="w-full h-11 px-4 rounded-full border border-[#E8DDC7] bg-[#FDFAF4] text-sm outline-none focus:border-[#C8864B] transition-colors mb-3" />
            {skillSearch.trim() && !ALL_SKILLS.some(s => s.toLowerCase() === skillSearch.toLowerCase()) && (
              <button onClick={() => handleAddSkill(skillSearch.trim(), addingSkill)} disabled={skillSaving}
                className="w-full py-2 mb-2 rounded-full bg-[#C8864B] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#B07030] transition-colors disabled:opacity-50">
                {t('profile.skillModal.addCustom', { skill: skillSearch.trim() })}
              </button>
            )}
            <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
              {filteredSkills.map(skill => (
                <button key={skill} onClick={() => handleAddSkill(skill, addingSkill)} disabled={skillSaving}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all ${
                    addingSkill === 'teach'
                      ? 'border-[#252840]/20 text-[#252840] hover:bg-[#252840] hover:text-white hover:border-[#252840]'
                      : 'border-[#3D5C28]/20 text-[#3D5C28] hover:bg-[#3D5C28] hover:text-white hover:border-[#3D5C28]'
                  }`}>
                  {skill}
                </button>
              ))}
            </div>
            <button onClick={() => { setAddingSkill(false); setSkillSearch('') }}
              className="w-full mt-4 py-2.5 rounded-full border border-[#E8DDC7] text-[#756B5B] text-sm font-semibold bg-transparent cursor-pointer hover:border-[#252840] transition-colors">
              {t('actions.close')}
            </button>
          </div>
        </div>
      )}

      {/* Banner — animated gradient or custom image */}
      <section className="relative overflow-hidden" style={{ minHeight: '260px' }}>
        {/* Gradient scenes */}
        {!banner && BANNER_SCENES.map((scene, i) => (
          <div key={i} className="absolute inset-0 transition-opacity duration-[1400ms]"
            style={{ background: scene.bg, opacity: bannerScene === i ? 1 : 0 }} />
        ))}
        {/* Custom image */}
        {banner && <img src={banner} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        {banner && <div className="absolute inset-0 bg-black/40" />}
        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16 text-white">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

            {/* Left: avatar + info */}
            <div className="flex items-end gap-5">
              <div className="relative flex-shrink-0">
                <div
                  className="w-24 h-24 rounded-3xl border-4 border-white/30 overflow-hidden cursor-pointer"
                  style={{ background: 'rgba(37,40,64,0.7)' }}
                  onClick={() => fileRef.current?.click()}
                >
                  {avatar
                    ? <img src={avatar} alt={t('a11y.avatarPreview')} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white font-black text-3xl">{initials}</div>
                  }
                </div>
                <button onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#C8864B] flex items-center justify-center shadow-md hover:bg-[#B07030] transition-all cursor-pointer border-2 border-white">
                  <Camera size={13} color="white" strokeWidth={1.8} />
                </button>
                {uploading && (
                  <div className="absolute inset-0 rounded-3xl bg-black/50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">{t('profile.eyebrow')}</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">{displayName || '—'}</h1>
                <p className="text-sm text-white/70 mt-1">{user?.email}</p>
                {profile?.bio && (
                  <p className="text-sm text-white/80 mt-2 max-w-sm leading-relaxed">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-wrap gap-2">
              <button onClick={startEdit}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#252840] cursor-pointer border-none transition hover:-translate-y-0.5">
                <Pencil size={13} /> {t('profile.edit')}
              </button>
              <button onClick={() => navigate('/sessions/new')}
                className="inline-flex items-center gap-2 rounded-full bg-[#C8864B] px-4 py-2 text-sm font-bold text-white cursor-pointer border-none transition hover:-translate-y-0.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
                {t('profile.newSession')}
              </button>
              <button onClick={() => bannerRef.current?.click()} disabled={uploadingBanner}
                className="inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-sm font-bold text-white cursor-pointer bg-transparent hover:bg-white/10 transition disabled:opacity-50">
                {uploadingBanner
                  ? <div className="w-3.5 h-3.5 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin" />
                  : <Camera size={13} color="white" strokeWidth={1.8} />
                }
                {t('profile.banner')}
              </button>
              {banner && (
                <button onClick={clearBanner}
                  className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white/80 cursor-pointer bg-transparent hover:bg-white/10 transition">
                  {t('profile.removeBanner')}
                </button>
              )}
              <button onClick={() => { logout(); navigate('/') }}
                className="inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-sm font-bold text-white cursor-pointer bg-transparent hover:bg-white/10 transition">
                <LogOut size={13} /> {t('profile.logout')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — floating card */}
      <div className="relative -mt-6 z-10 mx-auto max-w-4xl px-4 sm:px-6">
        <div className="grid gap-3 rounded-3xl bg-white p-4 shadow-xl ring-1 ring-[#E8DDC7] sm:grid-cols-3 sm:p-5">
          {[
            { value: credits,           label: t('profile.stats.available'), icon: <CreditIcon size="sm" />,                                                                                             color: '#C8864B' },
            { value: `+${totalEarned}`, label: t('profile.stats.earned'),      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 13V3M4 7l4-4 4 4"/></svg>, color: '#3D5C28' },
            { value: totalSpent,        label: t('profile.stats.spent'),    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M4 9l4 4 4-4"/></svg>, color: '#252840' },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-4 rounded-2xl p-4" style={{ background: 'var(--cream)' }}>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-white"
                style={{ background: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</p>
                <p className="text-2xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 pb-20">

        {/* Tab pills */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(key => (
            <button key={key} onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition cursor-pointer ${
                tab === key
                  ? 'bg-[#252840] text-white border-none'
                  : 'border border-[#E8DDC7] bg-white text-[#252840] hover:border-[#C8864B] hover:text-[#C8864B]'
              }`}>
              {t(`profile.tabs.${key}`)}
              {key === 'availability' && countSelected > 0 ? ` (${countSelected})` : ''}
              {key === 'sessions' && sessions.length > 0 ? ` (${sessions.length})` : ''}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          {/* Compétences */}
          {tab === 'skills' && (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#C8864B] mb-3">{t('profile.skills.teaching', { count: teaches.length })}</p>
                <div className="flex flex-wrap gap-2">
                  {teaches.map(ts => (
                    <span key={ts.id} className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(200,134,75,0.12)] px-3 py-1.5 text-xs font-semibold text-[#C8864B]">
                      {ts.skill?.name ?? ts}
                      <button onClick={() => handleRemoveSkill(ts.id, 'teach')}
                        className="h-4 w-4 rounded-full bg-[#C8864B]/20 flex items-center justify-center cursor-pointer border-none hover:bg-red-400 hover:text-white transition-colors">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l6 6M7 1L1 7"/></svg>
                      </button>
                    </span>
                  ))}
                  <button onClick={() => setAddingSkill('teach')}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#E8DDC7] px-3 py-1.5 text-xs text-[#756B5B] cursor-pointer hover:border-[#C8864B] hover:text-[#C8864B] bg-transparent transition">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 1v8M1 5h8"/></svg>
                    Ajouter
                  </button>
                </div>
                {teaches.length === 0 && <p className="text-sm text-[#756B5B] italic mt-2">{t('profile.skills.noTeach')}</p>}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#3D5C28] mb-3">{t('profile.skills.learning', { count: wants.length })}</p>
                <div className="flex flex-wrap gap-2">
                  {wants.map(lg => (
                    <span key={lg.id} className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(61,92,40,0.12)] px-3 py-1.5 text-xs font-semibold text-[#3D5C28]">
                      {lg.skill?.name ?? lg}
                      <button onClick={() => handleRemoveSkill(lg.id, 'learn')}
                        className="h-4 w-4 rounded-full bg-[#3D5C28]/20 flex items-center justify-center cursor-pointer border-none hover:bg-red-400 hover:text-white transition-colors">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l6 6M7 1L1 7"/></svg>
                      </button>
                    </span>
                  ))}
                  <button onClick={() => setAddingSkill('learn')}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#E8DDC7] px-3 py-1.5 text-xs text-[#756B5B] cursor-pointer hover:border-[#3D5C28] hover:text-[#3D5C28] bg-transparent transition">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 1v8M1 5h8"/></svg>
                    Ajouter
                  </button>
                </div>
                {wants.length === 0 && <p className="text-sm text-[#756B5B] italic mt-2">{t('profile.skills.noWant')}</p>}
              </div>
            </div>
          )}

          {/* Ma carte */}
          {tab === 'card' && (
            <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
              <div>
                <h3 className="text-xl font-bold text-[#252840] mb-2">{t('profile.card.title')}</h3>
                <p className="text-sm text-[#756B5B] mb-5">Cette carte s'affiche pour les autres élèves dans la page Connexions.</p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Modifier nom / bio',         action: () => startEdit() },
                    { label: t('profile.card.changePhoto'),     action: () => fileRef.current?.click() },
                    { label: t('profile.card.manageSkills'),    action: () => setTab('skills') },
                    { label: t('profile.card.setAvailability'), action: () => setTab('availability') },
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-[#F8F4EA] hover:bg-[#F0EAE0] border-none cursor-pointer transition-colors text-left">
                      <span className="text-sm font-semibold text-[#252840]">{item.label}</span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#7A6E5C" strokeWidth="2" strokeLinecap="round"><path d="M6 3l5 5-5 5"/></svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl"
                style={{ background: 'linear-gradient(135deg,#252840,#3F6B4C)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-14 w-14 rounded-2xl overflow-hidden bg-[#C8864B]/30 flex items-center justify-center flex-shrink-0">
                    {avatar
                      ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                      : <span className="text-white font-black text-lg">{initials}</span>
                    }
                  </div>
                  <div>
                    <p className="font-bold text-lg text-white leading-tight">{displayName}</p>
                    <p className="text-xs text-white/70 mt-0.5">{user?.email}</p>
                  </div>
                </div>
                {teaches.length > 0 && (
                  <div>
                    <p className="text-xs text-white/60 mb-2">{t('profile.card.teaches')}</p>
                    <div className="flex flex-wrap gap-1">
                      {teaches.slice(0, 4).map(ts => (
                        <span key={ts.id} className="px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs font-semibold">
                          {ts.skill?.name ?? ts}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="absolute bottom-4 right-4 text-[9px] text-white/30 font-bold uppercase tracking-widest">SkillBridge</p>
              </div>
            </div>
          )}

          {/* Disponibilités */}
          {tab === 'availability' && (
            <div>
              <h2 className="text-xl font-black text-[#252840] mb-1">{t('profile.availability.title')}</h2>
              <p className="text-sm text-[#756B5B] mb-5">{t('profile.availability.subtitle')}</p>
              <div className="overflow-x-auto rounded-2xl border border-[#E8DDC7]">
                <div style={{ minWidth: '480px' }}>
                  <div className="grid bg-[#F8F4EA]" style={{ gridTemplateColumns: '100px repeat(5, 1fr)' }}>
                    <div className="p-3" />
                    {DAYS.map(day => (
                      <div key={day.key} className="p-3 text-center text-xs font-bold text-[#252840] border-l border-[#E8DDC7]">{t(day.labelKey)}</div>
                    ))}
                  </div>
                  {SLOTS.map((slot, si) => (
                    <div key={slot.key} className={`grid ${si < SLOTS.length - 1 ? 'border-t border-[#E8DDC7]' : ''}`} style={{ gridTemplateColumns: '100px repeat(5, 1fr)' }}>
                      <div className="p-3 flex flex-col justify-center">
                        <p className="text-xs font-bold text-[#252840]">{t(slot.labelKey)}</p>
                        <p className="text-[10px] text-[#756B5B]">{t(slot.hintKey)}</p>
                      </div>
                      {DAYS.map(day => {
                        const active = !!avail[`${day.key}_${slot.key}`]
                        return (
                          <button key={day.key} onClick={() => toggleSlot(day.key, slot.key)}
                            aria-pressed={active}
                            aria-label={t('register.availability.toggleSlot', { day: t(day.labelKey), slot: t(slot.labelKey) })}
                            className={`border-l border-[#E8DDC7] p-3 flex items-center justify-center cursor-pointer transition-all ${active ? 'bg-[#3D5C28] hover:bg-[#4E6035]' : 'bg-white hover:bg-[#F8F4EA]'}`}>
                            {active
                              ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3.5 3.5L13 4"/></svg>
                              : <div className="w-4 h-4 rounded border-[1.5px] border-[#D0C8B8]" />}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={handleSaveAvail}
                  className="px-6 py-3 rounded-full bg-[#C8864B] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#B07030] transition-colors">
                  {t('actions.save')}
                </button>
                {availSaved && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3D5C28]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7l4 4 6-6"/></svg>
                    {t('profile.availability.saved')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Sessions */}
          {tab === 'sessions' && (
            <div>
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg font-semibold text-[#252840] mb-4">{t('profile.sessions.empty')}</p>
                  <button onClick={() => navigate('/sessions/new')}
                    className="px-6 py-3 rounded-full bg-[#252840] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-colors">
                    {t('profile.sessions.create')}
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-[#F0EAE0]">
                  {sessions.map(s => {
                    const isTeacher = s.teacher?.id === user?.id
                    const partner   = isTeacher ? s.learner : s.teacher
                    const statusMap = {
                      SCHEDULED: { label: t('profile.status.scheduled'), cls: 'bg-[rgba(61,92,40,0.12)] text-[#3D5C28]' },
                      ACTIVE:    { label: t('profile.status.active'),    cls: 'bg-[rgba(200,134,75,0.15)] text-[#C8864B]' },
                      COMPLETED: { label: t('profile.status.completed'), cls: 'bg-[rgba(37,40,64,0.1)] text-[#252840]' },
                      CANCELLED: { label: t('profile.status.cancelled'), cls: 'bg-red-50 text-red-500' },
                    }
                    const st = statusMap[s.status] ?? statusMap.SCHEDULED
                    return (
                      <li key={s.id} onClick={() => navigate(`/sessions/${s.id}`)}
                        className="flex items-center gap-4 py-4 cursor-pointer hover:bg-[#F8F4EA] rounded-xl px-2 transition-colors -mx-2">
                        <div className="h-11 w-11 rounded-2xl bg-[#252840] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {partner?.firstName?.[0]}{partner?.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-[#252840] truncate">{s.title}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0 ${st.cls}`}>{st.label}</span>
                          </div>
                          <p className="text-xs text-[#756B5B]">{isTeacher ? t('profile.sessions.teaching') : t('profile.sessions.learning')} · {partner?.firstName} {partner?.lastName} · {formatDate(s.startsAt)}</p>
                        </div>
                        <p className={`text-sm font-black flex-shrink-0 ${isTeacher ? 'text-[#3D5C28]' : 'text-[#C8864B]'}`}>
                          {isTeacher ? '+' : '-'}{s.creditsReserved} cr
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Historique */}
          {tab === 'transactions' && (
            <div>
              {sessions.filter(s => s.status === 'COMPLETED').length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg font-semibold text-[#252840] mb-1">{t('profile.transactions.empty')}</p>
                  <p className="text-sm text-[#756B5B]">{t('profile.transactions.emptyHint')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-[#F0EAE0]">
                  {sessions.filter(s => s.status === 'COMPLETED').map(s => {
                    const isTeacher = s.teacher?.id === user?.id
                    const partner   = isTeacher ? s.learner : s.teacher
                    const delta     = isTeacher ? s.creditsConsumed : -(s.creditsConsumed)
                    return (
                      <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isTeacher ? 'bg-[rgba(61,92,40,0.12)]' : 'bg-[rgba(200,134,75,0.12)]'}`}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={isTeacher ? '#3D5C28' : '#C8864B'} strokeWidth="1.6" strokeLinecap="round">
                              {isTeacher ? <path d="M8 14V2M3 7l5-5 5 5"/> : <path d="M8 2v12M3 9l5 5 5-5"/>}
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-[#252840]">{s.title}</p>
                            <p className="text-xs text-[#756B5B]">{isTeacher ? t('profile.transactions.givenTo') : t('profile.transactions.receivedFrom')} {partner?.firstName} {partner?.lastName} · {formatDate(s.actualEndedAt)}</p>
                          </div>
                        </div>
                        <p className={`text-base font-black flex-shrink-0 ${isTeacher ? 'text-[#3D5C28]' : 'text-[#C8864B]'}`}>
                          {delta > 0 ? '+' : ''}{delta} cr
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
