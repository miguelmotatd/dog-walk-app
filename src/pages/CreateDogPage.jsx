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
          <h1 style={titleStyle}>{t('dogForm.createTitle')}</h1>
          <div style={{ marginTop: '0.75rem' }}>
            <Link to="/" style={backLinkStyle}>{t('common.back')}</Link>
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


const titleStyle = {
  margin: 0,
  color: '#6f451f',
}

const pageStyle = {
  padding: '2rem',
  maxWidth: '900px',
  margin: '0 auto',
  minHeight: '100vh',
  background: '#f7f3ec',
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
}

const cardStyle = {
  border: '1px solid #e4d8c8',
  borderRadius: '18px',
  padding: '1.25rem',
  background: '#fff',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
}

const linkStyle = {
  display: 'inline-block',
  padding: '0.55rem 0.85rem',
  borderRadius: '999px',
  background: '#fff8ef',
  color: '#6f451f',
  textDecoration: 'none',
  border: '1px solid #e4d8c8',
  fontWeight: 700,
}

const backLinkStyle = {
  display: 'inline-block',
  marginTop: '0.75rem',
  color: '#6f451f',
  fontWeight: 700,
}