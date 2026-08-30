import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

const STATUS_OPTIONS = ['draft', 'open', 'closed', 'completed', 'cancelled']

export default function CaminhadasListPage() {
  const { t, i18n } = useTranslation()

  const [caminhadas, setCaminhadas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [location, setLocation] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    loadCaminhadas()
  }, [])

  const loadCaminhadas = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('caominhadas')
      .select('*')
      .order('event_date', { ascending: false })

    if (error) {
      setError(error.message)
      setCaminhadas([])
    } else {
      setCaminhadas(data || [])
    }

    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')

    const { error } = await supabase.from('caominhadas').insert({
      title,
      event_date: eventDate,
      start_time: startTime || null,
      location: location || null,
      status: 'draft',
    })

    if (error) {
      setCreateError(error.message)
      setCreating(false)
      return
    }

    setTitle('')
    setEventDate('')
    setStartTime('')
    setLocation('')
    setCreating(false)
    await loadCaminhadas()
  }

  const handleStatusChange = async (caminhada, status) => {
    const { error } = await supabase
      .from('caominhadas')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', caminhada.id)

    if (error) {
      alert(error.message)
      return
    }

    await loadCaminhadas()
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{t('caminhadaManage.title')}</h1>
          <Link to="/" style={backLinkStyle}>
            {t('common.back')}
          </Link>
        </div>
        <LanguageSwitcher />
      </header>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{t('caminhadaManage.createTitle')}</h2>

        <form onSubmit={handleCreate} style={formGridStyle}>
          <div>
            <label style={labelStyle}>{t('caminhadaManage.eventTitle')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('caminhadaManage.eventDate')}</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('caminhadaManage.startTime')}</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('caminhadaManage.location')}</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ alignSelf: 'end' }}>
            <button
              type="submit"
              disabled={creating}
              className="azl-button-primary"
              style={{ opacity: creating ? 0.7 : 1 }}
            >
              {creating ? t('caminhadaManage.creating') : t('caminhadaManage.create')}
            </button>
          </div>
        </form>

        {createError && <p style={errorStyle}>{createError}</p>}
      </section>

      <section style={cardStyle}>
        {loading && <p style={mutedTextStyle}>{t('common.loading')}</p>}
        {error && <p style={errorStyle}>{error}</p>}

        {!loading && !error && caminhadas.length === 0 && (
          <p style={mutedTextStyle}>{t('caminhadaManage.noEvents')}</p>
        )}

        {!loading && !error && caminhadas.length > 0 && (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>{t('caminhadaManage.eventTitle')}</th>
                  <th style={thStyle}>{t('caminhadaManage.eventDate')}</th>
                  <th style={thStyle}>{t('caminhadaManage.location')}</th>
                  <th style={thStyle}>{t('caminhadaManage.status')}</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {caminhadas.map((caminhada) => (
                  <tr key={caminhada.id}>
                    <td style={tdStrongStyle}>{caminhada.title}</td>
                    <td style={tdStyle}>
                      {formatDate(caminhada.event_date, i18n.language)}
                    </td>
                    <td style={tdStyle}>{caminhada.location || '-'}</td>
                    <td style={tdStyle}>
                      <select
                        value={caminhada.status}
                        onChange={(e) =>
                          handleStatusChange(caminhada, e.target.value)
                        }
                        style={selectStyle}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {t(`caminhada.status.${status}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link
                          to={`/caminhadas/${caminhada.id}`}
                          style={secondaryLinkStyle}
                        >
                          {t('caminhadaManage.manage')}
                        </Link>
                        <Link
                          to={`/caminhadas/${caminhada.id}/checklist`}
                          style={secondaryLinkStyle}
                        >
                          {t('caminhadaManage.checklist')}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function formatDate(value, language) {
  if (!value) return '-'
  return new Date(`${value}T00:00:00`).toLocaleDateString(
    language === 'pt' ? 'pt-PT' : 'en-US',
    { day: '2-digit', month: '2-digit', year: 'numeric' }
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

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: 600,
}

const inputStyle = {
  width: '100%',
  padding: '0.7rem',
  border: '1px solid #ccc',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}

const selectStyle = {
  padding: '0.5rem 0.6rem',
  border: '1px solid #ccc',
  borderRadius: '10px',
  fontSize: '0.9rem',
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

const secondaryLinkStyle = {
  display: 'inline-block',
  padding: '0.5rem 0.75rem',
  borderRadius: '999px',
  background: '#fff8ef',
  color: '#6f451f',
  textDecoration: 'none',
  border: '1px solid #e4d8c8',
  fontWeight: 700,
  fontSize: '0.85rem',
}
