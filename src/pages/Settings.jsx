// src/pages/Settings.jsx
// Paramètres : langue, notifications, confidentialité, gestion du compte.
//
// ⚠️ Les préférences sont pour l'instant stockées en localStorage : l'API
// backend de préférences (PENDING_ENDPOINTS.preferences) n'existe pas encore.
// L'export et la suppression du compte sont volontairement désactivés plutôt
// que d'appeler des routes inexistantes.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bell, Download, FileText, Globe, LogOut, ShieldCheck, Trash2, Check,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Footer from '../components/Footer'
import { PENDING_ENDPOINTS } from '../config/legal'

const PREFS_KEY = 'sb_prefs'

const DEFAULT_PREFS = {
  notifEmail:      true,
  notifPush:       false,
  notifMessages:   true,
  notifSessions:   true,
  visibility:      'members',
  showInSuggestions: true,
  showAvailability:  true,
}

function loadPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
    return { ...DEFAULT_PREFS, ...raw }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

function Card({ icon, title, description, children }) {
  return (
    <section className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-card sm:p-8">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-cream text-warm">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted-fg)]">{description}</p>
          )}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </section>
  )
}

function Toggle({ id, label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-[color:var(--border)] py-4 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-semibold text-navy cursor-pointer">{label}</label>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--muted-fg)]">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-none transition-colors ${
          checked ? 'bg-warm' : 'bg-[color:var(--border)]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function RadioCard({ name, value, checked, label, hint, onChange }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 transition-colors ${
        checked
          ? 'border-2 border-warm bg-[rgba(200,134,75,0.1)]'
          : 'border border-[color:var(--border)] bg-light-cream hover:border-navy'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer accent-warm"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-navy">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-[color:var(--muted-fg)]">{hint}</span>
      </span>
    </label>
  )
}

function ComingSoonBadge({ children }) {
  return (
    <span className="inline-block rounded-full bg-cream px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[color:var(--muted-fg)]">
      {children}
    </span>
  )
}

export default function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const [prefs, setPrefs] = useState(loadPrefs)
  const [savedAt, setSavedAt] = useState(0)

  // Persistance locale — TODO(backend): remplacer par PENDING_ENDPOINTS.preferences
  const update = (patch) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)) } catch { /* quota / mode privé */ }
      return next
    })
    setSavedAt(Date.now())
  }

  useEffect(() => {
    if (!savedAt) return
    const id = setTimeout(() => setSavedAt(0), 2500)
    return () => clearTimeout(id)
  }, [savedAt])

  const legalLinks = [
    { to: '/legal-notice', label: t('footer.legalNotice') },
    { to: '/privacy',      label: t('footer.privacy')     },
    { to: '/terms',        label: t('footer.terms')       },
    { to: '/help',         label: t('footer.helpCenter')  },
    { to: '/support',      label: t('footer.support')     },
    { to: '/report',       label: t('footer.report')      },
  ]

  return (
    <>
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-12">

          <p className="text-xs font-bold uppercase tracking-widest text-warm">{t('settings.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">
            {t('settings.title')}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--muted-fg)]">
            {t('settings.subtitle')}
          </p>

          {/* Indicateur d'enregistrement — réserve sa place pour éviter tout saut de mise en page */}
          <div className="mt-4 h-7" aria-live="polite">
            {savedAt > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(61,92,40,0.12)] px-3 py-1.5 text-xs font-bold text-sage">
                <Check size={13} aria-hidden="true" /> {t('actions.saved')}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-6">

            {/* ── Langue ── */}
            <Card
              icon={<Globe size={18} aria-hidden="true" />}
              title={t('settings.language.title')}
              description={t('settings.language.description')}
            >
              <LanguageSwitcher />
            </Card>

            {/* ── Notifications ── */}
            <Card
              icon={<Bell size={18} aria-hidden="true" />}
              title={t('settings.notifications.title')}
              description={t('settings.notifications.description')}
            >
              <div className="flex flex-col">
                <Toggle
                  id="pref-notif-email"
                  label={t('settings.notifications.email')}
                  hint={t('settings.notifications.emailHint')}
                  checked={prefs.notifEmail}
                  onChange={v => update({ notifEmail: v })}
                />
                <Toggle
                  id="pref-notif-push"
                  label={t('settings.notifications.push')}
                  hint={t('settings.notifications.pushHint')}
                  checked={prefs.notifPush}
                  onChange={v => update({ notifPush: v })}
                />
                <Toggle
                  id="pref-notif-messages"
                  label={t('settings.notifications.messages')}
                  hint={t('settings.notifications.messagesHint')}
                  checked={prefs.notifMessages}
                  onChange={v => update({ notifMessages: v })}
                />
                <Toggle
                  id="pref-notif-sessions"
                  label={t('settings.notifications.sessionReminders')}
                  hint={t('settings.notifications.sessionRemindersHint')}
                  checked={prefs.notifSessions}
                  onChange={v => update({ notifSessions: v })}
                />
              </div>
              <p className="mt-4 rounded-2xl bg-cream p-4 text-xs leading-relaxed text-[color:var(--muted-fg)]">
                {t('settings.localOnly')}
              </p>
            </Card>

            {/* ── Confidentialité ── */}
            <Card
              icon={<ShieldCheck size={18} aria-hidden="true" />}
              title={t('settings.privacy.title')}
              description={t('settings.privacy.description')}
            >
              <fieldset className="border-none p-0 m-0">
                <legend className="mb-3 text-sm font-bold text-navy">{t('settings.privacy.visibility')}</legend>
                <div className="flex flex-col gap-2">
                  <RadioCard
                    name="visibility" value="public"
                    checked={prefs.visibility === 'public'}
                    label={t('settings.privacy.visibilityPublic')}
                    hint={t('settings.privacy.visibilityPublicHint')}
                    onChange={v => update({ visibility: v })}
                  />
                  <RadioCard
                    name="visibility" value="members"
                    checked={prefs.visibility === 'members'}
                    label={t('settings.privacy.visibilityMembers')}
                    hint={t('settings.privacy.visibilityMembersHint')}
                    onChange={v => update({ visibility: v })}
                  />
                  <RadioCard
                    name="visibility" value="connections"
                    checked={prefs.visibility === 'connections'}
                    label={t('settings.privacy.visibilityConnections')}
                    hint={t('settings.privacy.visibilityConnectionsHint')}
                    onChange={v => update({ visibility: v })}
                  />
                </div>
              </fieldset>

              <div className="mt-5 flex flex-col border-t border-[color:var(--border)] pt-1">
                <Toggle
                  id="pref-suggestions"
                  label={t('settings.privacy.suggestions')}
                  hint={t('settings.privacy.suggestionsHint')}
                  checked={prefs.showInSuggestions}
                  onChange={v => update({ showInSuggestions: v })}
                />
                <Toggle
                  id="pref-availability"
                  label={t('settings.privacy.availability')}
                  hint={t('settings.privacy.availabilityHint')}
                  checked={prefs.showAvailability}
                  onChange={v => update({ showAvailability: v })}
                />
              </div>
            </Card>

            {/* ── Compte ── */}
            <Card
              icon={<Download size={18} aria-hidden="true" />}
              title={t('settings.account.title')}
              description={t('settings.account.description')}
            >
              {user ? (
                <>
                  <div className="flex flex-col gap-4">
                    {/* TODO(backend): brancher sur PENDING_ENDPOINTS.exportData (RGPD art. 15 & 20) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-light-cream p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy">{t('settings.account.export')}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--muted-fg)]">
                          {t('settings.account.exportHint')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ComingSoonBadge>{t('actions.comingSoon')}</ComingSoonBadge>
                        <button
                          type="button"
                          disabled
                          aria-describedby="account-backend-note"
                          className="cursor-not-allowed rounded-full border-none bg-warm px-4 py-2 text-sm font-bold text-white opacity-40"
                        >
                          {t('settings.account.export')}
                        </button>
                      </div>
                    </div>

                    {/* TODO(backend): brancher sur PENDING_ENDPOINTS.deleteAccount (RGPD art. 17) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-red-700">{t('settings.account.delete')}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-red-700/80">
                          {t('settings.account.deleteHint')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ComingSoonBadge>{t('actions.comingSoon')}</ComingSoonBadge>
                        <button
                          type="button"
                          disabled
                          aria-describedby="account-backend-note"
                          className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border-none bg-red-500 px-4 py-2 text-sm font-bold text-white opacity-40"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          {t('settings.account.delete')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p id="account-backend-note" className="mt-4 rounded-2xl bg-cream p-4 text-xs leading-relaxed text-[color:var(--muted-fg)]">
                    {t('settings.account.backendMissing')}
                    {' '}
                    <Link to="/support" className="font-bold text-warm no-underline hover:underline">
                      {t('settings.account.contactSupport')}
                    </Link>
                    {' '}
                    <span className="opacity-60">({PENDING_ENDPOINTS.exportData} · {PENDING_ENDPOINTS.deleteAccount})</span>
                  </p>

                  <button
                    type="button"
                    onClick={() => { logout(); navigate('/') }}
                    className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[color:var(--border)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[color:var(--muted-fg)] hover:border-navy hover:text-navy transition-colors"
                  >
                    <LogOut size={14} aria-hidden="true" />
                    {t('settings.account.logout')}
                  </button>
                </>
              ) : (
                <p className="rounded-2xl bg-cream p-4 text-sm leading-relaxed text-[color:var(--muted-fg)]">
                  {t('settings.account.loggedOut')}
                </p>
              )}
            </Card>

            {/* ── Légal ── */}
            <Card
              icon={<FileText size={18} aria-hidden="true" />}
              title={t('settings.legal.title')}
              description={t('settings.legal.description')}
            >
              <div className="flex flex-wrap gap-2">
                {legalLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="rounded-full border border-[color:var(--border)] bg-light-cream px-4 py-2 text-sm font-semibold text-navy no-underline hover:border-navy transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </Card>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
