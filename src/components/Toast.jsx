import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

// Les erreurs interrompent la lecture en cours (assertive), le reste attend une
// pause (polite). Les deux régions sont rendues en permanence, même vides :
// une région live insérée en même temps que son contenu n'est pas annoncée.
const LIVE_REGIONS = [
  { key: 'assertive', live: 'assertive', role: 'alert',  match: (type) => type === 'error' },
  { key: 'polite',    live: 'polite',    role: 'status', match: (type) => type !== 'error' },
]

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const icons = {
    success: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7l4 4 6-6"/></svg>,
    error:   <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>,
    info:    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 4.5v0M7 7v3"/></svg>,
  }

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-[9999] pointer-events-none">
        {LIVE_REGIONS.map(region => (
          <div
            key={region.key}
            role={region.role}
            aria-live={region.live}
            aria-atomic="false"
            className="flex flex-col gap-2"
          >
            {toasts.filter(t => region.match(t.type)).map(t => (
              <div key={t.id}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-white text-[13px] font-semibold shadow-lg pointer-events-auto
                  ${t.type === 'success' ? 'bg-[#3D5C28]'
                    : t.type === 'error' ? 'bg-red-600'
                    : 'bg-[#252840]'}`}
                style={{ animation: 'slideInRight 0.25s ease' }}>
                <span className="flex-shrink-0" aria-hidden="true">{icons[t.type]}</span>
                {t.message}
              </div>
            ))}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
