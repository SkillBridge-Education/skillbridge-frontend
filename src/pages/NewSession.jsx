import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import { GROUP_SESSIONS_ENABLED } from '../config/features'

function CreditSummary({ duration, creditsPerMin }) {
  const { t } = useTranslation()
  const creditsNeeded = duration * creditsPerMin

  return (
    <div className="rounded-xl px-5 py-4 flex flex-col gap-2 border bg-[#ECEEF8] border-[#252840]/10">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-5 h-5 rounded-full bg-[#252840] flex items-center justify-center flex-shrink-0">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4.5" stroke="white" strokeWidth="1"/>
            <path d="M5 3v2.5L6.5 7" stroke="white" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#252840]">
            {t('newSession.costSummary', { duration, count: creditsNeeded })}
          </p>
          <p className="text-[12px] text-[#756B5B] mt-0.5 leading-relaxed">
            {t('newSession.costHint')}
          </p>
        </div>
      </div>
    </div>
  )
}

const CATEGORIES = ['Mathematics','Languages','Music','Programming','Design','Cooking','Science','Art','Sport','Other']

export default function NewSession() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuthStore()
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [connections, setConnections] = useState([])
  const [createdLink, setCreatedLink] = useState(null)
  const [form, setForm] = useState({
    title:          '',
    description:    '',
    category:       'Mathematics',
    date:           '',
    time:           '',
    duration:       60,
    creditsPerMin:  1,
    sessionMode:    null,        // 'cadree' | 'ouverte'
    invitedIds:     params.get('with') ? [params.get('with')] : [],
    maxParticipants: 3,
    openLimit:      '',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!user) return
    api.get('/matches/mine')
      .then(res => {
        const matches = res.data.matches || []
        const accepted = matches
          .filter(m => m.status === 'ACCEPTED')
          .map(m => {
            const other = m.requesterId === user.id ? m.receiver : m.requester
            return { id: other.id, name: `${other.firstName} ${other.lastName}` }
          })
        setConnections(accepted)
      })
      .catch(() => {})
  }, [user])

  const toggleInvite = (id) => {
    setForm(p => {
      const has = p.invitedIds.includes(id)
      return { ...p, invitedIds: has ? p.invitedIds.filter(x => x !== id) : [...p.invitedIds, id] }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.sessionMode) { setError(t('newSession.errors.mode')); return }
    if (form.sessionMode === 'cadree' && form.invitedIds.length === 0) {
      setError(t('newSession.errors.invite'))
      return
    }
    setError('')
    setLoading(true)
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString()

      if (GROUP_SESSIONS_ENABLED && form.sessionMode === 'cadree' && form.invitedIds.length > 1) {
        // Session de groupe avec plusieurs participants
        const res = await api.post('/sessions/group', {
          title:             form.title,
          estimatedDuration: Number(form.duration),
          scheduledAt,
          learnerIds:        form.invitedIds,
        })
        navigate('/sessions')
        return
      }

      // Session classique (1 learner)
      const res = await api.post('/sessions', {
        title:             form.title,
        estimatedDuration: Number(form.duration),
        scheduledAt,
        learnerId:         form.invitedIds[0],
      })
      navigate('/sessions')
    } catch (err) {
      setError(err.response?.data?.message || t('newSession.errors.failed'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-[10px] rounded-xl border-[1.5px] border-[color:var(--field-border)] bg-white text-[14px] text-[#1A1410] outline-none focus:border-[#252840] transition-all"
  const labelClass = "text-[11px] font-bold uppercase tracking-[0.6px] text-[#7A6E5C] block mb-1"

  /* ── Écran lien de partage ── */
  if (GROUP_SESSIONS_ENABLED && createdLink) return (
    <main className="pt-[62px] min-h-screen bg-[#F8F4EA] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-black/[0.09] p-10 w-full max-w-[480px] text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#E4EED8] flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3D5C28" strokeWidth="2" strokeLinecap="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </div>
        <h2 className="text-[22px] font-black text-[#1A1410] mb-2">{t('newSession.createdTitle')}</h2>
        <p className="text-[14px] text-[#7A6E5C] mb-6">{t('newSession.createdText')}</p>
        <div className="bg-[#F8F4EA] rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
          <p className="flex-1 text-[12px] text-[#252840] font-mono truncate">{createdLink}</p>
          <button
            onClick={() => navigator.clipboard?.writeText(createdLink)}
            className="px-3 py-1 rounded-lg bg-[#252840] text-white text-[11px] font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-all flex-shrink-0">
            {t('actions.copy')}
          </button>
        </div>
        <button onClick={() => navigate('/sessions')}
          className="w-full py-3 rounded-xl bg-[#252840] text-white text-[14px] font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-all">
          {t('newSession.seeSessions')}
        </button>
      </div>
    </main>
  )

  return (
    <main className="pt-[62px] min-h-screen bg-white">
      <div className="max-w-[640px] mx-auto px-6 py-10">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[13px] text-[#7A6E5C] font-medium bg-transparent border-none cursor-pointer hover:text-[#1A1410] transition-all mb-6">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>
          {t('newSession.back')}
        </button>

        <h1 className="text-[28px] font-black tracking-tight text-[#1A1410] mb-2">{t('newSession.title')}</h1>
        <p className="text-[14px] text-[#7A6E5C] mb-8">{t('newSession.subtitle')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && <p className="text-red-500 text-[13px] bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

          {/* Infos de base */}
          <div className="bg-white rounded-2xl border border-black/[0.09] p-6 flex flex-col gap-5">
            <div>
              <label className={labelClass}>{t('newSession.sessionTitle')}</label>
              <input className={inputClass} placeholder={t('newSession.titlePlaceholder')}
                value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>{t('newSession.description')}</label>
              <textarea className={`${inputClass} resize-none h-20`} placeholder={t('newSession.descriptionPlaceholder')}
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{t('newSession.category')}</label>
              <select className={inputClass} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('newSession.date')}</label>
                <input type="date" className={inputClass} value={form.date} onChange={e => set('date', e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>{t('newSession.time')}</label>
                <input type="time" className={inputClass} value={form.time} onChange={e => set('time', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('newSession.duration')}</label>
                <select className={inputClass} value={form.duration} onChange={e => set('duration', Number(e.target.value))}>
                  {[30,45,60,90,120].map(d => <option key={d} value={d}>{t('newSession.durationOption', { count: d })}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('newSession.creditsPerMinute')}</label>
                <select className={inputClass} value={form.creditsPerMin} onChange={e => set('creditsPerMin', Number(e.target.value))}>
                  {[1,2,3].map(n => <option key={n} value={n}>{t('newSession.creditsOption', { count: n })}</option>)}
                </select>
              </div>
            </div>
            <CreditSummary duration={form.duration} creditsPerMin={form.creditsPerMin} />
          </div>

          {/* Choix du mode */}
          <div>
            <p className="text-[13px] font-bold text-[#1A1410] mb-3">{t('newSession.mode')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Carte Session cadrée */}
              <button type="button" onClick={() => set('sessionMode', 'cadree')}
                className={`text-left p-5 rounded-2xl border-[2px] cursor-pointer transition-all bg-transparent
                  ${form.sessionMode === 'cadree'
                    ? 'border-[#252840] bg-[#ECEEF8]'
                    : 'border-black/[0.09] hover:border-[#252840]/40 bg-white'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${form.sessionMode === 'cadree' ? 'bg-[#252840]' : 'bg-[#F0F1FA]'}`}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={form.sessionMode === 'cadree' ? 'white' : '#252840'} strokeWidth="1.6" strokeLinecap="round">
                      <circle cx="7" cy="6" r="3"/><circle cx="13" cy="6" r="2.5"/>
                      <path d="M1 16c0-3.3 2.7-6 6-6"/><path d="M13 11c2.8 0 5 2.2 5 5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#1A1410]">{t('newSession.modeClosed')}</p>
                    {form.sessionMode === 'cadree' && <p className="text-[10px] text-[#252840] font-semibold">{t('newSession.selected')}</p>}
                  </div>
                </div>
                <p className="text-[12px] text-[#7A6E5C] leading-relaxed">
                  {t('newSession.modeClosedText')}
                </p>
              </button>

              {/* Carte Session ouverte */}
              <button type="button"
                onClick={() => set('sessionMode', 'ouverte')}
                className={`text-left p-5 rounded-2xl border-[2px] cursor-pointer transition-all bg-transparent
                  ${form.sessionMode === 'ouverte'
                    ? 'border-[#3D5C28] bg-[#EEF4E8]'
                    : 'border-black/[0.09] hover:border-[#3D5C28]/40 bg-white'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#EEF4E8]">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#3D5C28" strokeWidth="1.6" strokeLinecap="round">
                      <circle cx="6" cy="6" r="3"/><circle cx="12" cy="6" r="3"/><circle cx="9" cy="13" r="3"/>
                      <path d="M8.5 9.5l-2 2"/><path d="M9.5 9.5l2 2"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#1A1410]">{t('newSession.modeOpen')}</p>
                    {form.sessionMode === 'ouverte' && <p className="text-[10px] text-[#3D5C28] font-semibold">{t('newSession.selected')}</p>}
                  </div>
                </div>
                <p className="text-[12px] text-[#7A6E5C] leading-relaxed">
                  {t('newSession.modeOpenText')}
                </p>
              </button>
            </div>
          </div>

          {/* Contenu mode cadrée */}
          {form.sessionMode === 'cadree' && (
            <div className="bg-white rounded-2xl border border-black/[0.09] p-6 flex flex-col gap-4">
              <p className="text-[13px] font-bold text-[#1A1410]">{t('newSession.invite')}</p>
              {connections.length === 0 ? (
                <div className="bg-[#F8F4EA] rounded-xl p-4 text-[13px] text-[#7A6E5C]">
                  {t('newSession.noConnections')}
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                  {connections.map(c => (
                    <label key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border
                        ${form.invitedIds.includes(c.id) ? 'bg-[#ECEEF8] border-[#252840]/30' : 'bg-[#F8F4EA] border-transparent hover:border-black/[0.09]'}`}>
                      <input type="checkbox" className="accent-[#252840] w-4 h-4"
                        checked={form.invitedIds.includes(c.id)}
                        onChange={() => toggleInvite(c.id)} />
                      <div className="w-8 h-8 rounded-full bg-[#252840] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                        {c.name[0]}
                      </div>
                      <span className="text-[13px] font-semibold text-[#1A1410]">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {GROUP_SESSIONS_ENABLED && (
                <div>
                  <label className={labelClass}>{t('newSession.maxParticipants')}</label>
                  <input type="number" min="2" max="10" className={inputClass}
                    value={form.maxParticipants}
                    onChange={e => set('maxParticipants', Math.min(10, Math.max(2, Number(e.target.value))))} />
                </div>
              )}
              {form.invitedIds.length > 0 && (
                <p className="text-[12px] text-[#3D5C28] font-semibold">
                  {t('newSession.selectedCount', { count: form.invitedIds.length })}
                </p>
              )}
              {GROUP_SESSIONS_ENABLED && form.invitedIds.length > 1 && (
                <p className="text-[12px] text-[#3D5C28] bg-[#EEF4E8] px-4 py-3 rounded-xl">
                  {t('newSession.groupSession', { count: form.invitedIds.length })}
                </p>
              )}
            </div>
          )}

          {/* Contenu mode ouverte */}
          {GROUP_SESSIONS_ENABLED && form.sessionMode === 'ouverte' && (
            <div className="bg-white rounded-2xl border border-black/[0.09] p-6 flex flex-col gap-4">
              <p className="text-[13px] font-bold text-[#1A1410]">{t('newSession.openSettings')}</p>
              <div>
                <label className={labelClass}>{t('newSession.openLimit')}</label>
                <input type="number" min="2" max="50" className={inputClass}
                  placeholder={t('newSession.openLimitPlaceholder')}
                  value={form.openLimit}
                  onChange={e => set('openLimit', e.target.value)} />
                <p className="text-[11px] text-[#7A6E5C] mt-1">{t('newSession.openLinkHint')}</p>
              </div>
            </div>
          )}

          <button type="submit"
            disabled={
              loading ||
              !form.sessionMode ||
              (form.sessionMode === 'cadree' && form.invitedIds.length === 0)
            }
            className="w-full py-3 rounded-xl bg-[#252840] text-white text-[14px] font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-all disabled:opacity-50">
            {loading ? t('newSession.creating') : t('newSession.submit')}
          </button>
        </form>
      </div>
    </main>
  )
}
