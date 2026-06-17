import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, LogOut, Menu, X, Download,
  Home, Users, CalendarDays, MessageCircle, Coins,
  UserPlus, CheckCheck,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import CreditIcon from './CreditIcon'
import useNotifications from '../hooks/useNotifications'

const NAV_LINKS = [
  { to: '/',           label: 'Accueil',    public: true,  Icon: Home           },
  { to: '/connection', label: 'Connexions', public: true,  Icon: Users          },
  { to: '/sessions',   label: 'Sessions',   public: false, Icon: CalendarDays   },
  { to: '/chat',       label: 'Messages',   public: false, Icon: MessageCircle  },
  { to: '/credits',    label: 'Crédits',    public: false, Icon: Coins          },
]

function Avatar({ user, size = 'md' }) {
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U'
  const cls = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
  if (user?.avatarUrl) {
    return (
      <img src={user.avatarUrl} alt={user.firstName}
        className={`${cls} rounded-full object-cover border-2 border-[#C8864B] transition-transform duration-150 hover:scale-110`} />
    )
  }
  return (
    <div className={`${cls} rounded-full bg-[#252840] flex items-center justify-center font-bold text-[#F8F4EA] border-2 border-[#C8864B] transition-transform duration-150 hover:scale-110`}>
      {initials}
    </div>
  )
}

function CreditPopover({ balance, onClose, placement = 'below' }) {
  const cls = placement === 'left'
    ? 'animate-modal-in absolute top-0 right-full mr-3 w-72 rounded-2xl border border-[#E8DDC7] bg-white shadow-soft p-5 z-50'
    : 'animate-modal-in absolute top-full right-0 mt-2 w-72 rounded-2xl border border-[#E8DDC7] bg-white shadow-soft p-5 z-50'
  return (
    <div className={cls}>
      <h3 className="text-sm font-black text-[#252840] mb-3">Comment fonctionnent les crédits</h3>
      <div className="flex flex-col gap-3 mb-4">
        {[
          { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l1.5 1.5"/></svg>, text: '1 crédit = 1 minute de cours' },
          { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="1" y="4" width="12" height="8" rx="1.5"/><path d="M4 4V3a3 3 0 016 0v1"/></svg>, text: 'Quand tu réserves une session, les crédits sont mis de côté' },
          { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 12V2M2 7l5-5 5 5"/></svg>, text: "À la fin, l'enseignant les reçoit — et si la session est plus courte que prévu, la différence t'est remboursée" },
          { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1 7h12M8 3l5 4-5 4"/></svg>, text: 'Plafond : 500 crédits. Au plafond, apprends pour les dépenser.' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex-shrink-0 text-[#C8864B]">{item.icon}</span>
            <p className="text-xs text-[#756B5B] leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-[#F0EAE0] pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CreditIcon size="sm" />
          <span className="text-sm font-black text-[#252840]">{balance} cr</span>
          <span className="text-xs text-[#756B5B]">solde actuel</span>
        </div>
        <Link to="/credits" onClick={onClose} className="text-xs font-bold text-[#C8864B] no-underline hover:underline">
          Voir mes crédits →
        </Link>
      </div>
    </div>
  )
}

function notifIcon(type) {
  if (type === 'CONNECTION_REQUEST') return <UserPlus size={14} />
  if (type === 'CONNECTION_ACCEPTED') return <Users size={14} />
  if (type === 'MESSAGE_RECEIVED') return <MessageCircle size={14} />
  if (type?.startsWith('SESSION_')) return <CalendarDays size={14} />
  return <Bell size={14} />
}

function fmtNotifDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return d.toLocaleDateString('fr', { day: '2-digit', month: 'short' })
}

function NotifPanel({ notifications, dismiss, dismissAll, onClose, placement = 'below' }) {
  const navigate = useNavigate()
  const cls = placement === 'left'
    ? 'animate-modal-in absolute top-0 right-full mr-3 w-80 rounded-2xl border border-[#E8DDC7] bg-white shadow-soft z-50 overflow-hidden'
    : 'animate-modal-in absolute top-full right-0 mt-2 w-80 rounded-2xl border border-[#E8DDC7] bg-white shadow-soft z-50 overflow-hidden'

  const unread = notifications.filter(n => !n.read)

  if (notifications.length === 0) {
    return (
      <div className={cls.replace('overflow-hidden', 'p-5')}>
        <p className="text-sm font-bold text-[#252840] mb-1">Notifications</p>
        <p className="text-xs text-[#756B5B]">Aucune notification.</p>
      </div>
    )
  }
  return (
    <div className={cls}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EAE0]">
        <p className="text-sm font-black text-[#252840]">Notifications</p>
        {unread.length > 0 && (
          <button onClick={dismissAll}
            className="flex items-center gap-1 text-xs text-[#756B5B] bg-transparent border-none cursor-pointer hover:text-[#252840]">
            <CheckCheck size={12} /> Tout lire
          </button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.map(n => (
          <button key={n.id}
            className={`w-full flex items-start gap-3 px-4 py-3 border-b border-[#F8F4EA] last:border-0 text-left cursor-pointer bg-transparent transition-colors ${
              n.read ? 'hover:bg-[#FDFAF4]' : 'bg-[#FDFAF4] hover:bg-[#F8F4EA]'
            }`}
            onClick={() => { dismiss(n.id); navigate(n.link); onClose() }}
          >
            <span className={`mt-0.5 flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full ${
              n.read ? 'bg-[#F0EAE0] text-[#B0A898]' : 'bg-[rgba(200,134,75,0.15)] text-[#C8864B]'
            }`}>
              {notifIcon(n.type)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#252840] leading-relaxed">{n.message}</p>
              <p className="text-[10px] text-[#B0A898] mt-0.5">{fmtNotifDate(n.createdAt)}</p>
            </div>
            {!n.read && <span className="flex-shrink-0 mt-1.5 h-2 w-2 rounded-full bg-[#C8864B]" />}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Navbar() {
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showCredits,   setShowCredits]   = useState(false)
  const [showNotifs,    setShowNotifs]    = useState(false)
  const [scrolled,      setScrolled]      = useState(false)

  const { user, openModal, logout } = useAuthStore()
  const { notifications, dismiss, dismissAll, unreadCount } = useNotifications()
  const location  = useLocation()
  const navigate  = useNavigate()
  const pathname  = location.pathname

  const creditsBtnRef = useRef(null)
  const creditsPopRef = useRef(null)
  const notifBtnRef   = useRef(null)
  const notifPanRef   = useRef(null)

  const visibleLinks = NAV_LINKS.filter(l => l.public || !!user)

  const isActive = (to) =>
    to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/')

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (creditsBtnRef.current && !creditsBtnRef.current.contains(e.target) &&
          creditsPopRef.current && !creditsPopRef.current.contains(e.target))
        setShowCredits(false)
      if (notifBtnRef.current && !notifBtnRef.current.contains(e.target) &&
          notifPanRef.current && !notifPanRef.current.contains(e.target))
        setShowNotifs(false)
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') { setShowCredits(false); setShowNotifs(false) }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const handleInstall = () => {
    if (installPrompt) { installPrompt.prompt(); setInstallPrompt(null) }
  }

  const closeAll = () => { setShowCredits(false); setShowNotifs(false) }

  return (
    <>
      {/* ── Horizontal navbar (fixed, full width) ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 border-b border-[#E8DDC7] bg-[rgba(253,250,244,0.88)] backdrop-blur-md transition-all duration-300 ease-out ${
          scrolled ? 'lg:opacity-0 lg:pointer-events-none lg:-translate-y-1' : ''
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 no-underline" onClick={closeAll}>
            <img src="/skillbridge-logo.webp" alt="SkillBridge" className="h-8 w-auto" />
            <span className="hidden sm:block text-xl font-black tracking-tight" style={{ color: 'var(--ink)' }}>
              SkillBridge
            </span>
          </Link>

          {/* Liens desktop */}
          <nav className="hidden items-center gap-1 lg:flex">
            {visibleLinks.map(({ to, label }) => (
              <Link key={to} to={to} onClick={closeAll}
                className={`relative px-3 py-2 text-sm font-medium transition-colors duration-150 no-underline ${
                  isActive(to) ? 'text-[#C8864B]' : 'text-[#252840] hover:text-[#C8864B]'
                }`}
              >
                {label}
                {isActive(to) && (
                  <span className="absolute -bottom-1 left-3 right-3 h-0.5 rounded-full bg-[#C8864B]" />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden items-center gap-2 lg:flex">
            {installPrompt && (
              <button onClick={handleInstall}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C8864B] text-white text-sm font-semibold border-none cursor-pointer hover:bg-[#B07030] transition-colors">
                <Download size={14} /> Installer l'app
              </button>
            )}
            {user ? (
              <>
                <div className="relative">
                  <button ref={notifBtnRef} onClick={() => { setShowNotifs(s => !s); setShowCredits(false) }}
                    aria-label="Notifications"
                    className="relative h-9 w-9 grid place-items-center rounded-full bg-transparent border border-[#E8DDC7] text-[#756B5B] hover:border-[#252840] hover:text-[#252840] cursor-pointer transition-colors">
                    <Bell size={15} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#C8864B] text-white text-[9px] font-black flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifs && <div ref={notifPanRef}><NotifPanel notifications={notifications} dismiss={dismiss} dismissAll={dismissAll} onClose={() => setShowNotifs(false)} /></div>}
                </div>

                <div className="relative">
                  <button ref={creditsBtnRef} onClick={() => { setShowCredits(s => !s); setShowNotifs(false) }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(61,92,40,0.1)] px-3 py-1.5 text-sm font-semibold text-[#3D5C28] border-none cursor-pointer hover:bg-[rgba(61,92,40,0.16)] transition-all duration-150">
                    <CreditIcon size="sm" /> {user.credits ?? 0}
                  </button>
                  {showCredits && <div ref={creditsPopRef}><CreditPopover balance={user.credits ?? 0} onClose={() => setShowCredits(false)} /></div>}
                </div>

                <Link to="/profile" className="no-underline" onClick={closeAll}><Avatar user={user} /></Link>
                <button onClick={() => { logout(); navigate('/') }} aria-label="Se déconnecter"
                  className="grid h-9 w-9 place-items-center rounded-full bg-transparent border-none cursor-pointer text-[#756B5B] hover:bg-[#F8F4EA] hover:text-[#252840] transition-colors">
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => openModal('login')}
                  className="px-4 py-2 rounded-full border border-[#252840] text-sm font-semibold text-[#252840] bg-transparent cursor-pointer hover:bg-[#252840] hover:text-white transition-colors">
                  Se connecter
                </button>
                <button onClick={() => navigate('/register')}
                  className="px-4 py-2 rounded-full bg-[#C8864B] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#B07030] transition-colors">
                  S'inscrire
                </button>
              </>
            )}
          </div>

          {/* Hamburger mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            {user && <Link to="/profile" className="no-underline" onClick={closeAll}><Avatar user={user} /></Link>}
            <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu"
              className="grid h-10 w-10 place-items-center rounded-full bg-transparent border-none cursor-pointer text-[#252840] hover:bg-[#F8F4EA] transition-colors">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Vertical dock (fixed right, desktop only, scrolled) ── */}
      <aside
        className={`fixed right-4 top-1/2 z-40 hidden lg:flex flex-col items-center gap-1 p-2.5 rounded-2xl border border-[#E8DDC7] bg-[rgba(253,250,244,0.94)] backdrop-blur-md shadow-lg transition-all duration-300 ease-out origin-right ${
          scrolled ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none scale-90'
        }`}
        style={{ transform: scrolled ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.9)' }}
      >
        {/* Logo mark */}
        <Link to="/" className="no-underline mb-1" title="Accueil" onClick={closeAll}>
          <img src="/skillbridge-logo.webp" alt="SkillBridge" className="h-7 w-auto" />
        </Link>

        <div className="w-5 h-px bg-[#E8DDC7] my-0.5" />

        {/* Nav links */}
        {visibleLinks.map(({ to, label, Icon }) => (
          <Link key={to} to={to} title={label} onClick={closeAll}
            className={`h-10 w-10 grid place-items-center rounded-xl no-underline transition-colors ${
              isActive(to) ? 'bg-[#252840] text-[#F8F4EA]' : 'text-[#756B5B] hover:bg-[#F0EAE0] hover:text-[#252840]'
            }`}
          >
            <Icon size={18} />
          </Link>
        ))}

        {user && (
          <>
            <div className="w-5 h-px bg-[#E8DDC7] my-0.5" />

            {/* Credits */}
            <div className="relative">
              <button ref={creditsBtnRef}
                onClick={() => { setShowCredits(s => !s); setShowNotifs(false) }}
                title="Crédits"
                className="flex flex-col items-center gap-0.5 rounded-xl p-1.5 cursor-pointer border-none bg-transparent hover:bg-[#F0EAE0] transition-colors"
              >
                <CreditIcon size="sm" />
                <span className="text-[9px] font-bold text-[#3D5C28] leading-none">{user.credits ?? 0}</span>
              </button>
              {showCredits && (
                <div ref={creditsPopRef}>
                  <CreditPopover balance={user.credits ?? 0} onClose={() => setShowCredits(false)} placement="left" />
                </div>
              )}
            </div>

            {/* Bell */}
            <div className="relative">
              <button ref={notifBtnRef}
                onClick={() => { setShowNotifs(s => !s); setShowCredits(false) }}
                title="Notifications"
                className="h-10 w-10 grid place-items-center rounded-xl text-[#756B5B] hover:bg-[#F0EAE0] hover:text-[#252840] border-none bg-transparent cursor-pointer transition-colors relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-[#C8864B] text-white text-[8px] font-black flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div ref={notifPanRef}>
                  <NotifPanel notifications={notifications} dismiss={dismiss} dismissAll={dismissAll} onClose={() => setShowNotifs(false)} placement="left" />
                </div>
              )}
            </div>

            {/* Avatar */}
            <Link to="/profile" className="no-underline" title="Mon profil" onClick={closeAll}>
              <Avatar user={user} size="sm" />
            </Link>

            {/* Logout */}
            <button onClick={() => { logout(); navigate('/') }} title="Se déconnecter"
              className="h-9 w-9 grid place-items-center rounded-xl text-[#756B5B] hover:bg-red-50 hover:text-red-500 border-none bg-transparent cursor-pointer transition-colors">
              <LogOut size={16} />
            </button>
          </>
        )}

        {!user && (
          <>
            <div className="w-5 h-px bg-[#E8DDC7] my-0.5" />
            <button onClick={() => openModal('login')} title="Se connecter"
              className="px-2 py-1.5 rounded-xl text-[9px] font-bold text-[#252840] bg-transparent border border-[#E8DDC7] cursor-pointer hover:border-[#252840] transition-colors leading-tight text-center">
              Connexion
            </button>
          </>
        )}
      </aside>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-[65px] right-4 w-72 bg-[#FDFAF4] border border-[#E8DDC7] shadow-soft rounded-2xl p-5 animate-modal-in"
            onClick={e => e.stopPropagation()}>
            <nav className="flex flex-col gap-1 mb-6">
              {visibleLinks.map(({ to, label }) => (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-base font-semibold no-underline transition-colors ${
                    isActive(to) ? 'bg-[#252840] text-[#F8F4EA]' : 'text-[#1A1410] hover:bg-[#F8F4EA]'
                  }`}>
                  {label}
                </Link>
              ))}
              {user && (
                <Link to="/profile" onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-semibold text-[#1A1410] hover:bg-[#F8F4EA] no-underline transition-colors">
                  Mon profil
                </Link>
              )}
            </nav>
            {user ? (
              <div className="flex flex-col gap-2">
                {unreadCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(200,134,75,0.1)] text-sm font-semibold text-[#C8864B]">
                    <span className="h-5 w-5 rounded-full bg-[#C8864B] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{unreadCount}</span>
                    notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
                  </div>
                )}
                <Link to="/credits" onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full bg-[rgba(61,92,40,0.1)] px-3 py-2 text-sm font-semibold text-[#3D5C28] no-underline w-fit">
                  <CreditIcon size="sm" /> {user.credits ?? 0} crédits
                </Link>
                <button onClick={() => { logout(); navigate('/'); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E8DDC7] text-sm font-semibold text-[#756B5B] bg-transparent cursor-pointer hover:border-red-300 hover:text-red-500 transition-colors">
                  <LogOut size={14} /> Se déconnecter
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button onClick={() => { openModal('login'); setMenuOpen(false) }}
                  className="px-4 py-3 rounded-xl border border-[#E8DDC7] text-sm font-semibold text-[#252840] bg-transparent cursor-pointer hover:border-[#252840] transition-colors">
                  Se connecter
                </button>
                <button onClick={() => { navigate('/register'); setMenuOpen(false) }}
                  className="px-4 py-3 rounded-xl bg-[#C8864B] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#B07030] transition-colors">
                  S'inscrire gratuitement
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
