import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function AuxiliaryWorksListPage() {
  const { t } = useTranslation()

  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    loadWorks()
  }, [])

  const loadWorks = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('auxiliary_works')
      .select('*, helper_auxiliary_works(count)')
      .order('name', { ascending: true })

    if (error) {
      setError(error.message)
      setWorks([])
    } else {
      setWorks(
        (data || []).map((work) => ({
          ...work,
          volunteerCount: work.helper_auxiliary_works?.[0]?.count ?? 0,
        }))
      )
    }

    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')

    const { error } = await supabase.from('auxiliary_works').insert({
      name,
      description: description || null,
    })

    if (error) {
      setCreateError(error.message)
      setCreating(false)
      return
    }

    setName('')
    setDescription('')
    setCreating(false)
    await loadWorks()
  }

  const handleToggleActive = async (work) => {
    const { error } = await supabase
      .from('auxiliary_works')
      .update({ is_active: !work.is_active, updated_at: new Date().toISOString() })
      .eq('id', work.id)

    if (error) {
      alert(error.message)
      return
    }

    await loadWorks()
  }

  const handleDelete = async (work) => {
    if (!window.confirm(t('auxiliaryWorks.confirmDelete'))) return

    const { error } = await supabase.from('auxiliary_works').delete().eq('id', work.id)

    if (error) {
      alert(error.message)
      return
    }

    await loadWorks()
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{t('auxiliaryWorks.title')}</h1>
          <Link to="/" style={backLinkStyle}>
            {t('common.back')}
          </Link>
        </div>
        <LanguageSwitcher />
      </header>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{t('auxiliaryWorks.createTitle')}</h2>

        <form onSubmit={handleCreate} style={formGridStyle}>
          <div>
            <label style={labelStyle}>{t('auxiliaryWorks.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('auxiliaryWorks.description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {creating ? t('auxiliaryWorks.creating') : t('auxiliaryWorks.create')}
            </button>
          </div>
        </form>

        {createError && <p style={errorStyle}>{createError}</p>}
      </section>

      <section style={cardStyle}>
        {loading && <p style={mutedTextStyle}>{t('common.loading')}</p>}
        {error && <p style={errorStyle}>{error}</p>}

        {!loading && !error && works.length === 0 && (
          <p style={mutedTextStyle}>{t('auxiliaryWorks.noWorks')}</p>
        )}

        {!loading && !error && works.length > 0 && (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>{t('auxiliaryWorks.name')}</th>
                  <th style={thStyle}>{t('auxiliaryWorks.description')}</th>
                  <th style={thStyle}>{t('auxiliaryWorks.volunteerCount')}</th>
                  <th style={thStyle} />
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {works.map((work) => (
                  <tr key={work.id}>
                    <td style={tdStrongStyle}>{work.name}</td>
                    <td style={tdStyle}>{work.description || '-'}</td>
                    <td style={tdStyle}>{work.volunteerCount}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(work)}
                        style={toggleButtonStyle(work.is_active)}
                      >
                        {work.is_active
                          ? t('auxiliaryWorks.active')
                          : t('auxiliaryWorks.inactive')}
                      </button>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link to={`/auxiliary-works/${work.id}`} style={secondaryLinkStyle}>
                          {t('auxiliaryWorks.viewHelpers')}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(work)}
                          style={deleteButtonStyle}
                        >
                          {t('auxiliaryWorks.delete')}
                        </button>
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

const deleteButtonStyle = {
  display: 'inline-block',
  padding: '0.5rem 0.75rem',
  borderRadius: '999px',
  background: '#fff',
  color: '#b91c1c',
  border: '1px solid #f1c4c4',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer',
}

function toggleButtonStyle(isActive) {
  return {
    display: 'inline-block',
    padding: '0.4rem 0.75rem',
    borderRadius: '999px',
    border: isActive ? '1px solid #166534' : '1px solid #e4d8c8',
    background: isActive ? '#f0fdf4' : '#f7f7f7',
    color: isActive ? '#166534' : '#6b7280',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
  }
}
