// AvailabilityGrid — Grille de disponibilité hebdomadaire (lecture seule)
import { useTranslation } from 'react-i18next'

// `key` indexe l'objet `availability` reçu du backend : jamais traduite.
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

export default function AvailabilityGrid({ availability = {} }) {
  const { t } = useTranslation()
  const hasAny = Object.values(availability).some(slots => slots.some(Boolean))

  if (!hasAny) {
    return (
      <p className="text-[13px] text-[#7A6E5C] italic">
        {t('member.noAvailability')}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="text-left text-[#7A6E5C] font-semibold pb-2 pr-3 w-[70px]"></th>
            {SLOTS.map(slotKey => (
              <th key={slotKey} className="text-center text-[#7A6E5C] font-semibold pb-2 px-1 min-w-[56px]">
                {t(slotKey)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map(day => {
            const slots = availability[day.key] ?? [false, false, false]
            const anyAvail = slots.some(Boolean)
            return (
              <tr key={day.key}>
                <td className={`text-[12px] font-bold py-[5px] pr-3 ${anyAvail ? 'text-[#1A1410]' : 'text-[#C0B8AC]'}`}>
                  {t(day.labelKey)}
                </td>
                {slots.map((avail, i) => (
                  <td key={i} className="px-1 py-[5px] text-center">
                    <div
                      className={`mx-auto w-[48px] h-[22px] rounded-md text-[10px] font-bold flex items-center justify-center transition-colors
                        ${avail
                          ? 'bg-[#E4EED8] text-[#3D5C28]'
                          : 'bg-[#F5F3EE] text-[#C0B8AC]'
                        }`}
                    >
                      {avail ? t('member.available') : t('member.unavailable')}
                    </div>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}