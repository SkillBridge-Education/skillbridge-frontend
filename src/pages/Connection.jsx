import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Star, Send, X } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import { CATEGORIES, SKILL_TO_CATEGORY } from '../data/categories'
import Reveal from '../components/Reveal'
import { useToast } from '../components/Toast'

const COLORS = ['#252840', '#C8864B', '#3D5C28', '#363B6B']

function colorFor(id) {
  if (!id) return COLORS[0]
  return COLORS[Math.abs(id.charCodeAt(0) % COLORS.length)]
}

function getAvailFor(u) {
  if (u && u.availability) {
    try { return JSON.parse(u.availability) } catch {}
  }
  return {}
}

function matchScore(member, myGoals, mySkills) {
  let score = 0
  myGoals.forEach(g => {
    if (member.teaches.some(s => s.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(s.toLowerCase()))) score += 10
  })
  mySkills.forEach(s => {
    if (member.wants.some(w => w.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(w.toLowerCase()))) score += 5
  })
  return score
}

function AvatarCircle({ user: u, name, color, size = 56 }) {
  const initials = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  const sz = size === 64 ? 'h-16 w-16 text-xl' : 'h-14 w-14 text-base'
  if (u?.avatarUrl) {
    return <img src={u.avatarUrl} alt={name} className={`${sz} rounded-2xl object-cover flex-shrink-0`} />
  }
  return (
    <div className={`${sz} rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0`} style={{ background: color }}>
      {initials}
    </div>
  )
}

// `key` compose la clé de disponibilité persistée ("Lundi_Matin") : jamais traduite.
const DAYS = [
  { key: 'Lundi',    labelKey: 'daysShort.mon' },
  { key: 'Mardi',    labelKey: 'daysShort.tue' },
  { key: 'Mercredi', labelKey: 'daysShort.wed' },
  { key: 'Jeudi',    labelKey: 'daysShort.thu' },
  { key: 'Vendredi', labelKey: 'daysShort.fri' },
]
const SLOTS = [
  { key: 'Matin', labelKey: 'slots.morning' },
  { key: 'Midi',  labelKey: 'slots.noon'    },
  { key: 'Soir',  labelKey: 'slots.evening' },
]

const FILTERS = [{ key: 'all', labelKey: 'categories.allShort' }, ...CATEGORIES.filter(c => c.key !== 'all')]

export default function Connection() {
  const { user, openModal } = useAuthStore()
  const addToast = useToast()
  const { t } = useTranslation()

  const [tab,       setTab]       = useState('discover')
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState(null)
  const [pickedSlots, setPickedSlots] = useState({})

  const [incoming,  setIncoming]  = useState([])
  const [requested, setRequested] = useState(new Set())
  const [allUsers,  setAllUsers]  = useState([])
  const [myProfile, setMyProfile] = useState(null)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const [sugRes, matchRes, profRes] = await Promise.all([
        api.get('/matches/suggestions'),
        api.get('/matches/mine'),
        api.get('/users/me'),
      ])
      setAllUsers(sugRes.data.suggestions || [])
      setMyProfile(profRes.data.user)
      const matches = matchRes.data.matches || []
      setIncoming(matches.filter(m => m.receiverId === user.id && m.status === 'PENDING'))
      setRequested(new Set(matches.filter(m => m.requesterId === user.id).map(m => m.receiverId)))
    } catch {}
  }, [user])

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 5000)
    return () => clearInterval(id)
  }, [loadData])

  useEffect(() => {
    setPickedSlots({})
  }, [selected?.id])

  const myGoals  = (myProfile?.learningGoals  || []).map(g => g.skill?.name ?? g)
  const mySkills = (myProfile?.teachingSkills || []).map(s => s.skill?.name ?? s)

  const mySkillGoalIds = new Set(
    (myProfile?.learningGoals || []).map(g => g.skill?.id).filter(Boolean)
  )

  const members = allUsers.map(u => {
    const teachesNames = (u.teachingSkills || []).map(s => s.skill?.name ?? '')
    const wantsNames   = (u.learningGoals  || []).map(s => s.skill?.name ?? '')
    const teachesObjs  = (u.teachingSkills || [])
      .map(s => {
        const name    = s.skill?.name ?? ''
        const id      = s.skill?.id   ?? null
        const isMatch = mySkillGoalIds.has(id) ||
          myGoals.some(g => g.toLowerCase() === name.toLowerCase())
        return { id, name, isMatch }
      })
      .sort((a, b) => Number(b.isMatch) - Number(a.isMatch))
    return {
      id:            u.id,
      firstName:     u.firstName,
      lastName:      u.lastName,
      bio:           u.bio || '',
      avatarUrl:     u.avatarUrl || '',
      availability:  u.availability || null,
      averageRating: u.averageRating ?? null,
      teaches:       teachesObjs,
      wants:         wantsNames,
      color:         colorFor(u.id),
      score:         matchScore({ teaches: teachesNames, wants: wantsNames }, myGoals, mySkills),
      user:          u,
    }
  })

  const filtered = members
    .filter(m => {
      if (filter !== 'all') {
        const cat = CATEGORIES.find(c => c.key === filter)
        if (cat && !m.teaches.some(s => cat.skills.includes(s.name))) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
          m.teaches.some(s => s.name.toLowerCase().includes(q))
      }
      return true
    })
    .sort((a, b) => b.score - a.score || a.firstName.localeCompare(b.firstName))

  const handleConnect = async (memberId) => {
    if (!user) { openModal('login'); return }
    try {
      await api.post('/matches/request', { receiverId: memberId })
      setRequested(prev => new Set([...prev, memberId]))
      setSelected(null)
      addToast?.(t('connection.toasts.requestSent'), 'success')
    } catch (e) {
      addToast?.(e.response?.data?.message || t('connection.toasts.requestError'), 'error')
    }
  }

  const handleAccept = async (matchId, requesterId) => {
    try {
      await api.patch(`/matches/${matchId}`, { status: 'ACCEPTED' })
      setIncoming(prev => prev.filter(m => m.id !== matchId))
      setRequested(prev => new Set([...prev, requesterId]))
      addToast?.(t('connection.toasts.accepted'), 'success')
    } catch (e) { addToast?.(e.response?.data?.message || t('connection.toasts.genericError'), 'error') }
  }

  const handleDecline = async (matchId) => {
    try {
      await api.patch(`/matches/${matchId}`, { status: 'REJECTED' })
      setIncoming(prev => prev.filter(m => m.id !== matchId))
    } catch {}
  }

  const memberAvail = selected ? getAvailFor(selected) : {}

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-soft border border-[#E8DDC7] animate-modal-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <AvatarCircle user={selected} name={`${selected.firstName} ${selected.lastName}`} color={selected.color} size={64} />
                  <div>
                    <h2 className="text-xl font-bold text-[#252840]">{selected.firstName} {selected.lastName}</h2>
                    {selected.averageRating != null && (
                      <p className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--orange-warm)' }}>
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {Number(selected.averageRating).toFixed(1)}
                      </p>
                    )}
                    {selected.bio && <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{selected.bio}</p>}
                    {selected.score > 0 && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(63,107,76,0.12)', color: 'var(--learn)' }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1.5 5l3 3 5-5"/></svg>
                        Correspond à vos objectifs
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-full bg-[#F8F4EA] flex items-center justify-center border-none cursor-pointer hover:bg-[#E8DDC7]">
                  <X size={14} className="text-[#756B5B]" />
                </button>
              </div>

              {/* Teaches + Wants */}
              <div className="grid gap-3 sm:grid-cols-2">
                {selected.teaches.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: 'var(--cream)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--orange-warm)' }}>{t('connection.teaches')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.teaches.map(s => (
                        <span key={s.id ?? s.name}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-white text-[#252840]">
                          {s.isMatch && <Star className="h-3 w-3 fill-current text-[color:var(--warm-strong)] text-[color:var(--warm-strong)]" />}
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.wants.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: 'var(--cream)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--learn)' }}>{t('connection.wants')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.wants.map(w => (
                        <span key={w} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold">{w}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Slot picker */}
              <div>
                <p className="text-sm font-bold text-[#252840]">{t('connection.availability')}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{t('connection.availabilityHint')}</p>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-[#E8DDC7]">
                  <table className="text-center text-sm" style={{ minWidth: '380px', width: '100%' }}>
                    <thead>
                      <tr style={{ background: 'var(--cream)' }}>
                        <th className="p-2" />
                        {DAYS.map(d => <th key={d.key} className="p-2 text-xs font-semibold text-[#252840]">{t(d.labelKey)}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {SLOTS.map(slot => (
                        <tr key={slot.key} className="border-t border-[#E8DDC7]">
                          <td className="p-2 text-left text-xs font-semibold text-[#252840]" style={{ background: 'var(--cream)', whiteSpace: 'nowrap' }}>{t(slot.labelKey)}</td>
                          {DAYS.map(day => {
                            const k   = `${day.key}_${slot.key}`
                            const avail = !!memberAvail[k]
                            const picked = !!pickedSlots[k]
                            return (
                              <td key={k} className="p-1.5">
                                <button
                                  disabled={!avail}
                                  onClick={() => setPickedSlots(p => ({ ...p, [k]: !p[k] }))}
                                  className="h-8 w-full rounded-lg text-xs font-semibold transition"
                                  style={{
                                    background: !avail ? 'var(--cream)' : picked ? 'var(--orange-warm)' : 'white',
                                    color: !avail ? 'rgba(117,107,91,0.4)' : picked ? 'white' : 'var(--ink)',
                                    cursor: avail ? 'pointer' : 'not-allowed',
                                    border: 'none',
                                    minWidth: '52px',
                                  }}
                                >
                                  {avail ? (picked ? '✓' : t('connection.free')) : t('member.unavailable')}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CTA */}
              {requested.has(selected.id) ? (
                <div className="rounded-2xl p-4 text-center text-sm font-semibold" style={{ background: 'rgba(63,107,76,0.10)', color: 'var(--learn)' }}>
                  Demande envoyée — tu recevras une notification.
                </div>
              ) : (
                <button
                  onClick={() => handleConnect(selected.id)}
                  disabled={!user}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full py-3 font-bold text-white transition hover:-translate-y-0.5 border-none cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--orange-warm)' }}
                >
                  <Send size={16} />
                  {!user ? t('connection.loginToBook') : t('connection.sendRequest')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <section className="relative overflow-hidden py-16" style={{ background: 'var(--cream)' }}>
        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--orange-warm)' }}>{t('connection.eyebrow')}</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t('connection.title')}
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('connection.searchPlaceholder')}
                  className="w-full rounded-full border border-[#E8DDC7] bg-white py-3 pl-11 pr-5 text-sm shadow-sm outline-none transition"
                  style={{ '--tw-ring-color': 'var(--orange-warm)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--orange-warm)'}
                  onBlur={e  => e.target.style.borderColor = '#E8DDC7'}
                />
              </div>
            </div>
          </Reveal>
          <Reveal delay={3}>
            <div className="mt-4 flex flex-wrap gap-2">
              {FILTERS.slice(0, 8).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition cursor-pointer border"
                  style={{
                    background: filter === f.key ? 'var(--ink)' : 'white',
                    color:      filter === f.key ? 'white' : 'var(--ink)',
                    borderColor: filter === f.key ? 'var(--ink)' : 'var(--border)',
                  }}
                >
                  {t(f.labelKey)}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-6 pb-3">
        <div className="inline-flex rounded-full border border-[#E8DDC7] p-1" style={{ background: 'var(--cream)' }}>
          {['discover', 'requests'].map(tabKey => {
            const active = tab === tabKey
            return (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className="rounded-full px-5 py-2 text-sm font-semibold border-none cursor-pointer transition-colors"
                style={{ background: active ? 'var(--ink)' : 'transparent', color: active ? 'white' : 'var(--muted-foreground)' }}
              >
                {tabKey === 'discover' ? t('connection.tabDiscover') : t('connection.tabRequests')}
                {tabKey === 'requests' && incoming.length > 0 ? ` (${incoming.length})` : ''}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <section className="relative py-8">
        <div className="relative mx-auto max-w-7xl px-6">

          {/* Requests tab */}
          {tab === 'requests' && (
            <div>
              {incoming.length === 0 ? (
                <p className="rounded-3xl bg-white p-8 text-center shadow-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Aucune demande en attente.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {incoming.map(m => (
                    <div key={m.id} className="rounded-3xl border border-[#E8DDC7] bg-white p-5 flex flex-col gap-3 sm:flex-row sm:items-center shadow-sm">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{ background: colorFor(m.requesterId) }}>
                          {(m.requester?.firstName?.[0] ?? '') + (m.requester?.lastName?.[0] ?? '')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#252840] truncate">{m.requester?.firstName} {m.requester?.lastName}</p>
                          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t('connection.wantsToConnect')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleAccept(m.id, m.requesterId)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-full text-white text-sm font-bold border-none cursor-pointer transition"
                          style={{ background: 'var(--learn)' }}>
                          Accepter
                        </button>
                        <button onClick={() => handleDecline(m.id)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-[#E8DDC7] text-sm font-semibold bg-transparent cursor-pointer hover:border-red-300 hover:text-red-500 transition"
                          style={{ color: 'var(--muted-foreground)' }}>
                          Décliner
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discover tab */}
          {tab === 'discover' && (
            <>
              {!user ? (
                <div className="text-center py-20">
                  <p className="text-lg font-semibold text-[#252840] mb-4">{t('connection.loginToSee')}</p>
                  <button onClick={() => openModal('login')}
                    className="px-6 py-3 rounded-full text-white font-bold border-none cursor-pointer transition"
                    style={{ background: 'var(--ink)' }}>
                    {t('nav.login')}
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <p className="rounded-3xl bg-white p-8 text-center shadow-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {t('connection.noMatch')}
                </p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((m, i) => (
                    <Reveal key={m.id} delay={(i % 4) + 1}>
                      <article className="card-lift flex h-full flex-col rounded-3xl bg-white p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                          <AvatarCircle user={m} name={`${m.firstName} ${m.lastName}`} color={m.color} />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-lg text-[#252840]">{m.firstName} {m.lastName}</h3>
                            {m.averageRating != null && (
                              <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                <Star className="h-3.5 w-3.5 fill-current" style={{ color: 'var(--orange-warm)' }} />
                                <span className="font-semibold text-[#252840]">{Number(m.averageRating).toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {m.bio && <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>{m.bio}</p>}

                        {m.teaches.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(37,40,64,0.6)' }}>{t('connection.teaches')}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {m.teaches.slice(0, 4).map(s => (
                                <span
                                  key={s.id ?? s.name}
                                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                                  style={{
                                    background: s.isMatch ? 'var(--orange-warm)' : 'var(--cream)',
                                    color: s.isMatch ? 'white' : 'var(--ink)',
                                  }}
                                >
                                  {s.isMatch && <Star className="h-3 w-3 fill-white" />}
                                  {s.name}
                                </span>
                              ))}
                              {m.teaches.length > 4 && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>+{m.teaches.length - 4}</span>}
                            </div>
                          </div>
                        )}

                        {m.score > 0 && (
                          <span className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-bold"
                            style={{ background: 'rgba(63,107,76,0.12)', color: 'var(--learn)' }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1.5 5l3 3 5-5"/></svg>
                            {t('connection.matchesGoals')}
                          </span>
                        )}

                        {requested.has(m.id) ? (
                          <div className="mt-5 w-full py-2.5 rounded-full text-sm font-bold text-center" style={{ background: 'rgba(63,107,76,0.10)', color: 'var(--learn)' }}>
                            {t('connection.requestSent')}
                          </div>
                        ) : (
                          <button
                            onClick={() => { if (!user) { openModal('login'); return }; setSelected(m) }}
                            className="mt-5 inline-flex items-center justify-center gap-2 self-stretch rounded-full py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 border-none cursor-pointer"
                            style={{ background: 'var(--orange-warm)' }}
                          >
                            {t('connection.book')}
                          </button>
                        )}
                      </article>
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
