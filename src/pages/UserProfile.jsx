// src/pages/UserProfile.jsx
// Profil public d'un autre utilisateur
// Cliqué depuis Connection.jsx → affiche tout le profil + bouton demande de connexion
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import { matchApi, getApiError } from '../services/api'
import ReportDialog from '../components/ReportDialog'

const TAG_STYLES = {
  sand:  'bg-[#FAF5E8] text-[#3D3020] border border-[rgba(223,192,128,0.5)]',
  night: 'bg-[#ECEEF8] text-[#252840]',
  sage:  'bg-[#E4EED8] text-[#3D5C28]',
  warm:  'bg-[#F8EDD8] text-[#8C5A1E]',
}

// Données statiques — Dev 2 remplacera par GET /api/users/:id
const USERS_DATA = {
  la: {
    id:'la', initials:'LA', color:'#252840',
    name:'Léa Arnaud', age:19, city:'Paris', dispo:true,
    bio:'Passionate about mathematics and music theory. I have been teaching maths for 2 years and would love to finally improve my English through real conversation. I am patient, structured and love making complex things simple.',
    teaches:[{l:'Maths',s:'sand'},{l:'Piano',s:'sand'}],
    wants:[{l:'English',s:'night'}],
    score:92,
    sessions:12, credits:240, rating:4.9,
    posts:[
      { id:1, text:'Just finished an amazing maths session. My student went from confused to confident in one hour.', time:'2h ago', likes:24 },
      { id:2, text:'Anyone else find that teaching reinforces your own understanding? I learn every time I teach.', time:'Yesterday', likes:18 },
      { id:3, text:'Looking for an English conversation partner. I can offer maths or piano in exchange!', time:'3 days ago', likes:31 },
    ],
  },
  km: {
    id:'km', initials:'KM', color:'#C8864B',
    name:'Kenji Matsuda', age:22, city:'Lyon', dispo:true,
    bio:'Designer by day, language enthusiast by night. I speak Japanese natively and have been studying French for 2 years. I can teach UI/UX design principles and Japanese from beginner to intermediate.',
    teaches:[{l:'Japanese',s:'warm'},{l:'Design',s:'warm'}],
    wants:[{l:'French',s:'sage'}],
    score:78,
    sessions:8, credits:180, rating:4.7,
    posts:[
      { id:1, text:'Taught Japanese today and learned some incredible French expressions in return!', time:'5h ago', likes:41 },
      { id:2, text:'New post: my design process for mobile apps — happy to walk anyone through it.', time:'2 days ago', likes:29 },
    ],
  },
}

// Fake posts thumbnails using SVG
function PostThumb({ color, text, likes, time }) {
  return (
    <div className="bg-[#FDFAF4] border border-black/[0.09] rounded-xl overflow-hidden">
      <div className="h-[140px] flex items-center justify-center" style={{ background: `${color}14` }}>
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <rect x="8" y="10" width="28" height="36" rx="4" fill={color} opacity=".18"/>
          <path d="M14 22h16M14 28h12M14 34h14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="44" cy="44" r="10" fill={color} opacity=".12"/>
          <path d="M40 44l3 3 5-5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="p-3">
        <p className="text-[12px] text-[#3D3020] leading-[1.4] line-clamp-2">{text}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-[#7A6E5C]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" stroke="none"><path d="M5 9S1 6.5 1 3.5a2.5 2.5 0 015 0 2.5 2.5 0 015 0C11 6.5 5 9 5 9z"/></svg>
            {likes}
          </span>
          <span className="text-[10px] text-[#7A6E5C] ml-auto">{time}</span>
        </div>
      </div>
    </div>
  )
}

export default function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, openModal } = useAuthStore()
  const [reqState, setReqState] = useState('idle') // idle | pending | accepted
  const [reqError, setReqError] = useState('')
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const [reportOpen, setReportOpen] = useState(false)

  // TODO: Dev 2 remplacera par un appel API
  const profile = USERS_DATA[id]

  if (!profile) return (
    <main className="pt-[62px] min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#756B5B" strokeWidth="2" strokeLinecap="round">
            <circle cx="24" cy="24" r="20"/>
            <circle cx="17" cy="19" r="2" fill="#756B5B"/>
            <circle cx="31" cy="19" r="2" fill="#756B5B"/>
            <path d="M17 32c1.5-3 12.5-3 14 0"/>
          </svg>
        </div>
        <p className="text-[16px] font-semibold text-[#1A1410]">Profile not found</p>
        <button onClick={() => navigate('/connection')} className="mt-4 text-[#252840] font-bold bg-transparent border-none cursor-pointer text-[14px]">
          ← Back to connections
        </button>
      </div>
    </main>
  )

  const handleRequest = async () => {
    if (!user) { openModal('login'); return }
    setReqError('')
    setReqState('pending')
    try {
      await matchApi.request({ receiverId: profile.id })
      // Acceptance happens on the receiver's side (PATCH /matches/:id); the
      // requester stays in "pending" until then.
    } catch (err) {
      setReqState('idle')
      setReqError(getApiError(err))
    }
  }

  const sendComment = () => {
    if (!comment.trim()) return
    setComments(p => [...p, { text: comment.trim(), author: user?.firstName ?? 'You', time: 'Just now' }])
    setComment('')
  }

  return (
    <main className="pt-[62px] min-h-screen bg-white">

      {/* Cover */}
      <div className="h-[180px] bg-gradient-to-br from-[#252840] via-[#363B6B] to-[#C8864B]" />

      <div className="px-20">
        {/* Avatar — sort de la bannière */}
        <div className="-mt-12 mb-4">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center font-black text-[32px] text-white"
              style={{ background: profile.color }}>
              {profile.initials}
            </div>
            {profile.dispo && (
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#3D5C28] border-2 border-white" />
            )}
          </div>
        </div>

        {/* Actions — bien séparées de la bannière */}
        <div className="flex items-center gap-3 mb-6">
          {reqState === 'idle' && (
            <button onClick={handleRequest}
              className="px-5 py-[10px] rounded-xl bg-[#252840] text-white text-[13px] font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-all">
              Request connection
            </button>
          )}
          {reqState === 'pending' && (
            <div className="flex items-center gap-2 px-5 py-[10px] rounded-xl bg-[#ECEEF8] text-[#252840] text-[13px] font-bold">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="7" cy="7" r="5.5"/>
                <path d="M7 4v3l2 2"/>
              </svg>
              Request sent — waiting for acceptance
            </div>
          )}
          {reqState === 'accepted' && (
            <button onClick={() => navigate('/chat')}
              className="flex items-center gap-2 px-5 py-[10px] rounded-xl bg-[#3D5C28] text-white text-[13px] font-bold border-none cursor-pointer hover:bg-[#4E6035] transition-all">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M1 1h12v8H8l-1 4-1-4H1z"/>
              </svg>
              Message
            </button>
          )}
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-[10px] rounded-xl border-[1.5px] border-black/[0.09] text-[#7A6E5C] text-[13px] font-semibold bg-transparent cursor-pointer hover:border-[#1A1410] hover:text-[#1A1410] transition-all">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M9 2L4 7l5 5"/>
            </svg>
            Back
          </button>
          {/* Signalement contextuel — réutilise le formulaire de /report */}
          <button onClick={() => setReportOpen(true)}
            className="flex items-center gap-2 px-5 py-[10px] rounded-xl border-[1.5px] border-black/[0.09] text-[color:var(--muted-fg)] text-[13px] font-semibold bg-transparent cursor-pointer hover:border-red-300 hover:text-red-500 transition-all">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M2.5 1v12M2.5 2h8l-1.5 2.5L10.5 7h-8" />
            </svg>
            {t('report.openButton')}
          </button>
          {reqError && (
            <span className="text-[12px] font-semibold text-red-600">{reqError}</span>
          )}
        </div>

        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reportedUserId={profile.id}
          reportedName={profile.name}
        />

        <div className="grid grid-cols-[1fr_320px] gap-10 pb-16">
          {/* Left */}
          <div>
            {/* Name + bio */}
            <h1 className="text-[28px] font-black tracking-tight text-[#1A1410]">{profile.name}</h1>
            <p className="text-[14px] text-[#7A6E5C] mt-1 mb-4">{profile.age} y.o. · {profile.city}</p>
            <p className="text-[15px] text-[#3D3020] leading-[1.7] mb-6 max-w-[560px]">{profile.bio}</p>

            {/* Skills */}
            <div className="flex gap-10 mb-8">
              <div>
                <p className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#7A6E5C] mb-3">Teaches</p>
                <div className="flex gap-2 flex-wrap">
                  {profile.teaches.map(t => <span key={t.l} className={`px-[11px] py-[5px] rounded-full text-[12px] font-semibold ${TAG_STYLES[t.s]}`}>{t.l}</span>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#7A6E5C] mb-3">Wants to learn</p>
                <div className="flex gap-2 flex-wrap">
                  {profile.wants.map(t => <span key={t.l} className={`px-[11px] py-[5px] rounded-full text-[12px] font-semibold ${TAG_STYLES[t.s]}`}>{t.l}</span>)}
                </div>
              </div>
            </div>

            {/* Posts */}
            <h3 className="text-[16px] font-bold text-[#1A1410] mb-4">Posts</h3>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {profile.posts.map(p => <PostThumb key={p.id} color={profile.color} {...p} />)}
            </div>

            {/* Comments */}
            <h3 className="text-[16px] font-bold text-[#1A1410] mb-3">Comments</h3>
            <div className="flex gap-3 mb-4">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendComment()}
                placeholder={user ? 'Leave a comment...' : 'Log in to comment'}
                disabled={!user}
                className="flex-1 px-4 py-[10px] rounded-xl border-[1.5px] border-black/[0.09] bg-[#FDFAF4] text-[13px] outline-none focus:border-[#252840] transition-all disabled:opacity-50"
              />
              <button onClick={sendComment} disabled={!user || !comment.trim()}
                className="px-4 py-[10px] rounded-xl bg-[#252840] text-white text-[12px] font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-all disabled:opacity-40">
                Post
              </button>
            </div>
            {comments.length === 0 ? (
              <p className="text-[13px] text-[#7A6E5C]">No comments yet. Be the first!</p>
            ) : (
              <div className="flex flex-col gap-2">
                {comments.map((c, i) => (
                  <div key={i} className="bg-[#FDFAF4] border border-black/[0.07] rounded-xl px-4 py-3">
                    <div className="flex gap-2 items-center mb-1">
                      <span className="text-[12px] font-bold text-[#1A1410]">{c.author}</span>
                      <span className="text-[11px] text-[#7A6E5C]">{c.time}</span>
                    </div>
                    <p className="text-[13px] text-[#3D3020]">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — stats */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#FDFAF4] border border-black/[0.09] rounded-2xl p-6">
              <h3 className="text-[14px] font-bold text-[#1A1410] mb-4">Stats</h3>
              {[
                { label:'Sessions given', value: profile.sessions, color:'#3D5C28' },
                { label:'Credits earned', value: `${profile.credits} cr`, color:'#252840' },
                { label:'Rating',         value: `${profile.rating} / 5`, color:'#C8864B' },
                { label:'Match score',    value: `${profile.score}%`, color:'#252840' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-black/[0.06] last:border-0">
                  <span className="text-[13px] text-[#7A6E5C]">{s.label}</span>
                  <span className="text-[14px] font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#ECEEF8] rounded-2xl p-5">
              <p className="text-[12px] font-bold text-[#252840] mb-2">How connections work</p>
              <p className="text-[12px] text-[#7A6E5C] leading-[1.6]">
                Send a connection request. Once accepted, you'll be able to chat and start skill exchange sessions. Each minute you teach earns you credits — each minute you learn costs credits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}