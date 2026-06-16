import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'
import useAuthStore from '../store/authStore'

const POLL_MS = 25000

const typeToLink = (type) => {
  if (type === 'CONNECTION_REQUEST' || type === 'CONNECTION_ACCEPTED') return '/connection'
  if (type === 'MESSAGE_RECEIVED') return '/chat'
  if (type?.startsWith('SESSION_')) return '/sessions'
  return '/'
}

export default function useNotifications() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const pollRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await api.get('/notifications')
      const raw = Array.isArray(res.data) ? res.data : []
      setNotifications(
        raw.map(n => ({ ...n, link: typeToLink(n.type) }))
      )
    } catch { /* ignore */ }
  }, [user])

  useEffect(() => {
    if (!user) { setNotifications([]); return }
    fetchNotifications()
    pollRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') fetchNotifications()
    }, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [user?.id, fetchNotifications])

  const dismiss = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try { await api.patch(`/notifications/${id}/read`) } catch { /* ignore */ }
  }, [])

  const dismissAll = useCallback(async () => {
    const unread = notifications.filter(n => !n.read)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await Promise.allSettled(unread.map(n => api.patch(`/notifications/${n.id}/read`)))
  }, [notifications])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, dismiss, dismissAll, unreadCount }
}
