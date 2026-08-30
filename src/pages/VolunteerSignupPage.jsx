import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function VolunteerSignupPage() {
  const { t } = useTranslation()

  const [works, setWorks] = useState([])
  const [loadingWorks, setLoadingWorks] = useState(true)
  const [worksError, setWorksError] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedWorkIds, setSelectedWorkIds] = useState([])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmation, setConfirmation] = useState(null)

  useEffect(() => {
    loadWorks()
  }, [])

  const loadWorks = async () => {
    setLoadingWorks(true)
    setWorksError('')

    const { data, error } = await supabase.rpc('public_get_active_auxiliary_works')

    if (error) {
      setWorksError(error.message)
      setWorks([])
    } else {
      setWorks(data || [])
    }

    setLoadingWorks(false)
  }

  const toggleWork = (workId) => {
    setSelectedWorkIds((current) =>
      current.includes(workId)
        ? current.filter((id) => id !== workId)
        : [...current, workId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    const { data, error } = await supabase.rpc('public_register_helper', {
      p_name: name,
      p_phone: phone,
      p_auxiliary_work_ids: selectedWorkIds.map(Number),
      p_email: email || null,
      p_notes: notes || null,
    })

    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
      return
    }

    const helper = Array.isArray(data) ? data[0] : data
    setConfirmation(helper)
    setSubmitting(false)
  }

  const resetForm = () => {
    setConfirmation(null)
    setName('')
    setPhone('')
    setEmail('')
    setNotes('')
    setSelectedWorkIds([])
    loadWorks()
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <img
          src="https://azlfa.com/wp-content/uploads/2020/03/logo_cor-1.png"
          alt="AZL Logo"
          style={logoStyle}
        />

        <div style={titleContainerStyle}>
          <h1 style={titleStyle}>{t('volunteerSignup.title')}</h1>
          <p style={subtitleStyle}>{t('volunteerSignup.subtitle')}</p>
        </div>

        <div style={{ justifySelf: 'end' }}>
          <LanguageSwitcher />
        </div>
      </div>

      {loadingWorks && <p>{t('volunteerSignup.loadingWorks')}</p>}
      {worksError && <p style={errorStyle}>{worksError}</p>}

      {!loadingWorks && !worksError && works.length === 0 && !confirmation && (
        <div style={sectionStyle}>
          <p style={mutedTextStyle}>{t('volunteerSignup.noWorks')}</p>
        </div>
      )}

      {!loadingWorks && !worksError && works.length > 0 && !confirmation && (
        <form onSubmit={handleSubmit} style={sectionStyle}>
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>{t('volunteerSignup.yourName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>{t('volunteerSignup.phoneNumber')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>{t('volunteerSignup.emailOptional')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={labelStyle}>{t('volunteerSignup.notesOptional')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={textareaStyle}
              placeholder={t('volunteerSignup.notesPlaceholder')}
            />
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <h2 style={sectionTitleStyle}>{t('volunteerSignup.waysToHelp')}</h2>
            <div style={worksGridStyle}>
              {works.map((work) => {
                const isSelected = selectedWorkIds.includes(work.id)
                return (
                  <label key={work.id} style={workOptionStyle(isSelected)}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleWork(work.id)}
                      style={checkboxStyle}
                    />
                    <div>
                      <div style={workNameStyle}>{work.name}</div>
                      {work.description && (
                        <div style={workDescriptionStyle}>{work.description}</div>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {submitError && <p style={errorStyle}>{submitError}</p>}

          <div style={{ marginTop: '1.25rem' }}>
            <button
              type="submit"
              disabled={submitting || selectedWorkIds.length === 0}
              className="azl-button-primary"
              title={
                selectedWorkIds.length === 0
                  ? t('volunteerSignup.selectAtLeastOne')
                  : undefined
              }
              style={{
                opacity: submitting || selectedWorkIds.length === 0 ? 0.7 : 1,
                cursor:
                  submitting || selectedWorkIds.length === 0
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {submitting ? t('volunteerSignup.submitting') : t('volunteerSignup.submit')}
            </button>
          </div>
        </form>
      )}

      {confirmation && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>{t('volunteerSignup.confirmationTitle')}</h2>
          <p>{t('volunteerSignup.confirmationBody')}</p>

          <button onClick={resetForm} style={secondaryButtonStyle}>
            {t('volunteerSignup.backToTop')}
          </button>
        </div>
      )}
    </div>
  )
}

const pageStyle = {
  padding: '2rem',
  maxWidth: '960px',
  margin: '0 auto',
}

const headerStyle = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  gap: '1.5rem',
  alignItems: 'center',
  marginBottom: '2rem',
  padding: '1rem',
  borderRadius: '16px',
  background: '#fff',
  border: '1px solid #e4d8c8',
}

const logoStyle = {
  width: '72px',
  height: '72px',
  objectFit: 'contain',
  flexShrink: 0,
}

const titleContainerStyle = {
  textAlign: 'center',
}

const titleStyle = {
  margin: 0,
  color: '#6f451f',
}

const subtitleStyle = {
  marginTop: '0.5rem',
  color: '#555',
}

const sectionStyle = {
  border: '1px solid #e5e5e5',
  borderRadius: '14px',
  padding: '1.25rem',
  background: '#fff',
  marginBottom: '1.5rem',
}

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: '1rem',
  color: '#6f451f',
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem',
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: 600,
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ccc',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}

const textareaStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ccc',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  resize: 'vertical',
}

const errorStyle = {
  color: 'crimson',
  marginTop: '1rem',
}

const mutedTextStyle = {
  color: '#6b6b6b',
}

const secondaryButtonStyle = {
  padding: '0.65rem 0.95rem',
  borderRadius: '999px',
  border: '1px solid #e4d8c8',
  background: '#fff8ef',
  color: '#6f451f',
  cursor: 'pointer',
  fontWeight: 700,
}

const worksGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '0.75rem',
}

function workOptionStyle(selected) {
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    border: selected ? '2px solid #8a5a2b' : '1px solid #e4d8c8',
    borderRadius: '14px',
    padding: '0.85rem',
    background: selected ? '#fff8ef' : '#fff',
    cursor: 'pointer',
  }
}

const checkboxStyle = {
  marginTop: '0.2rem',
  width: '1.1rem',
  height: '1.1rem',
  flexShrink: 0,
}

const workNameStyle = {
  fontWeight: 700,
  color: '#2f2f2f',
}

const workDescriptionStyle = {
  marginTop: '0.2rem',
  fontSize: '0.85rem',
  color: '#777',
}
