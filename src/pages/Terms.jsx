// src/pages/Terms.jsx — Conditions générales d'utilisation (GABARIT)
import { useTranslation } from 'react-i18next'
import LegalPageLayout from '../components/LegalPageLayout'

export default function Terms() {
  const { t } = useTranslation()
  return (
    <LegalPageLayout
      docKey="terms"
      related={[
        { to: '/legal-notice', label: t('footer.legalNotice') },
        { to: '/privacy',      label: t('footer.privacy')     },
        { to: '/help',         label: t('footer.helpCenter')  },
      ]}
    />
  )
}
