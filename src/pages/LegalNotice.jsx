// src/pages/LegalNotice.jsx — Mentions légales (GABARIT, cf. LegalPageLayout)
import { useTranslation } from 'react-i18next'
import LegalPageLayout from '../components/LegalPageLayout'

export default function LegalNotice() {
  const { t } = useTranslation()
  return (
    <LegalPageLayout
      docKey="notice"
      related={[
        { to: '/privacy', label: t('footer.privacy') },
        { to: '/terms',   label: t('footer.terms')   },
        { to: '/report',  label: t('footer.report')  },
      ]}
    />
  )
}
