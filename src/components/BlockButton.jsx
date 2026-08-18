// src/components/BlockButton.jsx
// Bloquer une personne depuis son profil. Le blocage est une préférence
// personnelle (POST /blocks/:id) : il masque la personne pour soi et
// n'alerte PAS la modération — le signalement est là pour ça. La boîte de
// confirmation le dit explicitement pour éviter la confusion entre les deux.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban } from 'lucide-react'
import useFocusTrap from '../hooks/useFocusTrap'
import { blockApi } from '../services/api'

export default function BlockButton({ userId, userName = '', onBlocked, className = '' }) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const [busy,       setBusy]       = useState(false)
  const [blocked,    setBlocked]    = useState(false)
  const [error,      setError]      = useState('')

  const dialogRef = useFocusTrap(confirming, () => setConfirming(false))

  const handleBlock = async () => {
    setBusy(true)
    setError('')
    try {
      await blockApi.block(userId)
      setBlocked(true)
      setConfirming(false)
      onBlocked?.(userId)
    } catch {
      setError(t('block.actionError'))
    } finally {
      setBusy(false)
    }
  }

  if (blocked) {
    return (
      <span className={`inline-flex items-center gap-2 rounded-xl bg-cream px-5 py-[10px] text-[13px] font-bold text-[color:var(--muted-fg)] ${className}`}>
        <Ban size={14} aria-hidden="true" />
        {t('block.blocked')}
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`inline-flex items-center gap-2 rounded-xl border-[1.5px] border-black/[0.09] bg-transparent px-5 py-[10px] text-[13px] font-semibold text-[color:var(--muted-fg)] cursor-pointer hover:border-red-300 hover:text-red-600 transition-all ${className}`}
      >
        <Ban size={14} aria-hidden="true" />
        {t('block.action')}
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(26,20,16,0.6)] p-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setConfirming(false) }}
        >
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="block-confirm-title"
            className="animate-modal-in w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-white p-8 shadow-soft"
          >
            <h2 id="block-confirm-title" className="text-xl font-black tracking-tight text-navy">
              {t('block.confirmTitle', { name: userName })}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted-fg)]">
              {t('block.confirmText')}
            </p>

            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleBlock}
                disabled={busy}
                className="flex-1 cursor-pointer rounded-full border-none bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? t('actions.sending') : t('block.confirm')}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 cursor-pointer rounded-full border-2 border-navy bg-transparent px-5 py-3 text-sm font-bold text-navy hover:bg-navy hover:text-white transition-colors"
              >
                {t('actions.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
