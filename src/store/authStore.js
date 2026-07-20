import { create } from 'zustand'
import { disconnectSocket } from '../services/socket'

const useAuthStore = create((set) => ({
  user:      null,
  token:     localStorage.getItem('sb_token') || null,
  authReady: false,

  modalOpen: false,
  modalMode: 'login',

  login: (user, token) => {
    localStorage.setItem('sb_token', token)
    set({ user, token, modalOpen: false, authReady: true })
  },

  logout: () => {
    localStorage.removeItem('sb_token')
    disconnectSocket()
    set({ user: null, token: null, authReady: true })
  },

  setUser:       (user) => set({ user, authReady: true }),
  markAuthReady: ()     => set({ authReady: true }),

  openModal:  (mode = 'login') => set({ modalOpen: true,  modalMode: mode }),
  closeModal: ()               => set({ modalOpen: false }),
  switchMode: (mode)           => set({ modalMode: mode }),
}))

export default useAuthStore