import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import MyWalksPanel from '../components/MyWalksPanel'

export default function MyWalksPage() {
  const { t } = useTranslation()
  const personPublicToken = localStorage.getItem('person_public_token')

  return (
    <div style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1>{t('myWalks.title')}</h1>
        <LanguageSwitcher />
      </div>

      <p>{t('myWalks.subtitle')}</p>

      <MyWalksPanel personPublicToken={personPublicToken} />
    </div>
  )
}