// ProfileModal — Profil détaillé avec grille de disponibilité cliquable
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useFocusTrap from '../hooks/useFocusTrap'
import useAuthStore from '../store/authStore'

// `key` indexe member.availability : jamais traduite.
const DAYS = [
  { key: 'Lun', labelKey: 'daysShort.mon' },
  { key: 'Mar', labelKey: 'daysShort.tue' },
  { key: 'Mer', labelKey: 'daysShort.wed' },
  { key: 'Jeu', labelKey: 'daysShort.thu' },
  { key: 'Ven', labelKey: 'daysShort.fri' },
  { key: 'Sam', labelKey: 'daysShort.sat' },
  { key: 'Dim', labelKey: 'daysShort.sun' },
]
const SLOTS = ['slots.morning', 'slots.afternoon', 'slots.evening']

function StarRatingFull({ value, count, t }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 1L8.56 4.87L12.66 5.29L9.69 7.93L10.6 11.95L7 9.79L3.4 11.95L4.31 7.93L1.34 5.29L5.44 4.87L7 1Z"
            fill={i <= Math.round(value) ? '#C8864B' : 'none'}
            stroke="#C8864B"
            strokeWidth="0.9"
          />
        </svg>
      ))}
      <span className="text-[13px] text-[#7A6E5C] ml-1 font-semibold">
        {value.toFixed(1)} · {t('member.reviews', { count })}
      </span>
    </div>
  )
}

export default function ProfileModal({ member, onClose }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, openModal } = useAuthStore()
  const [selectedSlot, setSelectedSlot] = useState(null) // { day, slotIdx }

  // Échap, piégeage du focus et restitution au déclencheur.
  const dialogRef = useFocusTrap(!!member, onClose)

  if (!member) return null

  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
  const isMock   = member.id?.startsWith('mock-')

  const isSlotAvailable = (day, slotIdx) => {
    const slots = member.availability?.[day]
    return Array.isArray(slots) ? slots[slotIdx] : false
  }

  const handleSelectSlot = (day, slotIdx) => {
    if (!isSlotAvailable(day, slotIdx)) return
    setSelectedSlot(prev =>
      prev?.day === day && prev?.slotIdx === slotIdx ? null : { day, slotIdx }
    )
  }

  const handleReserve = () => {
    if (!user) { openModal('login'); return }
    onClose()
    const query = isMock
      ? ''
      : `?with=${member.id}&name=${encodeURIComponent(member.firstName + ' ' + member.lastName)}`
    navigate(`/sessions/new${query}`)
  }

  const selectedDay = DAYS.find(d => d.key === selectedSlot?.day)
  const slotLabel = selectedSlot
    ? t('member.slotLabel', { day: t(selectedDay.labelKey), slot: t(SLOTS[selectedSlot.slotIdx]) })
    : null

  return (
    <div
      className="fixed inset-0 z-[200] bg-[rgba(26,20,16,0.55)] backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="bg-[#FDFAF4] rounded-2xl w-full max-w-[620px] max-h-[90vh] overflow-y-auto shadow-2xl"
      >

        {/* Header */}
        <div className="flex items-start gap-5 p-7 pb-5 border-b border-black/[0.07]">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-black text-[22px] text-white flex-shrink-0"
            style={{ background: member.color }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="profile-modal-title" className="text-[22px] font-black tracking-tight text-[#1A1410]">
              {member.firstName} {member.lastName}
            </h2>
            <p className="text-[13px] text-[#7A6E5C] mt-[2px]">
              {[member.city, member.age ? `${member.age} ans` : null].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-2">
              <StarRatingFull value={member.reputation ?? 4.5} count={member.reviewCount ?? 0} t={t} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/[0.06] border-none cursor-pointer text-[#7A6E5C] flex items-center justify-center hover:bg-black/10 transition-all flex-shrink-0 text-base leading-none"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l8 8M9 1L1 9"/>
            </svg>
          </button>
        </div>

        <div className="p-7 flex flex-col gap-6">

          {/* Bio */}
          {member.bio && (
            <p className="text-[13px] text-[#3D3020] leading-[1.7]">{member.bio}</p>
          )}

          {/* Crédits */}
          {member.credits !== undefined && (
            <div className="flex items-center gap-3 bg-[#ECEEF8] rounded-xl px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#252840" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="8" r="6.5"/>
                <path d="M8 4.5v7M5.5 6.5h3.5a1 1 0 0 1 0 2H6a1 1 0 0 0 0 2H10"/>
              </svg>
              <span className="text-[13px] font-bold text-[#252840]">{t('member.credits', { count: member.credits })}</span>
              <span className="text-[12px] text-[#7A6E5C]">{t('member.creditsActive')}</span>
            </div>
          )}

          {/* Skills partage */}
          {member.teaches?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#C8864B] mb-2">{t('member.shares')}</p>
              <div className="flex flex-wrap gap-2">
                {member.teaches.map(skill => (
                  <span key={skill} className="px-3 py-[5px] rounded-full bg-[#FAF5E8] text-[#3D3020] border border-[rgba(223,192,128,0.5)] text-[12px] font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills apprend */}
          {member.wants?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#252840] mb-2">{t('member.learns')}</p>
              <div className="flex flex-wrap gap-2">
                {member.wants.map(skill => (
                  <span key={skill} className="px-3 py-[5px] rounded-full bg-[#ECEEF8] text-[#252840] text-[12px] font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Grille disponibilités cliquable */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#7A6E5C] mb-3">
              Sélectionnez un créneau
            </p>
            {member.availability && Object.keys(member.availability).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="text-left text-[#7A6E5C] font-semibold pb-2 pr-3 w-[50px]" />
                      {SLOTS.map(slotKey => (
                        <th key={slotKey} className="text-center text-[#7A6E5C] font-semibold pb-2 px-1 min-w-[72px]">
                          {t(slotKey)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => {
                      const slots = member.availability[day.key] ?? [false, false, false]
                      return (
                        <tr key={day.key}>
                          <td className="text-[12px] font-bold py-[4px] pr-3 text-[#1A1410]">{t(day.labelKey)}</td>
                          {slots.map((avail, i) => {
                            const isSelected = selectedSlot?.day === day.key && selectedSlot?.slotIdx === i
                            return (
                              <td key={i} className="px-1 py-[4px] text-center">
                                <button
                                  onClick={() => handleSelectSlot(day.key, i)}
                                  disabled={!avail}
                                  className={`w-full h-[26px] rounded-lg text-[10px] font-bold transition-all border-none cursor-pointer
                                    ${isSelected
                                      ? 'bg-[#252840] text-white'
                                      : avail
                                      ? 'bg-[#E4EED8] text-[#3D5C28] hover:bg-[#3D5C28] hover:text-white'
                                      : 'bg-[#F5F3EE] text-[#C0B8AC] cursor-not-allowed'
                                    }`}
                                >
                                  {isSelected ? t('member.chosen') : avail ? t('member.available') : t('member.unavailable')}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[13px] text-[#7A6E5C] italic">{t('member.noAvailability')}</p>
            )}

            {slotLabel && (
              <p className="mt-3 text-[12px] font-semibold text-[#252840] bg-[#ECEEF8] rounded-xl px-4 py-2">
                {t('member.selectedSlot', { slot: slotLabel })}
              </p>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={handleReserve}
            className="w-full py-4 rounded-2xl bg-[#252840] text-white text-[14px] font-black border-none cursor-pointer hover:bg-[#363B6B] transition-all"
          >
            {slotLabel ? t('member.bookSlot', { slot: slotLabel }) : t('member.book')}
          </button>

        </div>
      </div>
    </div>
  )
}