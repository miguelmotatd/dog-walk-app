import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import MyWalksPanel from '../components/MyWalksPanel'

export default function MyWalksPage() {
  const { t } = useTranslation()
  const personPublicToken = localStorage.getItem('person_public_token')

  return (
    <div style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto' }}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>{t('myWalks.title')}</h1>
          <div style={{ marginTop: '0.75rem' }}>
            <Link to="/start-walk" style={backLinkStyle}>
              {t('common.back')}
            </Link>
          </div>
        </div>
        <LanguageSwitcher />
      </div>

      <p>{t('myWalks.subtitle')}</p>

      <MyWalksPanel personPublicToken={personPublicToken} />
    </div>
  )
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1rem',
  flexWrap: 'wrap',
}

const backLinkStyle = {
  display: 'inline-block',
  color: '#6f451f',
  fontWeight: 700,
}