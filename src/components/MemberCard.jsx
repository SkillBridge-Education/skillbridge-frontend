// MemberCard — Card membre stylisée pour la page Connexion
import { useTranslation } from 'react-i18next'

function StarRating({ value, t }) {
  const hasRating = value !== undefined && value !== null && value > 0
  return (
    <div className="flex items-center gap-[3px]">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = hasRating && i <= Math.floor(value)
        const partial = hasRating && !filled && i <= value + 0.5
        return (
          <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1L7.35 4.18L10.85 4.54L8.31 6.79L9.09 10.21L6 8.38L2.91 10.21L3.69 6.79L1.15 4.54L4.65 4.18L6 1Z"
              fill={filled || partial ? '#C8864B' : 'none'}
              stroke={hasRating ? '#C8864B' : '#C0B8AC'}
              strokeWidth="0.8"
            />
          </svg>
        )
      })}
      <span className="text-[11px] text-[#7A6E5C] ml-1 font-semibold">
        {hasRating ? value.toFixed(1) : '—'}
      </span>
      <span className="text-[10px] text-[color:var(--muted-fg)] ml-1">{t('member.rateAfter')}</span>
    </div>
  )
}

function AvailBadge({ availability }) {
  const slots = Object.values(availability || {}).flat()
  const count = slots.filter(Boolean).length
  const ratio = slots.length > 0 ? count / slots.length : 0

  if (ratio >= 0.5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full bg-[#E4EED8] text-[#3D5C28] text-[10px] font-bold">
        <span className="w-[6px] h-[6px] rounded-full bg-[#3D5C28] inline-block" />
        Disponible
      </span>
    )
  }
  if (ratio > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full bg-[#FAF5E8] text-[#8C5A1E] text-[10px] font-bold">
        <span className="w-[6px] h-[6px] rounded-full bg-[#C8864B] inline-block" />
        Peu dispo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full bg-[#F5F3EE] text-[color:var(--muted-fg)] text-[10px] font-bold">
      <span className="w-[6px] h-[6px] rounded-full bg-[#C0B8AC] inline-block" />
      Indisponible
    </span>
  )
}

export default function MemberCard({ member, onClick, connectionState, onReserve }) {
  const { t } = useTranslation()
  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-black/[0.08] p-5 flex flex-col gap-3 cursor-pointer hover:shadow-[0_8px_32px_rgba(26,20,16,0.10)] hover:-translate-y-[2px] transition-all duration-200 group"
    >
      {/* Avatar + dispo */}
      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-black text-[16px] text-white flex-shrink-0"
          style={{ background: member.color }}
        >
          {initials}
        </div>
        <AvailBadge availability={member.availability} />
      </div>

      {/* Nom + ville */}
      <div>
        <p className="text-[15px] font-bold text-[#1A1410] leading-tight">
          {member.firstName} {member.lastName}
        </p>
        <p className="text-[12px] text-[#7A6E5C] mt-[2px]">
          {member.city}{member.age ? `, ${member.age} ans` : ''}
        </p>
      </div>

      {/* Étoiles + texte */}
      <StarRating value={member.reputation} t={t} />

      {/* Skills */}
      <div className="flex flex-col gap-[6px]">
        {member.teaches?.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[color:var(--warm-strong)] mr-1">{t('member.shares')}</span>
            {member.teaches.slice(0, 2).map(skill => (
              <span key={skill} className="px-2 py-[2px] rounded-full bg-[#FAF5E8] text-[#3D3020] border border-[rgba(223,192,128,0.5)] text-[11px] font-semibold">
                {skill}
              </span>
            ))}
            {member.teaches.length > 2 && (
              <span className="text-[10px] text-[#7A6E5C]">+{member.teaches.length - 2}</span>
            )}
          </div>
        )}
        {member.wants?.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#252840] mr-1">{t('member.learns')}</span>
            {member.wants.slice(0, 2).map(skill => (
              <span key={skill} className="px-2 py-[2px] rounded-full bg-[#ECEEF8] text-[#252840] text-[11px] font-semibold">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CTA — Réserver ou Demande envoyée */}
      <div className="mt-1 pt-3 border-t border-black/[0.06]" onClick={e => e.stopPropagation()}>
        {connectionState === 'requested' ? (
          <span className="inline-block w-full text-center px-4 py-[8px] rounded-xl bg-[#F5F3EE] text-[#7A6E5C] text-[12px] font-semibold">
            Demande envoyée
          </span>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onReserve?.(member.id) }}
            className="w-full px-4 py-[8px] rounded-xl bg-[#252840] text-white text-[12px] font-bold border-none cursor-pointer hover:bg-[#363B6B] transition-all"
          >
            Réserver
          </button>
        )}
      </div>
    </button>
  )
}