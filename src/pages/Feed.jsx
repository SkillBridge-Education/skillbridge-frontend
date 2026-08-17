// src/pages/Feed.jsx — Fil communautaire nettoyé, posts réels uniquement
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'

const FILTERS = ['all', 'languages', 'music', 'tech', 'science', 'wellbeing']

export default function Feed() {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [filter,      setFilter]   = useState('all')
  const [posts,       setPosts]    = useState([])
  const [addOpen,     setAddOpen]  = useState(false)
  const [newText,     setNewText]  = useState('')
  const [newTag,      setNewTag]   = useState('')
  const [liked,       setLiked]    = useState(new Set())

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U'

  const addPost = () => {
    if (!newText.trim()) return
    setPosts(p => [{
      id:       Date.now(),
      initials,
      color:    '#252840',
      author:   `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || t('feed.me'),
      time:     t('feed.justNow'),
      text:     newText.trim(),
      tags:     newTag.trim() ? [newTag.trim()] : [],
      likes:    0,
      comments: 0,
    }, ...p])
    setNewText('')
    setNewTag('')
    setAddOpen(false)
  }

  const toggleLike = (id) => {
    setLiked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <main className="pt-[62px] min-h-screen bg-white">

      {/* Header */}
      <div className="bg-white border-b border-black/[0.09] px-8 md:px-20 py-10">
        <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-[color:var(--warm-strong)] mb-2">{t('feed.eyebrow')}</p>
        <h1 className="text-[38px] font-black tracking-[-1.5px] text-[#1A1410] leading-[1.05]">
          <Trans i18nKey="feed.title" components={{ highlight: <span className="text-[#252840]" /> }} />
        </h1>
        <p className="text-[14px] text-[#7A6E5C] mt-2">
          {t('feed.subtitle')}
        </p>
      </div>

      <div className="px-8 md:px-20 py-8 max-w-[860px]">

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold border-[1.5px] cursor-pointer transition-all
                ${filter === f
                  ? 'bg-[#252840] text-white border-[#252840]'
                  : 'bg-transparent text-[#7A6E5C] border-black/[0.09] hover:border-[#1A1410] hover:text-[#1A1410]'}`}>
              {t(`feed.filters.${f}`)}
            </button>
          ))}
        </div>

        {/* Bouton Ajouter */}
        {user && (
          <button onClick={() => setAddOpen(true)}
            className="w-full bg-white border-[1.5px] border-black/[0.09] rounded-2xl px-5 py-4 flex items-center gap-3 mb-6 cursor-pointer hover:border-[#252840] transition-all text-left">
            <div className="w-9 h-9 rounded-full bg-[#252840] text-white flex items-center justify-center font-bold text-[13px] flex-shrink-0">
              {initials}
            </div>
            <span className="text-[14px] text-[color:var(--muted-fg)]">{t('feed.composerPlaceholder')}</span>
            <svg className="ml-auto text-[#7A6E5C]" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M8 1v14M1 8h14"/>
            </svg>
          </button>
        )}

        {/* Modal nouveau post */}
        {addOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setAddOpen(false)}>
            <div className="bg-white rounded-2xl p-7 w-full max-w-[500px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-black text-[#1A1410]">{t('feed.newPost')}</h2>
                <button onClick={() => setAddOpen(false)} aria-label={t('actions.close')}
                  className="w-8 h-8 rounded-full bg-black/[0.06] border-none cursor-pointer text-[#7A6E5C] flex items-center justify-center hover:bg-black/10 transition-all">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
                </button>
              </div>
              <textarea
                value={newText} onChange={e => setNewText(e.target.value)}
                placeholder={t('feed.textPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-black/[0.09] bg-[#F8F8F8] text-[14px] outline-none focus:border-[#252840] transition-all resize-none h-28 mb-3"
                autoFocus
              />
              <div className="mb-4">
                <input
                  value={newTag} onChange={e => setNewTag(e.target.value)}
                  placeholder={t('feed.tagPlaceholder')}
                  className="w-full px-4 py-[10px] rounded-xl border-[1.5px] border-black/[0.09] bg-[#F8F8F8] text-[13px] outline-none focus:border-[#252840] transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAddOpen(false)}
                  className="flex-1 py-3 rounded-xl border-[1.5px] border-black/[0.09] text-[13px] font-semibold text-[#7A6E5C] bg-transparent cursor-pointer hover:border-[#1A1410] transition-all">
                  {t('actions.cancel')}
                </button>
                <button onClick={addPost} disabled={!newText.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#252840] text-white text-[13px] font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-all disabled:opacity-40">
                  {t('feed.publish')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des posts */}
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-black/[0.09]">
            <div className="w-14 h-14 rounded-2xl bg-[#ECEEF8] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#252840" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-[16px] font-semibold text-[#1A1410] mb-2">{t('feed.emptyTitle')}</p>
            <p className="text-[13px] text-[#7A6E5C] mb-5 max-w-[320px] mx-auto">
              {t('feed.emptyText')}
            </p>
            {user ? (
              <button onClick={() => setAddOpen(true)}
                className="px-5 py-3 rounded-xl bg-[#252840] text-white text-[13px] font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-all">
                {t('feed.writePost')}
              </button>
            ) : (
              <button onClick={() => navigate('/')}
                className="px-5 py-3 rounded-xl bg-[#252840] text-white text-[13px] font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-all">
                {t('feed.join')}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map(post => (
              <article key={post.id} className="bg-white rounded-2xl border border-black/[0.09] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] text-white flex-shrink-0"
                    style={{ background: post.color }}>
                    {post.initials}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#1A1410]">{post.author}</p>
                    <p className="text-[11px] text-[#7A6E5C]">{post.time}</p>
                  </div>
                </div>

                <p className="text-[14px] text-[#3D3020] leading-[1.65] mb-3">{post.text}</p>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-2 py-[3px] rounded-full bg-[#ECEEF8] text-[#252840] text-[11px] font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-black/[0.06]">
                  <button onClick={() => toggleLike(post.id)} aria-label={t('feed.like')} aria-pressed={liked.has(post.id)}
                    className={`flex items-center gap-2 text-[12px] font-semibold bg-transparent border-none cursor-pointer transition-all
                      ${liked.has(post.id) ? 'text-[color:var(--warm-strong)]' : 'text-[#7A6E5C] hover:text-[#1A1410]'}`}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill={liked.has(post.id) ? '#C8864B' : 'none'} stroke="currentColor" strokeWidth="1.5">
                      <path d="M7 12S1 8.5 1 4.5a3 3 0 0 1 6-1 3 3 0 0 1 6 1C13 8.5 7 12 7 12z"/>
                    </svg>
                    {post.likes + (liked.has(post.id) ? 1 : 0)}
                  </button>
                  <span className="text-[12px] text-[#7A6E5C]">
                    {t('feed.comments', { count: post.comments })}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}