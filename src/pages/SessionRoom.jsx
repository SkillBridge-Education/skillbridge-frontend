import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import { useToast } from '../components/Toast'
import CreditIcon from '../components/CreditIcon'
import { GROUP_SESSIONS_ENABLED } from '../config/features'

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function SessionRoom() {
  const { t }       = useTranslation()
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { user, setUser } = useAuthStore()
  const addToast    = useToast()
  const iframeRef   = useRef(null)
  const intervalRef = useRef(null)
  const pollRef     = useRef(null)

  const [session,          setSession]          = useState(null)
  const [phase,            setPhase]            = useState('waiting')
  const [seconds,          setSeconds]          = useState(0)
  const [credits,          setCredits]          = useState(user?.credits ?? 120)
  const [endResult,        setEndResult]        = useState(null)
  const [rating,           setRating]           = useState(0)
  const [ratingSubmitted,  setRatingSubmitted]  = useState(false)
  const [loadError,        setLoadError]        = useState('')
  const [joining,          setJoining]          = useState(false)
  const [adminParticipants,setAdminParticipants] = useState([])
  const [sessionLocked,    setSessionLocked]    = useState(false)
  const [editMaxPart,      setEditMaxPart]      = useState('')

  const loadSession = async () => {
    try {
      const res = await api.get(`/sessions/${id}`)
      const s = res.data.session ?? res.data
      return {
        id:               s.id,
        title:            s.title ?? t('sessions.fallbackTitle'),
        duration:         s.creditsReserved ?? 60,
        myRole:           s.teacher?.id === user?.id ? 'teacher' : 'learner',
        teacherName:      `${s.teacher?.firstName ?? ''} ${s.teacher?.lastName ?? ''}`.trim(),
        studentName:      `${s.learner?.firstName ?? ''} ${s.learner?.lastName ?? ''}`.trim(),
        teacherId:        s.teacher?.id,
        learnerId:        s.learner?.id,
        jitsiRoomId:      s.jitsiRoomId,
        status:           s.status,
        isOpen:           s.isOpen ?? false,
        maxParticipants:  s.maxParticipants ?? null,
        participantCount: s.participants?.length ?? s.participantCount ?? (s.isOpen ? 1 : null),
        participants:     s.participants ?? [],
      }
    } catch {
      setLoadError('Session introuvable ou accès refusé.')
      return null
    }
  }

  useEffect(() => {
    loadSession().then(s => { if (s) setSession(s) })
  }, [id, user?.id])

  useEffect(() => {
    if (!session || phase !== 'waiting' || session.myRole === 'teacher') return
    pollRef.current = setInterval(async () => {
      const s = await loadSession()
      if (s?.status === 'ACTIVE') {
        clearInterval(pollRef.current)
        launchJitsi(s.jitsiRoomId)
      }
    }, 2000)
    return () => clearInterval(pollRef.current)
  }, [session?.id, phase])

  useEffect(() => {
    if (phase === 'active') {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [phase])

  useEffect(() => {
    return () => { clearInterval(intervalRef.current); clearInterval(pollRef.current) }
  }, [])

  const isTeacher   = session?.myRole === 'teacher'
  const cost        = Math.ceil(seconds / 60)
  const creditDelta = isTeacher ? `+${cost}` : `-${cost}`

  const launchJitsi = (roomName) => {
    if (!iframeRef.current) return
    const displayName = encodeURIComponent(`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim())
    const params = [
      'config.prejoinPageEnabled=false',
      'config.startWithAudioMuted=false',
      'config.startWithVideoMuted=false',
      'config.disableDeepLinking=true',
      'config.enableWelcomePage=false',
      'config.enableLobbyChat=false',
      'config.requireDisplayName=false',
      'config.disableInviteFunctions=true',
      'interfaceConfig.SHOW_JITSI_WATERMARK=false',
      'interfaceConfig.TOOLBAR_ALWAYS_VISIBLE=true',
      'interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true',
      `userInfo.displayName=${displayName}`,
    ].join('&')
    iframeRef.current.src = `https://meet.jit.si/${roomName}#${params}`
    setTimeout(() => setPhase('active'), 2000)
  }

  const startJitsi = async () => {
    if (!session || joining) return
    setJoining(true)
    let roomName = session.jitsiRoomId ?? `skillbridge-${id}`
    try {
      const res = await api.post(`/sessions/${id}/join`)
      if (res.data.jitsiRoomId) roomName = res.data.jitsiRoomId
    } catch (e) { console.warn('join error:', e) }
    launchJitsi(roomName)
    setJoining(false)
  }

  const sendJitsiCmd = (type, payload = {}) => {
    try { iframeRef.current?.contentWindow?.postMessage({ type, ...payload }, '*') }
    catch (e) { console.warn('Jitsi postMessage failed:', type, e) }
  }

  const lockSession = () => {
    setSessionLocked(l => !l)
    sendJitsiCmd('toggleLobby', { enabled: !sessionLocked })
  }

  const submitRating = async () => {
    if (!rating || ratingSubmitted) return
    const reviewedUserId = isTeacher ? session.learnerId : session.teacherId
    if (!reviewedUserId) {
      addToast?.(t('sessionRoom.toasts.noParticipant'), 'error')
      return
    }
    try {
      await api.post(`/sessions/${id}/rating`, { reviewedUserId, rating: Number(rating) })
      setRatingSubmitted(true)
      addToast?.(t('sessionRoom.toasts.ratingSent'), 'success')
    } catch (e) {
      addToast?.(t('sessionRoom.toasts.ratingError'), 'error')
    }
  }

  const handleEndSession = async () => {
    if (iframeRef.current) iframeRef.current.src = 'about:blank'
    clearInterval(intervalRef.current)
    clearInterval(pollRef.current)
    try {
      const res = await api.post(`/sessions/${id}/end`, { durationSeconds: seconds })
      setEndResult({
        creditsToTeacher: res.data.teacherCreditsPaid    ?? null,
        creditsRefunded:  res.data.learnerCreditsRefunded ?? null,
      })
      // Rafraîchir le solde dans la navbar
      api.get('/users/me').then(r => {
        const u = r.data.user ?? r.data
        if (u) setUser(u)
      }).catch(() => {})
    } catch (e) { console.warn('end error:', e) }
    setPhase('ended')
  }

  if (loadError) return (
    <main className="min-h-screen bg-[#1A1410] flex flex-col items-center justify-center gap-4">
      <p className="text-white/60">{loadError}</p>
      <button onClick={() => navigate('/sessions')}
        className="px-6 py-3 rounded-full bg-[#252840] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-colors">
        Retour aux sessions
      </button>
    </main>
  )

  if (!session) return (
    <main className="min-h-screen bg-[#1A1410] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white/50 text-sm">{t('sessionRoom.loading')}</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#1A1410] flex flex-col">

      {/* Top bar */}
      <div className="bg-[#1A1410] border-b border-white/[0.07] px-5 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => { if (phase === 'active') handleEndSession(); else navigate('/sessions') }}
          className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 3L5 8l5 5"/>
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{session.title}</p>
          <p className="text-white/40 text-xs">
            {t('sessionRoom.with', { name: isTeacher ? session.studentName : session.teacherName })}
          </p>
        </div>

        {phase === 'active' && (
          <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
            <span className="text-white font-black text-lg tabular-nums font-mono">{fmt(seconds)}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 rounded-full bg-[rgba(200,134,75,0.2)] border border-[rgba(200,134,75,0.25)] px-3 py-2">
          <CreditIcon size="sm" />
          <span className="text-[#C8864B] font-bold text-sm">{Math.floor(credits)} cr</span>
          {phase === 'active' && (
            <span className={`text-xs font-bold ${isTeacher ? 'text-[#86C46E]' : 'text-[#C8864B]'}`}>{creditDelta}</span>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Video zone */}
        <div className="flex-1 relative bg-[#1A1410]">
          <iframe
            ref={iframeRef}
            src="about:blank"
            allow="camera; microphone; display-capture; autoplay; clipboard-write"
            title="Jitsi Meet"
            className="absolute inset-0 w-full h-full border-0"
            style={{ display: phase === 'active' ? 'block' : 'none' }}
          />

          {/* Waiting screen */}
          {phase === 'waiting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-4">
              <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="7" width="22" height="22" rx="4"/>
                  <path d="M25 14l8-5v18l-8-5"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xl mb-2">{session.title}</p>
                <p className="text-white/50 text-sm mb-1">
                  {isTeacher ? `Receveur : ${session.studentName}` : `Donneur : ${session.teacherName}`}
                </p>
                <p className="text-white/40 text-xs">{session.duration} crédits réservés</p>
              </div>
              {isTeacher ? (
                <button onClick={startJitsi} disabled={joining}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#3D5C28] text-white font-bold border-none cursor-pointer hover:bg-[#4E6035] transition-colors disabled:opacity-40">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="2" y="5" width="13" height="13" rx="3"/><path d="M15 8l5-3v10l-5-3"/>
                  </svg>
                  {joining ? t('sessionRoom.joining') : t('sessionRoom.start')}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3 rounded-full bg-white/5 border border-white/10 px-6 py-3">
                    <div className="w-2 h-2 rounded-full bg-[#C8864B] animate-pulse" />
                    <span className="text-white/70 text-sm">{t('sessionRoom.waitingHost')}</span>
                  </div>
                  <button onClick={startJitsi} disabled={joining}
                    className="px-6 py-3 rounded-full border border-white/20 text-white text-sm font-semibold bg-transparent cursor-pointer hover:border-white transition-colors disabled:opacity-40">
                    {joining ? t('sessionRoom.joining') : t('sessionRoom.joinNow')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* End screen */}
          {phase === 'ended' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-4">
              <div className="h-16 w-16 rounded-full bg-[#3D5C28]/30 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#86C46E" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 14l6 6L23 8"/>
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-white mb-2">{t('sessionRoom.endedTitle')}</h2>
                <p className="text-white/60 text-sm">{t('sessionRoom.endedText')}</p>
              </div>

              {/* Recap cards */}
              <div className="flex gap-3 flex-wrap justify-center">
                <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-center">
                  <p className="text-white/40 text-xs mb-1">{t('sessionRoom.duration')}</p>
                  <p className="text-white font-black text-xl font-mono">{fmt(seconds)}</p>
                </div>
                {endResult?.creditsToTeacher != null ? (
                  <div className={`rounded-2xl border border-white/10 px-5 py-4 text-center ${isTeacher ? 'bg-[rgba(61,92,40,0.2)]' : 'bg-[rgba(200,134,75,0.15)]'}`}>
                    <p className="text-white/40 text-xs mb-1">{t('sessionRoom.creditsPaid')}</p>
                    <p className="text-[#86C46E] font-black text-xl">+{endResult.creditsToTeacher}</p>
                  </div>
                ) : (
                  <div className={`rounded-2xl border border-white/10 px-5 py-4 text-center ${isTeacher ? 'bg-[rgba(61,92,40,0.2)]' : 'bg-[rgba(200,134,75,0.15)]'}`}>
                    <p className="text-white/40 text-xs mb-1">{isTeacher ? t('sessionRoom.creditsEarned') : t('sessionRoom.creditsSpent')}</p>
                    <p className={`font-black text-xl ${isTeacher ? 'text-[#86C46E]' : 'text-[#C8864B]'}`}>{isTeacher ? '+' : '-'}{cost}</p>
                  </div>
                )}
                <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-center">
                  <p className="text-white/40 text-xs mb-1">{t('sessionRoom.remainingBalance')}</p>
                  <p className="text-white font-black text-xl">{Math.max(0, Math.floor(credits))} cr</p>
                </div>
              </div>

              {/* Remboursement prorata */}
              {endResult?.creditsRefunded != null && endResult.creditsRefunded > 0 && (
                <div className="flex items-center gap-2 bg-[rgba(61,92,40,0.25)] border border-[rgba(134,196,110,0.3)] px-5 py-3 rounded-2xl">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#86C46E" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 8l4 4 8-8"/>
                  </svg>
                  <p className="text-[#86C46E] text-sm font-semibold">
                    {t('sessionRoom.refunded', { count: endResult.creditsRefunded })}
                  </p>
                </div>
              )}

              {!isTeacher && (
                <div className="text-center">
                  {ratingSubmitted ? (
                    <div className="flex items-center gap-2 bg-[#3D5C28]/20 px-5 py-3 rounded-full">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#86C46E" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3 3 7-6"/></svg>
                      <p className="text-[#86C46E] text-sm font-bold">{t('sessionRoom.thanksRating')}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-white/60 text-sm mb-3">{t('sessionRoom.rateSession')}</p>
                      <div className="flex gap-1 justify-center mb-3">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => setRating(s)}
                            className={`cursor-pointer transition-all border-none bg-transparent p-0.5 ${s <= rating ? 'text-[#C8864B]' : 'text-white/20 hover:text-white/50'}`}>
                            <svg width="28" height="28" viewBox="0 0 28 28" fill={s <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="14,3 17.5,10 25,11 19.5,16.5 21,24 14,20.5 7,24 8.5,16.5 3,11 10.5,10"/></svg>
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <button onClick={submitRating}
                          className="px-6 py-2 rounded-full bg-[#252840] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-colors">
                          Envoyer
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              <button onClick={() => navigate('/sessions')}
                className="px-8 py-3 rounded-full bg-warm-strong text-white font-bold border-none cursor-pointer hover:bg-warm-dk transition-colors">
                {t('sessionRoom.backToSessions')}
              </button>
            </div>
          )}

          {/* End button when active */}
          {phase === 'active' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <button onClick={handleEndSession}
                className="px-6 py-3 rounded-full bg-red-500 text-white font-bold border-none cursor-pointer hover:bg-red-600 transition-colors shadow-soft">
                {t('sessionRoom.endSession')}
              </button>
            </div>
          )}
        </div>

        {/* Admin sidebar */}
        {phase === 'active' && isTeacher && (
          <div className="w-64 bg-[#1A1410] border-l border-white/[0.07] flex flex-col p-4 gap-4 flex-shrink-0 overflow-y-auto">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 mb-4">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#C8864B" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M15 14v-1.3a2.7 2.7 0 0 0-2-2.6M11 1.2a2.7 2.7 0 0 1 0 5.2M1 14v-1.3a2.7 2.7 0 0 1 2.7-2.7h4.6A2.7 2.7 0 0 1 11 12.7V14"/>
                  <circle cx="6.5" cy="4" r="2.7"/>
                </svg>
                <span className="text-[#C8864B] text-xs font-bold uppercase tracking-wide">{t('sessionRoom.hostPanel')}</span>
              </div>

              {/* Mute all */}
              <button
                onClick={() => sendJitsiCmd('muteEveryone')}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold border-none cursor-pointer transition-colors flex items-center justify-center gap-2 mb-2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M6 1v5a2 2 0 0 1-4 0V1M1 6a5 5 0 0 0 10 0M6 11v1"/>
                  <line x1="1" y1="1" x2="11" y2="11"/>
                </svg>
                Couper tous les micros
              </button>

              {/* Lock */}
              <button onClick={lockSession}
                className={`w-full py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition-colors flex items-center justify-center gap-2 mb-4 ${
                  sessionLocked ? 'bg-[rgba(200,134,75,0.25)] text-[#C8864B] hover:bg-[rgba(200,134,75,0.35)]' : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <rect x="2" y="5.5" width="8" height="5.5" rx="1.5"/>
                  <path d="M4 5.5V3.5a2 2 0 0 1 4 0v2"/>
                </svg>
                {sessionLocked ? t('sessionRoom.unlock') : t('sessionRoom.lock')}
              </button>

              {/* Max participants */}
              {GROUP_SESSIONS_ENABLED && session.isOpen && (
                <div className="mb-4">
                  <p className="text-white/40 text-[10px] mb-1.5">{t('sessionRoom.participantLimit')}</p>
                  <div className="flex gap-2">
                    <input type="number" min="2" max="50"
                      placeholder={String(session.maxParticipants ?? '∞')}
                      value={editMaxPart}
                      onChange={e => setEditMaxPart(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 text-white text-xs border border-white/10 outline-none focus:border-white/30 w-0" />
                    <button
                      onClick={async () => {
                        if (!editMaxPart) return
                        try { await api.patch(`/sessions/${id}`, { maxParticipants: Number(editMaxPart) }) }
                        catch (e) { addToast?.(t('sessionRoom.toasts.limitError'), 'error') }
                        setEditMaxPart('')
                      }}
                      className="px-2 py-1.5 rounded-lg bg-[#252840] text-white text-xs font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-colors flex-shrink-0">
                      OK
                    </button>
                  </div>
                </div>
              )}

              {/* Participants list */}
              {adminParticipants.length > 0 && (
                <div>
                  <p className="text-white/40 text-[10px] mb-2">{t('sessionRoom.connectedParticipants')}</p>
                  <div className="flex flex-col gap-1">
                    {adminParticipants.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                        <span className="text-white/70 text-xs truncate">{p.firstName ?? p.name ?? p.id}</span>
                        <button onClick={() => sendJitsiCmd('kick', { id: p.id })}
                          className="text-red-400 bg-transparent border-none cursor-pointer hover:text-red-300 flex-shrink-0 ml-2 p-0">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l8 8M9 1L1 9"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Session info */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wide mb-3">Info session</p>
              {[
                { label: t('sessionRoom.duration'), value: fmt(seconds) },
                { label: t('sessionRoom.role'),     value: t('sessionRoom.roleTeacher') },
                { label: t('sessionRoom.reserved'), value: t('sessionRoom.credits', { count: session.duration }) },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-white/40 text-xs">{row.label}</span>
                  <span className="text-white text-xs font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info sidebar for learner when active */}
        {phase === 'active' && !isTeacher && (
          <div className="w-56 bg-[#1A1410] border-l border-white/[0.07] flex flex-col p-4 gap-4 flex-shrink-0">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wide mb-3">Info session</p>
              {[
                { label: t('sessionRoom.duration'), value: fmt(seconds) },
                { label: t('sessionRoom.role'),     value: t('sessionRoom.roleLearner') },
                { label: t('sessionRoom.reserved'), value: t('sessionRoom.credits', { count: session.duration }) },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-white/40 text-xs">{row.label}</span>
                  <span className="text-white text-xs font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
