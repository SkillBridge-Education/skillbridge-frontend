import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { sessionApi } from '../services/api'
import api from '../services/api'
import { useToast } from '../components/Toast'
import CreditIcon from '../components/CreditIcon'

const STATUS_STYLE = {
  PENDING_CONFIRMATION: { bg: 'bg-[rgba(200,134,75,0.12)]', text: 'text-[#C8864B]', label: 'En attente' },
  SCHEDULED:            { bg: 'bg-[rgba(61,92,40,0.12)]',   text: 'text-[#3D5C28]', label: 'À venir'     },
  ACTIVE:               { bg: 'bg-[rgba(200,134,75,0.15)]', text: 'text-[#C8864B]', label: 'En direct'   },
  COMPLETED:            { bg: 'bg-[rgba(37,40,64,0.1)]',    text: 'text-[#252840]', label: 'Terminée'    },
  CANCELLED:            { bg: 'bg-red-50',                  text: 'text-red-500',   label: 'Refusée'     },
}

function CalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="1" y="3" width="12" height="10" rx="2"/><path d="M1 6h12M5 1v3M9 1v3"/>
    </svg>
  )
}

function EditSessionModal({ session, onClose, onSaved }) {
  const addToast  = useToast()
  const [saving,   setSaving]   = useState(false)
  const [duration, setDuration] = useState(String(session.creditsReserved))
  const [title,    setTitle]    = useState(session.title ?? '')
  const [dateVal,  setDateVal]  = useState(
    session.startsAt ? new Date(session.startsAt).toISOString().slice(0, 16) : ''
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    const dur = parseInt(duration, 10)
    if (!Number.isInteger(dur) || dur <= 0) {
      addToast?.('La durée doit être un entier positif', 'error')
      return
    }
    setSaving(true)
    try {
      await sessionApi.update(session.id, {
        estimatedDuration: dur,
        scheduledAt: dateVal ? new Date(dateVal).toISOString() : undefined,
        title: title.trim() || undefined,
      })
      addToast?.('Session re-proposée', 'success')
      onSaved()
      onClose()
    } catch (e) {
      addToast?.(e.response?.data?.message || 'Erreur lors de la modification', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-[440px] max-w-full shadow-soft border border-[#E8DDC7] animate-fade-up"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-[#252840]">Modifier et re-proposer</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F8F4EA] border-none cursor-pointer text-[#756B5B] flex items-center justify-center hover:bg-[#E8DDC7] transition-colors flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#756B5B] block mb-1">Titre</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={session.title}
              className="w-full h-10 px-4 rounded-2xl border border-[#E8DDC7] bg-[#FDFAF4] text-sm outline-none focus:border-[#C8864B] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#756B5B] block mb-1">Durée (crédits)</label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-full h-10 px-4 rounded-2xl border border-[#E8DDC7] bg-[#FDFAF4] text-sm outline-none focus:border-[#C8864B] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#756B5B] block mb-1">Date et heure</label>
            <input
              type="datetime-local"
              value={dateVal}
              onChange={e => setDateVal(e.target.value)}
              className="w-full h-10 px-4 rounded-2xl border border-[#E8DDC7] bg-[#FDFAF4] text-sm outline-none focus:border-[#C8864B] transition-colors"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-full bg-[#C8864B] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#B07030] transition-colors disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Re-proposer'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-3 rounded-full border border-[#E8DDC7] text-[#756B5B] text-sm font-semibold bg-transparent cursor-pointer hover:border-[#252840] transition-colors">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SessionDetailModal({ session, user, onClose, onAction }) {
  const [joining,       setJoining]       = useState(false)
  const [acting,        setActing]        = useState(null)
  const [learnerCredits, setLearnerCredits] = useState(null)
  const addToast = useToast()
  const navigate = useNavigate()

  const isTeacher   = session.teacher?.id === user?.id
  const partner     = isTeacher ? session.learner : session.teacher
  const partnerName = `${partner?.firstName ?? ''} ${partner?.lastName ?? ''}`.trim()
  const st          = STATUS_STYLE[session.status] ?? STATUS_STYLE.SCHEDULED
  const canJoin     = session.status === 'SCHEDULED' || session.status === 'ACTIVE'

  const isLearnerPending = !isTeacher && session.status === 'PENDING_CONFIRMATION'
  const hasEnoughCredits = learnerCredits === null || learnerCredits >= session.creditsReserved

  useEffect(() => {
    if (!isLearnerPending) return
    api.get('/users/me')
      .then(res => setLearnerCredits(res.data.user?.credits ?? res.data.credits ?? null))
      .catch(() => {})
  }, [isLearnerPending])

  const handleJoin = async () => {
    setJoining(true)
    try {
      await api.post(`/sessions/${session.id}/join`)
      navigate(`/sessions/${session.id}`)
    } catch (e) {
      addToast?.(e.response?.data?.message || 'Impossible de rejoindre', 'error')
    } finally { setJoining(false) }
  }

  const handleAccept = async () => {
    setActing('accept')
    try {
      await sessionApi.accept(session.id)
      // Refresh learner balance in the auth store
      const meRes = await api.get('/users/me')
      const updatedUser = meRes.data.user ?? meRes.data
      if (updatedUser) useAuthStore.getState().setUser(updatedUser)
      addToast?.('Session acceptée', 'success')
      onAction()
      onClose()
    } catch (e) {
      addToast?.(e.response?.data?.message || 'Erreur', 'error')
    } finally { setActing(null) }
  }

  const handleRefuse = async () => {
    setActing('refuse')
    try {
      await sessionApi.refuse(session.id)
      addToast?.('Session refusée', 'info')
      onAction()
      onClose()
    } catch (e) {
      addToast?.(e.response?.data?.message || 'Erreur', 'error')
    } finally { setActing(null) }
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('fr', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-[440px] max-w-full shadow-soft border border-[#E8DDC7] animate-fade-up"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-[#252840] truncate pr-4">{session.title || 'Session'}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F8F4EA] border-none cursor-pointer text-[#756B5B] flex items-center justify-center hover:bg-[#E8DDC7] transition-colors flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-[#F8F4EA]">
          <div className="h-12 w-12 rounded-full bg-[#252840] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
            {partner?.firstName?.[0]}{partner?.lastName?.[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-[#252840]">{partnerName || '—'}</p>
            <p className="text-xs text-[#756B5B]">{isTeacher ? 'Apprenant' : 'Enseignant'}</p>
          </div>
        </div>

        {isLearnerPending && (
          <div className="mb-5 p-4 rounded-2xl bg-[rgba(200,134,75,0.08)] border border-[rgba(200,134,75,0.25)]">
            <p className="text-sm font-semibold text-[#C8864B] mb-1">Proposition en attente</p>
            <p className="text-xs text-[#756B5B] mb-2">
              {session.creditsReserved} crédits seront réservés sur ton solde si tu acceptes.
            </p>
            {learnerCredits !== null && (
              <p className="text-xs text-[#756B5B]">
                Ton solde actuel : <span className={`font-bold ${hasEnoughCredits ? 'text-[#3D5C28]' : 'text-red-500'}`}>{learnerCredits} cr</span>
              </p>
            )}
            {!hasEnoughCredits && (
              <p className="text-xs text-red-600 font-semibold mt-2 bg-red-50 rounded-lg px-3 py-2">
                Tu n'as pas assez de crédits pour accepter.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-6">
          {[
            { label: 'Date',             value: formatDate(session.startsAt) },
            { label: 'Durée estimée',    value: `${session.creditsReserved} min` },
            { label: 'Crédits réservés', value: `${session.creditsReserved} cr` },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#F0EAE0] last:border-0">
              <span className="text-xs text-[#756B5B] font-medium">{row.label}</span>
              <span className="text-sm font-semibold text-[#252840]">{row.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-[#756B5B] font-medium">Statut</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.bg} ${st.text}`}>{st.label}</span>
          </div>
        </div>

        {isLearnerPending ? (
          <div className="flex gap-3">
            <button onClick={handleAccept} disabled={!!acting || !hasEnoughCredits}
              className="flex-1 py-3 rounded-full bg-[#3D5C28] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#2D4A1E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {acting === 'accept' ? 'Acceptation…' : 'Accepter'}
            </button>
            <button onClick={handleRefuse} disabled={!!acting}
              className="flex-1 py-3 rounded-full border-2 border-red-400 text-red-500 text-sm font-bold bg-transparent cursor-pointer hover:bg-red-50 transition-colors disabled:opacity-50">
              {acting === 'refuse' ? 'Refus…' : 'Refuser'}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            {canJoin && (
              <button onClick={handleJoin} disabled={joining}
                className="flex-1 py-3 rounded-full bg-[#C8864B] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#B07030] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="1" y="3" width="9" height="9" rx="2"/><path d="M10 5l4-2v8l-4-2"/>
                </svg>
                {joining ? 'Connexion…' : 'Rejoindre'}
              </button>
            )}
            <button onClick={() => { navigate(`/sessions/${session.id}`); onClose() }}
              className={`${canJoin ? 'px-5' : 'flex-1'} py-3 rounded-full border-2 border-[#252840] text-[#252840] text-sm font-bold bg-transparent cursor-pointer hover:bg-[#252840] hover:text-white transition-colors`}>
              Ouvrir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Sessions() {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  const addToast  = useToast()

  const [sessions,   setSessions]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [tab,        setTab]        = useState('teach')
  const [confirmId,  setConfirmId]  = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [selected,   setSelected]   = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  const loadSessions = useCallback(async () => {
    if (!user) return
    try {
      const data = await sessionApi.list()
      setSessions(data)
      setError('')
    } catch (e) {
      if (sessions.length === 0) setError(e.response?.data?.message || 'Erreur de chargement')
    } finally { setLoading(false) }
  }, [user])

  useEffect(() => {
    loadSessions()
    const id = setInterval(loadSessions, 3000)
    return () => clearInterval(id)
  }, [loadSessions])

  const handleCancel = async (sessionId) => {
    setCancelling(sessionId)
    try {
      await api.post(`/sessions/${sessionId}/end`, { durationSeconds: 0 })
      setConfirmId(null)
      loadSessions()
      addToast?.('Session annulée', 'info')
    } catch (e) {
      addToast?.(e.response?.data?.message || "Erreur lors de l'annulation", 'error')
    } finally { setCancelling(null) }
  }

  const teaching = sessions.filter(s => s.teacher?.id === user?.id)
  const learning = sessions.filter(s => s.learner?.id  === user?.id)
  const list     = tab === 'teach' ? teaching : learning

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('fr', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)' }}>

      {selected && (
        <SessionDetailModal
          session={selected}
          user={user}
          onClose={() => setSelected(null)}
          onAction={loadSessions}
        />
      )}

      {editTarget && (
        <EditSessionModal
          session={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={loadSessions}
        />
      )}

      {confirmId && (
        <div className="fixed inset-0 z-[500] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-[400px] max-w-full shadow-soft border border-[#E8DDC7]">
            <h2 className="text-lg font-black text-[#252840] mb-2">Annuler cette séance ?</h2>
            <p className="text-sm text-[#756B5B] mb-6">
              La séance sera marquée comme annulée. Les crédits réservés seront remboursés.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleCancel(confirmId)} disabled={!!cancelling}
                className="flex-1 py-3 rounded-full bg-red-500 text-white text-sm font-bold border-none cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-50">
                {cancelling ? 'Annulation…' : "Confirmer l'annulation"}
              </button>
              <button onClick={() => setConfirmId(null)}
                className="px-5 py-3 rounded-full border border-[#E8DDC7] text-[#756B5B] text-sm font-semibold bg-transparent cursor-pointer hover:border-[#252840] transition-colors">
                Retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <section className="bg-white border-b border-[#E8DDC7] py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--orange-warm)' }}>
            Tes sessions
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
            <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--ink)' }}>
              À l'agenda
            </h1>
            <button onClick={() => navigate('/sessions/new')}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white border-none cursor-pointer w-fit transition hover:-translate-y-0.5"
              style={{ background: 'var(--orange-warm)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M7 1v12M1 7h12"/>
              </svg>
              Nouvelle session
            </button>
          </div>

          <div className="inline-flex rounded-full border border-[#E8DDC7] bg-[#F8F4EA] p-1 shadow-sm">
            <button onClick={() => setTab('teach')}
              className={`rounded-full px-6 py-2.5 text-sm font-bold border-none cursor-pointer transition-all ${
                tab === 'teach' ? 'bg-[#C8864B] text-white shadow-sm' : 'bg-transparent text-[#756B5B] hover:text-[#252840]'
              }`}>
              J'enseigne
            </button>
            <button onClick={() => setTab('learn')}
              className={`rounded-full px-6 py-2.5 text-sm font-bold border-none cursor-pointer transition-all ${
                tab === 'learn' ? 'bg-[#3D5C28] text-white shadow-sm' : 'bg-transparent text-[#756B5B] hover:text-[#252840]'
              }`}>
              Je reçois
            </button>
          </div>
        </div>
      </section>

      {/* Cards */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[rgba(37,40,64,0.2)] border-t-[#252840] rounded-full animate-spin" />
          </div>
        )}

        {!loading && list.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#E8DDC7] bg-white p-12 text-center">
            <p className="text-lg font-semibold text-[#252840] mb-2">
              {tab === 'teach' ? 'Aucune session à donner' : 'Aucune session à recevoir'}
            </p>
            <p className="text-sm text-[#756B5B] mb-6">
              {tab === 'teach'
                ? "Créez une session avec l'un de vos pairs connectés."
                : 'Demandez à un pair de planifier une session avec vous.'}
            </p>
            <button onClick={() => navigate('/sessions/new')}
              className="px-6 py-3 rounded-full bg-[#252840] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-colors">
              + Nouvelle session
            </button>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(s => {
            const partner     = tab === 'teach' ? s.learner : s.teacher
            const partnerName = `${partner?.firstName ?? ''} ${partner?.lastName ?? ''}`.trim()
            const st          = STATUS_STYLE[s.status] ?? STATUS_STYLE.SCHEDULED
            const isLive      = s.status === 'ACTIVE'
            const isCancelled = s.status === 'CANCELLED'
            const isPending   = s.status === 'PENDING_CONFIRMATION'
            const isTeacher   = s.teacher?.id === user?.id
            const canCancel   = isTeacher && (s.status === 'SCHEDULED' || s.status === 'ACTIVE')
            const canEdit     = isTeacher && (isCancelled || isPending)
            const isLearnerPending = !isTeacher && isPending

            return (
              <article
                key={s.id}
                className={`card-lift rounded-3xl bg-white p-6 shadow-sm transition-all ${
                  isPending ? 'ring-2 ring-[#C8864B]' : isLive ? 'ring-2 ring-[#3D5C28]' : ''
                } ${isCancelled ? 'opacity-60' : 'cursor-pointer'}`}
                onClick={() => setSelected(s)}
              >
                {/* Status + credits */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.bg} ${st.text}`}>{st.label}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F8F4EA] px-3 py-1 text-xs font-bold text-[#252840]">
                    <CreditIcon size="sm" /> {s.creditsReserved} cr
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-[#252840] text-base leading-tight mb-3">{s.title || 'Session'}</h3>

                {/* Partner */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: isLive ? '#3D5C28' : isPending ? '#C8864B' : '#252840' }}>
                    {partner?.firstName?.[0]}{partner?.lastName?.[0]}
                  </div>
                  <div className="text-sm min-w-0">
                    <p className="font-semibold text-[#252840] truncate">{partnerName || '—'}</p>
                    <p className="text-xs text-[#756B5B]">{tab === 'teach' ? 'tu enseignes' : 'tu apprends'}</p>
                  </div>
                </div>

                {/* Date + actions */}
                <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#756B5B]">
                    <CalIcon /> {formatDate(s.startsAt)}
                  </span>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {isLive && (
                      <button onClick={e => { e.stopPropagation(); navigate(`/sessions/${s.id}`) }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#C8864B] px-3 py-1.5 text-xs font-bold text-white border-none cursor-pointer hover:bg-[#B07030] transition-colors">
                        Rejoindre
                      </button>
                    )}
                    {isLearnerPending && (
                      <>
                        <button onClick={e => { e.stopPropagation(); setSelected(s) }}
                          className="rounded-full bg-[#3D5C28] px-3 py-1.5 text-xs font-bold text-white border-none cursor-pointer hover:bg-[#2D4A1E] transition-colors">
                          Répondre
                        </button>
                      </>
                    )}
                    {canEdit && (
                      <button onClick={e => { e.stopPropagation(); setEditTarget(s) }}
                        className="rounded-full border border-[#C8864B] px-3 py-1.5 text-xs font-semibold text-[#C8864B] bg-transparent cursor-pointer hover:bg-[rgba(200,134,75,0.08)] transition-colors">
                        Modifier
                      </button>
                    )}
                    {canCancel && (
                      <button onClick={e => { e.stopPropagation(); setConfirmId(s.id) }}
                        className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 bg-transparent cursor-pointer hover:bg-red-50 transition-colors">
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}
