import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { ArrowDownLeft, ArrowUpRight, Coins } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import Reveal from '../components/Reveal'

const LIMIT = 500

export default function Credits() {
  const navigate  = useNavigate()
  const { t, i18n } = useTranslation()
  const { user }  = useAuthStore()
  const balance   = user?.credits ?? 0
  const pct       = Math.min(Math.round((balance / LIMIT) * 100), 100)
  const atLimit   = balance >= LIMIT

  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) return
    api.get('/sessions/mine')
      .then(res => setSessions(res.data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const completed   = sessions.filter(s => s.status === 'COMPLETED')
  const asTeacher   = completed.filter(s => s.teacher?.id === user?.id)
  const asLearner   = completed.filter(s => s.learner?.id  === user?.id)
  const totalEarned = asTeacher.reduce((a, s) => a + (s.creditsConsumed ?? 0), 0)
  const totalSpent  = asLearner.reduce((a, s) => a + (s.creditsConsumed ?? 0), 0)

  const history = [...completed]
    .sort((a, b) => new Date(b.actualEndedAt || b.startsAt) - new Date(a.actualEndedAt || a.startsAt))
    .map(s => {
      const isTeacher   = s.teacher?.id === user?.id
      const partner     = isTeacher ? s.learner : s.teacher
      const amount      = isTeacher ? (s.creditsConsumed ?? 0) : -(s.creditsConsumed ?? 0)
      const partnerName = `${partner?.firstName ?? ''} ${partner?.lastName ?? ''}`.trim() || '—'
      const date        = s.actualEndedAt
        ? new Date(s.actualEndedAt).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' })
        : '—'
      return { id: s.id, label: s.title || t('credits.session'), amount, with: partnerName, date }
    })

  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)' }}>

      {/* Dark hero banner — no FloatingDecor */}
      <section className="relative overflow-hidden py-16 text-white" style={{ background: 'var(--ink)' }}>
        <div className="relative mx-auto max-w-3xl px-6">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--orange-warm)' }}>
              {t('credits.eyebrow')}
            </p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-3 text-5xl font-extrabold tracking-tight sm:text-6xl">
              {balance} <span style={{ color: 'var(--orange-warm)' }}>{t('credits.titleUnit')}</span>
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-2 text-white/75">
              <Trans i18nKey="credits.subtitle" values={{ count: balance }} components={{ strong: <strong /> }} />
            </p>
          </Reveal>

          {atLimit && (
            <Reveal delay={2}>
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl px-5 py-4"
                style={{ background: 'rgba(201,134,75,0.15)', border: '1px solid var(--orange-warm)' }}>
                <p className="text-sm font-semibold text-white/90">
                  {t('credits.capReached')}
                </p>
                <button onClick={() => navigate('/connection')}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-white text-sm font-bold border-none cursor-pointer transition hover:-translate-y-0.5"
                  style={{ background: 'var(--orange-warm)' }}>
                  {t('credits.findSomeone')}
                </button>
              </div>
            </Reveal>
          )}

          <Reveal delay={3}>
            <div className="mt-8 max-w-2xl">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/70 mb-2">
                <span>{t('credits.progress')}</span>
                <span>{balance} / {LIMIT}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%`, background: 'linear-gradient(to right, var(--learn), var(--orange-warm))' }} />
              </div>
              <p className="mt-2 text-xs text-white/60">
                {t('credits.capHint', { limit: LIMIT })}
                {!atLimit && t('credits.capRemaining', { count: LIMIT - balance })}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Content — no FloatingDecor */}
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">

        {/* 3 stat cards — données réelles */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: t('credits.stats.balance'), value: balance,     color: 'var(--orange-warm)' },
            { label: t('credits.stats.earned'),  value: totalEarned, color: 'var(--learn)'       },
            { label: t('credits.stats.spent'),   value: totalSpent,  color: 'var(--ink)'         },
          ].map((s, i) => (
            <Reveal key={s.label} delay={(i + 1)}>
              <div className="card-lift rounded-3xl bg-white p-6 shadow-sm" style={{ border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  {s.label}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold" style={{ color: s.color }}>
                    {loading && i > 0 ? '—' : s.value}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t('credits.stats.unit')}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Historique — sessions COMPLETED réelles */}
        <Reveal delay={2}>
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{t('credits.history')}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: 'var(--cream)', color: 'var(--ink)' }}>
                <Coins size={13} /> {t('credits.creditPerMinute')}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-2 border-[#252840]/20 border-t-[#252840] rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-center py-10 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {t('credits.empty')}<br />{t('credits.emptyHint')}
              </p>
            ) : (
              <ul className="divide-y divide-[#F0EAE0]">
                {history.map(h => {
                  const gain = h.amount > 0
                  return (
                    <li key={h.id} className="flex items-center gap-4 py-4">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        gain
                          ? 'bg-[rgba(63,107,76,0.12)] text-[#3D5C28]'
                          : 'bg-[rgba(217,142,74,0.12)] text-[#C8864B]'
                      }`}>
                        {gain ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                          {h.label}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {t('credits.with', { name: h.with, date: h.date })}
                        </p>
                      </div>
                      <span className={`text-lg font-extrabold tabular-nums ${gain ? 'text-[#3D5C28]' : 'text-[#C8864B]'}`}>
                        {gain ? '+' : ''}{h.amount} {t('credits.unit')}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}

            <p className="mt-6 rounded-2xl p-4 text-center text-sm"
              style={{ background: 'var(--cream)', color: 'var(--muted-foreground)' }}>
              {t('credits.notForSale')}
            </p>
          </div>
        </Reveal>

        {/* Comment ça marche */}
        <Reveal delay={3}>
          <div className="rounded-3xl bg-white p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--ink)' }}>
              {t('credits.howTitle')}
            </h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l2.5 2.5"/></svg>,
                  color: 'var(--orange-warm)',
                  title: t('credits.how1Title'),
                  text: t('credits.how1Text'),
                },
                {
                  icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="1" y="5" width="16" height="11" rx="2"/><path d="M5 5V3a4 4 0 018 0v2"/></svg>,
                  color: 'var(--ink)',
                  title: t('credits.how2Title'),
                  text: t('credits.how2Text'),
                },
                {
                  icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 15V3M4 8l5-5 5 5"/></svg>,
                  color: 'var(--learn)',
                  title: t('credits.how3Title'),
                  text: t('credits.how3Text'),
                },
                {
                  icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 9h10M10 4l5 5-5 5"/></svg>,
                  color: 'var(--orange-warm)',
                  title: t('credits.how4Title', { limit: LIMIT }),
                  text: t('credits.how4Text'),
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${item.color} 12%, transparent)`, color: item.color }}>
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{item.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* CTAs */}
        <Reveal delay={4}>
          <div className="flex flex-col gap-3 pb-6 sm:flex-row">
            <button onClick={() => navigate('/connection')}
              className="flex-1 py-3 rounded-full text-white text-sm font-bold border-none cursor-pointer transition hover:-translate-y-0.5"
              style={{ background: 'var(--orange-warm)' }}>
              {t('credits.ctaFind')}
            </button>
            <button onClick={() => navigate('/sessions/new')}
              className="flex-1 py-3 rounded-full text-sm font-bold bg-transparent cursor-pointer transition hover:bg-[#252840] hover:text-white"
              style={{ border: '2px solid var(--ink)', color: 'var(--ink)' }}>
              {t('credits.ctaCreate')}
            </button>
          </div>
        </Reveal>

      </div>
    </main>
  )
}
