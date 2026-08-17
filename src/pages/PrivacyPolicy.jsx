// src/pages/PrivacyPolicy.jsx — Politique de confidentialité (GABARIT RGPD)
import { useTranslation } from 'react-i18next'
import LegalPageLayout from '../components/LegalPageLayout'

export default function PrivacyPolicy() {
  const { t } = useTranslation()
  return (
    <LegalPageLayout
      docKey="privacy"
      related={[
        { to: '/legal-notice', label: t('footer.legalNotice') },
        { to: '/terms',        label: t('footer.terms')       },
        { to: '/settings',     label: t('footer.settings')    },
      ]}
    />
  )
}
