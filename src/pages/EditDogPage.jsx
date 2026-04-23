import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import DogForm from '../components/DogForm'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function EditDogPage() {
  const { t } = useTranslation()
  const { dogId } = useParams()
  const navigate = useNavigate()

  const [dog, setDog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadDog()
  }, [dogId])

  const loadDog = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', dogId)
      .single()

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setDog(data)
    setLoading(false)
  }

  const handleUpdateDog = async (values) => {
    setErrorMessage('')

    const { error } = await supabase
      .from('dogs')
      .update(values)
      .eq('id', dogId)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    navigate('/')
  }

  if (loading) {
    return <div style={pageStyle}>{t('common.loading')}</div>
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>{t('dogForm.editTitle')}</h1>
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
          initialValues={dog}
          onSubmit={handleUpdateDog}
          submitLabel={t('dogForm.save')}
          submittingLabel={t('dogForm.saving')}
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