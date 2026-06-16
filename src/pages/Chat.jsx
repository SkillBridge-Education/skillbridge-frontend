import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, Pin, Archive, Trash2, Paperclip,
  Image as ImageIcon, Video as VideoIcon, File as FileIcon,
  Send, ChevronLeft, MessageCircle,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { convApi, getApiError } from '../services/api'
import api from '../services/api'
import { useToast } from '../components/Toast'
import { FILE_UPLOAD_ENABLED, CHAT_DELETE_ENABLED, CHAT_ARCHIVE_ENABLED, CHAT_PIN_ENABLED } from '../config/features'
import ChatBackdrop from '../components/ChatBackdrop'

const CLOUDINARY_URL    = 'https://api.cloudinary.com/v1_1/derho2rib/auto/upload'
const CLOUDINARY_PRESET = 'skillbridge_avatars'

const CONV_COLORS = ['#252840', '#C8864B', '#3D5C28', '#363B6B']
function convColor(name) {
  const c = (name || '').charCodeAt(0) || 0
  return CONV_COLORS[c % CONV_COLORS.length]
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024)    return `${bytes} o`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1048576).toFixed(1)} Mo`
}

function fileIcon(type) {
  if (type?.startsWith('video/')) return <VideoIcon size={16} />
  return <FileIcon size={16} />
}

function ConvAvatar({ conv }) {
  if (conv.avatarUrl) {
    return (
      <img src={conv.avatarUrl} alt={conv.name}
        className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
    )
  }
  return (
    <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
      style={{ background: conv.color }}>
      {conv.initials}
    </div>
  )
}

function getDateLabel(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString())     return "Aujourd'hui"
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr', { day: '2-digit', month: 'long', year: 'numeric' })
}

function groupByDate(msgs) {
  const groups = []
  let key = null
  msgs.forEach(m => {
    const dk = m.rawCreatedAt ? new Date(m.rawCreatedAt).toDateString() : 'x'
    if (dk !== key) { key = dk; groups.push({ label: getDateLabel(m.rawCreatedAt), msgs: [] }) }
    groups[groups.length - 1].msgs.push(m)
  })
  return groups
}

function mapMessage(m, userId) {
  const isImg   = m.fileUrl && (m.mimeType ?? m.fileType ?? '').startsWith('image/')
  const isVideo = m.fileUrl && (m.mimeType ?? m.fileType ?? '').startsWith('video/')
  const isFile  = m.fileUrl && !isImg && !isVideo
  return {
    id:           m.id,
    from:         m.sender.id === userId ? 'me' : 'them',
    senderName:   `${m.sender.firstName} ${m.sender.lastName}`,
    text:         m.body ?? null,
    fileUrl:      m.fileUrl ?? null,
    fileName:     m.fileName ?? null,
    fileSize:     m.fileSize ?? null,
    fileType:     m.mimeType ?? m.fileType ?? null,
    msgType:      isImg ? 'image' : isVideo ? 'video' : isFile ? 'file' : 'text',
    time:         new Date(m.createdAt).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }),
    rawCreatedAt: m.createdAt,
  }
}

export default function Chat() {
  const { user }  = useAuthStore()
  const addToast  = useToast()

  const [conversations,  setConversations]  = useState([])
  const [archivedConvs,  setArchivedConvs]  = useState([])
  const [convView,       setConvView]       = useState('active')
  const [activeId,       setActiveId]       = useState(null)
  const [messages,       setMessages]       = useState({})
  const [input,          setInput]          = useState('')
  const [loading,        setLoading]        = useState(true)
  const [sending,        setSending]        = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [showAttach,     setShowAttach]     = useState(false)
  const [lightbox,       setLightbox]       = useState(null)
  const [showThread,     setShowThread]     = useState(false)
  const [search,         setSearch]         = useState('')
  const [convMenu,       setConvMenu]       = useState(null)
  const [hoveredMsg,     setHoveredMsg]     = useState(null)

  const messagesEndRef = useRef(null)
  const pollRef        = useRef(null)
  const fileRef        = useRef(null)
  const imageRef       = useRef(null)
  const videoRef       = useRef(null)
  const attachBarRef   = useRef(null)

  const active = conversations.find(c => c.id === activeId)
  const msgs   = messages[activeId] ?? []

  const filteredConvs = conversations.filter(c =>
    !search.trim() || c.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (!showAttach) return
    const onMouse = (e) => {
      if (!attachBarRef.current?.contains(e.target)) setShowAttach(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setShowAttach(false) }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [showAttach])

  useEffect(() => {
    if (!convMenu) return
    const handler = () => setConvMenu(null)
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [convMenu])

  useEffect(() => {
    if (!user) return
    convApi.list()
      .then(data => {
        const all = (data.conversations ?? data).map(c => ({
          id:        c.id,
          status:    c.status ?? 'ACTIVE',
          name:      `${c.other.firstName} ${c.other.lastName}`,
          initials:  `${c.other.firstName[0]}${c.other.lastName[0]}`.toUpperCase(),
          color:     convColor(c.other.firstName),
          avatarUrl: c.other?.avatarUrl ?? null,
          preview:   c.lastMessage?.body ?? '',
          time:      c.lastMessage
            ? new Date(c.lastMessage.createdAt).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })
            : '',
          unread: c.unreadCount ?? 0,
        }))
        const active   = all.filter(c => c.status !== 'ARCHIVED')
        const archived = all.filter(c => c.status === 'ARCHIVED')
        setConversations(active)
        setArchivedConvs(archived)
        if (active.length > 0) setActiveId(active[0].id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id])

  const fetchMessages = useCallback((convId) => {
    convApi.messages(convId)
      .then(data => {
        const mapped = (data.messages ?? data).map(m => mapMessage(m, user?.id))
        setMessages(prev => ({ ...prev, [convId]: mapped }))
      })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    if (!activeId) return
    fetchMessages(activeId)
    pollRef.current = setInterval(() => fetchMessages(activeId), 3000)
    return () => clearInterval(pollRef.current)
  }, [activeId, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = async () => {
    if (!input.trim() || !activeId || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    const tmp = {
      id: Date.now(), from: 'me', msgType: 'text', text,
      time: new Date().toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }),
      rawCreatedAt: new Date().toISOString(),
    }
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), tmp] }))
    try { await convApi.send(activeId, text) }
    catch (e) { console.error(getApiError(e)) }
    finally { setSending(false) }
  }

  const uploadCloudinary = async (file) => {
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', CLOUDINARY_PRESET)
    const res  = await fetch(CLOUDINARY_URL, { method: 'POST', body: form })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return { url: data.secure_url, fileType: file.type, fileName: file.name, fileSize: file.size }
  }

  const sendFileToBackend = async (fileUrl, file, msgType) => {
    await api.post(`/conversations/${activeId}/messages/file`, { fileUrl })
    const tmp = {
      id: Date.now(), from: 'me', msgType,
      fileUrl, fileName: file.name, fileSize: file.size, fileType: file.type,
      time: new Date().toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }),
      rawCreatedAt: new Date().toISOString(),
    }
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), tmp] }))
  }

  const uploadFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeId || !FILE_UPLOAD_ENABLED) return
    e.target.value = ''
    setShowAttach(false)
    setUploading(true)
    try {
      const { url } = await uploadCloudinary(file)
      await sendFileToBackend(url, file, 'file')
      addToast?.('Fichier envoyé', 'success')
    } catch { addToast?.("Erreur lors de l'envoi du fichier", 'error') }
    finally { setUploading(false) }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeId || !FILE_UPLOAD_ENABLED) return
    e.target.value = ''
    setShowAttach(false)
    setUploading(true)
    try {
      const { url } = await uploadCloudinary(file)
      await sendFileToBackend(url, file, 'image')
      addToast?.('Image envoyée', 'success')
    } catch { addToast?.("Erreur lors de l'envoi de l'image", 'error') }
    finally { setUploading(false) }
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeId || !FILE_UPLOAD_ENABLED) return
    e.target.value = ''
    setShowAttach(false)
    setUploading(true)
    try {
      const { url } = await uploadCloudinary(file)
      await sendFileToBackend(url, file, 'video')
      addToast?.('Vidéo envoyée', 'success')
    } catch { addToast?.("Erreur lors de l'envoi de la vidéo", 'error') }
    finally { setUploading(false) }
  }

  const openConversation = (convId) => {
    setActiveId(convId)
    setShowThread(true)
    setConvMenu(null)
  }

  const handlePinConv = (convId) => {
    setConvMenu(null)
    addToast?.('Bientôt disponible', 'info')
  }

  const handleArchiveConv = async (convId) => {
    setConvMenu(null)
    if (!CHAT_ARCHIVE_ENABLED) { addToast?.('Bientôt disponible', 'info'); return }
    try {
      await convApi.archive(convId)
      const conv = conversations.find(c => c.id === convId)
      if (conv) {
        setConversations(prev => prev.filter(c => c.id !== convId))
        setArchivedConvs(prev => [...prev, conv])
        if (activeId === convId) { setActiveId(null); setShowThread(false) }
      }
    } catch { addToast?.("Erreur lors de l'archivage", 'error') }
  }

  const handleDeleteConv = async (convId) => {
    setConvMenu(null)
    if (!CHAT_DELETE_ENABLED) { addToast?.('Bientôt disponible', 'info'); return }
    try {
      await convApi.destroy(convId)
      setConversations(prev => prev.filter(c => c.id !== convId))
      if (activeId === convId) { setActiveId(null); setShowThread(false) }
    } catch { addToast?.('Erreur lors de la suppression', 'error') }
  }

  const handleUnarchiveConv = async (convId) => {
    if (!CHAT_ARCHIVE_ENABLED) { addToast?.('Bientôt disponible', 'info'); return }
    try {
      await convApi.unarchive(convId)
      const conv = archivedConvs.find(c => c.id === convId)
      if (conv) {
        setArchivedConvs(prev => prev.filter(c => c.id !== convId))
        setConversations(prev => [conv, ...prev])
      }
    } catch { addToast?.('Erreur lors du désarchivage', 'error') }
  }

  const handleDeleteMsg = (msgId) => {
    addToast?.('Bientôt disponible', 'info')
  }

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 68px)', background: 'var(--cream)' }}>
      <div className="w-8 h-8 border-2 border-[#252840]/20 border-t-[#252840] rounded-full animate-spin" />
    </div>
  )

  const grouped = groupByDate(msgs)

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[600] bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Aperçu" className="max-w-full max-h-full object-contain rounded-xl" />
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center border-none cursor-pointer hover:bg-white/30">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
          </button>
        </div>
      )}

      <main className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 68px)', background: 'var(--cream)' }}>
        <div className="flex flex-1 overflow-hidden sm:p-4">
        <div className="flex flex-1 overflow-hidden sm:rounded-3xl sm:border sm:border-[#E8DDC7] sm:shadow-sm">

        {/* ── Sidebar ── */}
        <div className={`flex-shrink-0 w-full sm:w-80 bg-white sm:border-r border-r border-[#E8DDC7] flex flex-col ${showThread ? 'hidden sm:flex' : 'flex'}`}>

          {/* Sidebar header — toggle Actives / Archivées */}
          <div className="px-5 py-4 border-b border-[#E8DDC7]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-[#252840]">
                {convView === 'active' ? 'Messages' : 'Archivées'}
              </h2>
              <div className="inline-flex rounded-full border border-[#E8DDC7] bg-[#F8F4EA] p-0.5">
                <button
                  onClick={() => setConvView('active')}
                  className={`rounded-full px-3 py-1 text-xs font-bold border-none cursor-pointer transition-colors ${
                    convView === 'active'
                      ? 'bg-white text-[#252840] shadow-sm'
                      : 'bg-transparent text-[#756B5B] hover:text-[#252840]'
                  }`}>
                  Actives
                </button>
                <button
                  onClick={() => setConvView('archived')}
                  className={`rounded-full px-3 py-1 text-xs font-bold border-none cursor-pointer transition-colors ${
                    convView === 'archived'
                      ? 'bg-white text-[#252840] shadow-sm'
                      : 'bg-transparent text-[#756B5B] hover:text-[#252840]'
                  }`}>
                  Archivées
                </button>
              </div>
            </div>
            {convView === 'active' && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A898]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full h-9 pl-8 pr-3 rounded-full border border-[#E8DDC7] bg-[#FDFAF4] text-sm outline-none focus:border-[#C8864B] transition-colors"
                />
              </div>
            )}
          </div>

          {/* Sidebar conversation list */}
          <div className="flex-1 overflow-y-auto">

            {/* ─ Archived view ─ */}
            {convView === 'archived' && (
              !CHAT_ARCHIVE_ENABLED ? (
                <div className="p-8 text-center">
                  <Archive size={36} className="mx-auto mb-3 text-[#E8DDC7]" />
                  <p className="text-sm font-semibold text-[#252840]">Archivage bientôt disponible</p>
                  <p className="text-xs text-[#756B5B] mt-1">Cette fonctionnalité arrive prochainement.</p>
                </div>
              ) : archivedConvs.length === 0 ? (
                <div className="p-8 text-center">
                  <Archive size={36} className="mx-auto mb-3 text-[#E8DDC7]" />
                  <p className="text-sm font-semibold text-[#252840]">Aucune conversation archivée</p>
                </div>
              ) : (
                archivedConvs.map(conv => (
                  <div key={conv.id} className="flex items-center gap-3 px-5 py-4 border-b border-[#F0EAE0]">
                    <ConvAvatar conv={conv} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#252840] truncate">{conv.name}</p>
                      <p className="text-xs text-[#756B5B] truncate">{conv.preview || '—'}</p>
                    </div>
                    <button
                      onClick={() => handleUnarchiveConv(conv.id)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full border border-[#E8DDC7] text-xs font-semibold text-[#252840] bg-transparent cursor-pointer hover:bg-[#F8F4EA] transition-colors">
                      Activer
                    </button>
                  </div>
                ))
              )
            )}

            {/* ─ Active conversations view ─ */}
            {convView === 'active' && (
              conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="mx-auto mb-3 text-[#E8DDC7]" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M35 25a5 5 0 01-5 5H12L5 36V10a5 5 0 015-5h20a5 5 0 015 5v15z"/>
                  </svg>
                  <p className="text-sm font-semibold text-[#252840]">Aucune conversation</p>
                  <p className="text-xs text-[#756B5B] mt-1">Connecte-toi à d'autres élèves pour démarrer.</p>
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#756B5B]">Aucun résultat</div>
              ) : filteredConvs.map(conv => (
                <div key={conv.id} className="relative group">
                  <button onClick={() => openConversation(conv.id)}
                    className={`w-full flex items-center gap-3 px-5 py-4 border-b border-[#F0EAE0] text-left transition-colors cursor-pointer ${
                      activeId === conv.id ? 'bg-[rgba(37,40,64,0.06)]' : 'bg-transparent hover:bg-[#F8F4EA]'
                    }`}>
                    <ConvAvatar conv={conv} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#252840] truncate">{conv.name}</span>
                        <span className="text-[10px] text-[#B0A898] flex-shrink-0 ml-1">{conv.time}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-[#756B5B] truncate">{conv.preview || 'Démarrez la conversation'}</span>
                        {conv.unread > 0 && (
                          <span className="ml-2 h-5 w-5 rounded-full bg-[#C8864B] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Conv actions menu button */}
                  <button
                    onClick={e => { e.stopPropagation(); setConvMenu(convMenu === conv.id ? null : conv.id) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white border border-[#E8DDC7] items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden group-hover:flex z-10 shadow-sm"
                    title="Actions"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="#756B5B" aria-hidden><circle cx="6" cy="2" r="1.2"/><circle cx="6" cy="6" r="1.2"/><circle cx="6" cy="10" r="1.2"/></svg>
                  </button>

                  {convMenu === conv.id && (
                    <div className="absolute right-2 top-10 z-20 w-48 bg-white rounded-2xl border border-[#E8DDC7] shadow-soft overflow-hidden animate-modal-in">
                      <button
                        onClick={() => handlePinConv(conv.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-[#F8F4EA] cursor-pointer bg-transparent border-none transition-colors text-[#252840]"
                      >
                        <Pin size={13} />
                        Épingler
                        {!CHAT_PIN_ENABLED && <span className="ml-auto text-[10px] text-[#B0A898]">bientôt</span>}
                      </button>
                      <button
                        onClick={() => handleArchiveConv(conv.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-[#F8F4EA] cursor-pointer bg-transparent border-none transition-colors text-[#252840] border-t border-[#F0EAE0]"
                      >
                        <Archive size={13} />
                        Archiver
                        {!CHAT_ARCHIVE_ENABLED && <span className="ml-auto text-[10px] text-[#B0A898]">bientôt</span>}
                      </button>
                      <button
                        onClick={() => handleDeleteConv(conv.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-red-50 cursor-pointer bg-transparent border-none transition-colors text-red-500 border-t border-[#F0EAE0]"
                      >
                        <Trash2 size={13} />
                        Supprimer
                        {!CHAT_DELETE_ENABLED && <span className="ml-auto text-[10px] text-[#B0A898]">bientôt</span>}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Thread ── */}
        <div className={`flex-1 flex flex-col overflow-hidden ${!showThread && 'hidden sm:flex'}`}>

          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#756B5B]">
              <MessageCircle size={48} className="text-[#E8DDC7]" />
              <p className="text-sm font-semibold">Sélectionnez une conversation</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="bg-white border-b border-[#E8DDC7] px-5 py-4 flex items-center gap-3">
                <button
                  onClick={() => setShowThread(false)}
                  className="sm:hidden h-8 w-8 rounded-full bg-[#F8F4EA] flex items-center justify-center border-none cursor-pointer mr-1 flex-shrink-0">
                  <ChevronLeft size={16} className="text-[#252840]" />
                </button>
                <ConvAvatar conv={active} />
                <div>
                  <p className="font-bold text-[#252840] text-sm">{active.name}</p>
                </div>
              </div>

              {/* Messages area */}
              <div className="relative flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-0" style={{ background: 'var(--cream)' }}>
                <ChatBackdrop />
                {msgs.length === 0 ? (
                  <div className="relative flex-1 flex flex-col items-center justify-center gap-2 py-16 z-10">
                    <MessageCircle size={40} className="text-[#E8DDC7]" />
                    <p className="text-sm text-[#756B5B] font-semibold">Commencez la conversation</p>
                  </div>
                ) : (
                  grouped.map((group, gi) => (
                    <div key={gi} className="relative z-10">
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-[#E8DDC7]" />
                        <span className="text-[10px] font-semibold text-[#B0A898] uppercase tracking-wide">{group.label}</span>
                        <div className="flex-1 h-px bg-[#E8DDC7]" />
                      </div>

                      <div className="flex flex-col gap-3">
                        {group.msgs.map(msg => {
                          const isMe = msg.from === 'me'
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg relative`}
                              onMouseEnter={() => setHoveredMsg(msg.id)}
                              onMouseLeave={() => setHoveredMsg(null)}
                            >
                              {isMe && hoveredMsg === msg.id && (
                                <button
                                  onClick={() => handleDeleteMsg(msg.id)}
                                  title={CHAT_DELETE_ENABLED ? 'Supprimer le message' : 'Bientôt disponible'}
                                  className="self-center mr-2 flex-shrink-0 h-7 w-7 rounded-full bg-white border border-[#E8DDC7] items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm flex text-[#756B5B]"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                              <div className={`max-w-[70%] rounded-2xl overflow-hidden ${
                                msg.msgType === 'image' || msg.msgType === 'video' ? '' : 'px-4 py-3'
                              } ${isMe
                                ? 'bg-[#252840] text-[#F8F4EA] rounded-br-sm'
                                : 'bg-[#F8F4EA] rounded-bl-sm text-[#252840]'
                              }`}>
                                {msg.msgType === 'image' && (
                                  <div>
                                    <img src={msg.fileUrl} alt={msg.fileName}
                                      className="max-w-[220px] rounded-2xl border border-[rgba(0,0,0,0.06)] cursor-pointer block"
                                      onClick={() => setLightbox(msg.fileUrl)} />
                                    <div className={`px-3 py-1 text-[10px] ${isMe ? 'text-white/50' : 'text-[#756B5B]'}`}>{msg.time}</div>
                                  </div>
                                )}
                                {msg.msgType === 'video' && (
                                  <div>
                                    <video src={msg.fileUrl} controls className="max-w-[220px] rounded-2xl block bg-black" />
                                    <div className={`px-3 py-1 text-[10px] ${isMe ? 'text-white/50' : 'text-[#756B5B]'}`}>{msg.time}</div>
                                  </div>
                                )}
                                {msg.msgType === 'file' && (
                                  <div>
                                    <a href={msg.fileUrl} target="_blank" rel="noreferrer"
                                      className={`flex items-center gap-3 no-underline p-1 ${isMe ? 'text-[#F8F4EA]' : 'text-[#252840]'}`}>
                                      <span className="h-10 w-10 rounded-xl bg-[rgba(200,134,75,0.12)] flex items-center justify-center text-xl flex-shrink-0">
                                        {fileIcon(msg.fileType)}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate underline">{msg.fileName}</p>
                                        {msg.fileSize && <p className={`text-[10px] ${isMe ? 'text-white/50' : 'text-[#756B5B]'}`}>{formatBytes(msg.fileSize)}</p>}
                                      </div>
                                    </a>
                                    <div className={`text-[10px] mt-1 px-1 ${isMe ? 'text-white/50' : 'text-[#756B5B]'}`}>{msg.time}</div>
                                  </div>
                                )}
                                {msg.msgType === 'text' && (
                                  <>
                                    <span className="text-sm leading-relaxed">{msg.text}</span>
                                    <div className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-[#756B5B]'}`}>{msg.time}</div>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} className="relative z-10" />
              </div>

              {/* Input area */}
              <div className="bg-white border-t border-[#E8DDC7] px-4 py-3">
                <input ref={fileRef}  type="file" accept="*/*"     className="hidden" onChange={uploadFile} />
                <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />

                <div className="relative flex gap-2 items-center">
                  {showAttach && (
                    <div ref={attachBarRef}
                      className="absolute bottom-full left-0 mb-2 w-40 rounded-2xl bg-white border border-[#E8DDC7] shadow-soft overflow-hidden z-20 animate-modal-in">
                      {[
                        { label: 'Image',   Icon: ImageIcon, action: () => imageRef.current?.click() },
                        { label: 'Vidéo',   Icon: VideoIcon, action: () => videoRef.current?.click() },
                        { label: 'Fichier', Icon: FileIcon,  action: () => fileRef.current?.click()  },
                      ].map(btn => (
                        <button key={btn.label} type="button"
                          disabled={!FILE_UPLOAD_ENABLED}
                          onClick={() => { if (FILE_UPLOAD_ENABLED) { btn.action(); setShowAttach(false) } }}
                          title={!FILE_UPLOAD_ENABLED ? 'Bientôt disponible' : undefined}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold border-none cursor-pointer transition-colors text-[#252840] hover:bg-[#F8F4EA] bg-transparent disabled:opacity-50 disabled:cursor-not-allowed border-b border-[#F0EAE0] last:border-0"
                        >
                          <btn.Icon size={15} className="flex-shrink-0 text-[#756B5B]" />
                          {btn.label}
                          {!FILE_UPLOAD_ENABLED && <span className="ml-auto text-[10px] text-[#B0A898]">bientôt</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  <button type="button"
                    onClick={() => setShowAttach(s => !s)}
                    disabled={uploading || !activeId}
                    title="Joindre un fichier"
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-none cursor-pointer transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                      showAttach ? 'bg-[#252840] text-white' : 'bg-[#F8F4EA] text-[#756B5B] hover:bg-[#252840] hover:text-white'
                    }`}>
                    {uploading
                      ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      : <Paperclip size={16} />}
                  </button>

                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder="Écrire un message…"
                    className="flex-1 h-10 px-4 rounded-full border border-[#E8DDC7] bg-[#FDFAF4] text-sm outline-none focus:border-[#C8864B] transition-colors"
                  />

                  <button onClick={send} disabled={sending}
                    className="h-10 w-10 rounded-full bg-[#C8864B] text-white border-none cursor-pointer hover:bg-[#B07030] transition-colors disabled:opacity-50 flex items-center justify-center flex-shrink-0">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        </div>{/* rounded container */}
        </div>{/* padding wrapper */}
      </main>
    </>
  )
}
