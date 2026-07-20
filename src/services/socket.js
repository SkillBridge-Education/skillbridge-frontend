// src/services/socket.js
// Thin singleton wrapper around socket.io-client, authenticated with the same
// JWT used for REST calls (see backend src/sockets/index.ts).
import { io } from 'socket.io-client'
import useAuthStore from '../store/authStore'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

let socket = null

export const getSocket = () => {
  const token = useAuthStore.getState().token
  if (!token) return null

  if (!socket) {
    socket = io(SOCKET_URL, { auth: { token }, autoConnect: false })
  }
  socket.auth = { token }
  if (!socket.connected) socket.connect()

  return socket
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}
