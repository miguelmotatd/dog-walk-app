import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

export default function MyWalksPanel({
  personPublicToken,
  title,
  emptyMessage,
}) {
  const { t, i18n } = useTranslation()
  const resolvedTitle = title || t('myWalks.panelTitle')
  const resolvedEmptyMessage = emptyMessage || t('myWalks.empty')

  const [walks, setWalks] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!personPublicToken) {
      setWalks([])
      setLoading(false)
      setErrorMessage('')
      return
    }

    loadWalks()
  }, [personPublicToken])

  const loadWalks = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase.rpc('public_get_my_active_walks', {
      p_person_public_token: personPublicToken,
    })

    if (error) {
      setWalks([])
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setWalks(data || [])
    setLoading(false)
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ margin: 0 }}>{resolvedTitle}</h2>
        <button onClick={loadWalks} disabled={loading}>
          {loading ? t('common.loading') : t('common.refresh')}
        </button>
      </div>

      {loading && <p>{t('myWalks.loading')}</p>}
      {!loading && errorMessage && <p style={{ color: 'crimson' }}>{errorMessage}</p>}
      {!loading && !errorMessage && walks.length === 0 && <p>{resolvedEmptyMessage}</p>}

      {!loading && !errorMessage && walks.length > 0 && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {walks.map((walk) => (
            <div
              key={walk.walk_id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '12px',
                padding: '1rem',
                background: '#fff',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>
                {walk.dog_name}
              </h3>

              <p>
                <strong>{t('dashboard.checkedOut')}:</strong>{' '}
                {formatDateTime(walk.checked_out_at, i18n.language)}
              </p>

              <p>
                <strong>{t('dashboard.expectedReturn')}:</strong>{' '}
                {formatDateTime(walk.expected_return_at, i18n.language)}
              </p>

              <p>
                <strong>{t('dashboard.status')}:</strong>{' '}
                {walk.overdue ? t('publicWalk.overdue') : t('publicWalk.active')}
              </p>

              <Link to={`/walk/${walk.walk_id}?token=${walk.public_token}`}>
                {t('myWalks.openWalk')}
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function formatDateTime(value, language) {
  if (!value) return '-'
  return new Date(value).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')
}