import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import DogForm from '../components/DogForm'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function CreateDogPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')

  const handleCreateDog = async (values) => {
    setErrorMessage('')

    const { error } = await supabase.from('dogs').insert(values)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    navigate('/')
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>{t('dogForm.createTitle')}</h1>
          <div style={{ marginTop: '0.75rem' }}>
            <Link to="/" style={linkStyle}>
              {t('common.back')}
            </Link>
          </div>
        </div>
        <LanguageSwitcher />
      </div>

      <div style={cardStyle}>
        <DogForm
          onSubmit={handleCreateDog}
          submitLabel={t('dogForm.create')}
          submittingLabel={t('dogForm.creating')}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  )
}

const pageStyle = {
  padding: '2rem',
  maxWidth: '860px',
  margin: '0 auto',
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1.5rem',
}

const cardStyle = {
  border: '1px solid #e5e5e5',
  borderRadius: '14px',
  padding: '1.25rem',
  background: '#fff',
}

const linkStyle = {
  display: 'inline-block',
  padding: '0.55rem 0.8rem',
  borderRadius: '8px',
  background: '#eff6ff',
  color: '#1d4ed8',
  textDecoration: 'none',
}