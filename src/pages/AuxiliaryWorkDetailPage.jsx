import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function AuxiliaryWorkDetailPage() {
  const { t } = useTranslation()
  const { auxiliaryWorkId } = useParams()

  const [work, setWork] = useState(null)
  const [helpers, setHelpers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [auxiliaryWorkId])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const [workResult, helpersResult] = await Promise.all([
      supabase.from('auxiliary_works').select('*').eq('id', auxiliaryWorkId).single(),
      supabase
        .from('helper_auxiliary_works')
        .select('helper_id, helpers(id, name, phone, email, notes)')
        .eq('auxiliary_work_id', auxiliaryWorkId),
    ])

    if (workResult.error) {
      setError(workResult.error.message)
      setWork(null)
      setHelpers([])
      setLoading(false)
      return
    }

    if (helpersResult.error) {
      setError(helpersResult.error.message)
      setHelpers([])
    } else {
      setHelpers((helpersResult.data || []).map((row) => row.helpers).filter(Boolean))
    }

    setWork(workResult.data)
    setLoading(false)
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{work ? work.name : t('auxiliaryWorks.title')}</h1>
          <Link to="/auxiliary-works" style={backLinkStyle}>
            {t('auxiliaryWorkDetail.backLink')}
          </Link>
        </div>
        <LanguageSwitcher />
      </header>

      <section style={cardStyle}>
        {loading && <p style={mutedTextStyle}>{t('common.loading')}</p>}
        {error && <p style={errorStyle}>{error}</p>}

        {!loading && !error && work && (
          <>
            <h2 style={sectionTitleStyle}>
              {t('auxiliaryWorkDetail.helpersTitle', { name: work.name })}
            </h2>

            {helpers.length === 0 && (
              <p style={mutedTextStyle}>{t('auxiliaryWorkDetail.noHelpers')}</p>
            )}

            {helpers.length > 0 && (
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>{t('auxiliaryWorkDetail.name')}</th>
                      <th style={thStyle}>{t('auxiliaryWorkDetail.phone')}</th>
                      <th style={thStyle}>{t('auxiliaryWorkDetail.email')}</th>
                      <th style={thStyle}>{t('auxiliaryWorkDetail.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {helpers.map((helper) => (
                      <tr key={helper.id}>
                        <td style={tdStrongStyle}>{helper.name}</td>
                        <td style={tdStyle}>{helper.phone}</td>
                        <td style={tdStyle}>{helper.email || '-'}</td>
                        <td style={tdStyle}>{helper.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

const pageStyle = {
  padding: '1rem',
  maxWidth: '1100px',
  margin: '0 auto',
  background: '#f7f3ec',
  minHeight: '100vh',
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1.25rem',
  flexWrap: 'wrap',
}

const titleStyle = {
  margin: 0,
  color: '#6f451f',
}

const backLinkStyle = {
  display: 'inline-block',
  marginTop: '0.5rem',
  color: '#8a5a2b',
  fontWeight: 700,
  textDecoration: 'none',
}

const cardStyle = {
  border: '1px solid #e4d8c8',
  borderRadius: '18px',
  padding: '1rem',
  background: '#fff',
  marginBottom: '1.25rem',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
}

const sectionTitleStyle = {
  margin: '0 0 1rem 0',
  color: '#6f451f',
}

const errorStyle = {
  color: 'crimson',
  marginTop: '1rem',
}

const mutedTextStyle = {
  color: '#6b6b6b',
}

const tableWrapperStyle = {
  overflowX: 'auto',
  border: '1px solid #eee',
  borderRadius: '14px',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '700px',
}

const thStyle = {
  textAlign: 'left',
  borderBottom: '1px solid #e4d8c8',
  padding: '0.85rem',
  background: '#fff8ef',
  color: '#6f451f',
  fontSize: '0.9rem',
}

const tdStyle = {
  borderBottom: '1px solid #f1eee9',
  padding: '1rem',
  verticalAlign: 'middle',
}

const tdStrongStyle = {
  ...tdStyle,
  fontWeight: 700,
  color: '#2f2f2f',
}
