// src/components/BlockedList.jsx
// Liste des personnes bloquées (GET /blocks) avec déblocage (DELETE /blocks/:id).
// Affiché dans les Paramètres.
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban } from 'lucide-react'
import { blockApi } from '../services/api'

function displayName(block) {
  const u = block.blockedUser ?? block.user ?? block
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || '—'
}

// L'id à envoyer à DELETE /blocks/:id est celui de la personne bloquée.
function blockedUserId(block) {
  return block.blockedUserId ?? block.blockedUser?.id ?? block.user?.id ?? block.id
}

export default function BlockedList() {
  const { t, i18n } = useTranslation()
  const [blocks,  setBlocks]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [busyId,  setBusyId]  = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await blockApi.list()
      setBlocks(Array.isArray(data) ? data : [])
      setError('')
    } catch {
      setError(t('block.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { load() }, [load])

  const handleUnblock = async (id) => {
    setBusyId(id)
    setError('')
    try {
      await blockApi.unblock(id)
      setBlocks(prev => prev.filter(b => blockedUserId(b) !== id))
    } catch {
      setError(t('block.actionError'))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-[color:var(--muted-fg)]">{t('actions.loading')}</p>
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      {blocks.length === 0 ? (
        <p className="rounded-2xl bg-cream p-4 text-sm text-[color:var(--muted-fg)]">{t('block.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {blocks.map(b => {
            const id = blockedUserId(b)
            const name = displayName(b)
            return (
              <li
                key={id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-light-cream p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-cream text-[color:var(--muted-fg)]">
                    <Ban size={15} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{name}</p>
                    {b.createdAt && (
                      <p className="text-xs text-[color:var(--muted-fg)]">
                        {t('block.blockedOn', {
                          date: new Date(b.createdAt).toLocaleDateString(i18n.language, {
                            day: '2-digit', month: 'short', year: 'numeric',
                          }),
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(id)}
                  disabled={busyId === id}
                  className="cursor-pointer rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-semibold text-navy hover:border-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busyId === id ? t('actions.loading') : t('block.unblock')}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
