import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function CaminhadaRegisterPage() {
  const { t, i18n } = useTranslation()

  const [loadingEvent, setLoadingEvent] = useState(true)
  const [event, setEvent] = useState(null)
  const [eventError, setEventError] = useState('')

  const [dogs, setDogs] = useState([])
  const [loadingDogs, setLoadingDogs] = useState(false)
  const [dogsError, setDogsError] = useState('')

  const [caminhadaDogId, setCaminhadaDogId] = useState('')
  const [personName, setPersonName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [participantCount, setParticipantCount] = useState(1)
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmation, setConfirmation] = useState(null)

  useEffect(() => {
    loadOpenEvent()
  }, [])

  const loadOpenEvent = async () => {
    setLoadingEvent(true)
    setEventError('')

    const { data, error } = await supabase.rpc('public_get_open_caominhada')

    if (error) {
      setEventError(error.message)
      setEvent(null)
      setLoadingEvent(false)
      return
    }

    const row = Array.isArray(data) ? data[0] : data
    setEvent(row || null)
    setLoadingEvent(false)

    if (row) {
      loadDogs(row.caominhada_id)
    }
  }

  const loadDogs = async (caminhadaId) => {
    setLoadingDogs(true)
    setDogsError('')

    const { data, error } = await supabase.rpc('public_get_caominhada_dogs', {
      p_caominhada_id: caminhadaId,
    })

    if (error) {
      setDogsError(error.message)
      setDogs([])
    } else {
      setDogs(data || [])
    }

    setLoadingDogs(false)
  }

  const selectedDog = dogs.find(
    (d) => String(d.caominhada_dog_id) === String(caminhadaDogId)
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    const { data, error } = await supabase.rpc('public_register_caominhada', {
      p_caominhada_dog_id: Number(caminhadaDogId),
      p_person_name: personName,
      p_phone: phone,
      p_participant_count: Number(participantCount) || 1,
      p_email: email || null,
      p_notes: notes || null,
    })

    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
      return
    }

    const reservation = Array.isArray(data) ? data[0] : data
    setConfirmation(reservation)
    setSubmitting(false)
  }

  const resetForm = () => {
    setConfirmation(null)
    setCaminhadaDogId('')
    setPersonName('')
    setPhone('')
    setEmail('')
    setParticipantCount(1)
    setNotes('')
    if (event) loadDogs(event.caominhada_id)
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
          <h1 style={titleStyle}>{t('caminhada.title')}</h1>
          <p style={subtitleStyle}>{t('caminhadaRegister.subtitle')}</p>
        </div>

        <div style={{ justifySelf: 'end' }}>
          <LanguageSwitcher />
        </div>
      </div>

      {loadingEvent && <p>{t('caminhadaRegister.loadingEvent')}</p>}
      {eventError && <p style={errorStyle}>{eventError}</p>}

      {!loadingEvent && !eventError && !event && (
        <div style={sectionStyle}>
          <p style={mutedTextStyle}>{t('caminhadaRegister.noneOpen')}</p>
        </div>
      )}

      {!loadingEvent && !eventError && event && !confirmation && (
        <>
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>{event.title}</h2>
            <div style={eventMetaGridStyle}>
              <EventMetaItem
                label={t('caminhadaRegister.eventDate')}
                value={formatDate(event.event_date, i18n.language)}
              />
              {event.start_time && (
                <EventMetaItem
                  label={t('caminhadaRegister.eventTime')}
                  value={event.start_time}
                />
              )}
              {event.location && (
                <EventMetaItem
                  label={t('caminhadaRegister.eventLocation')}
                  value={event.location}
                />
              )}
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>{t('caminhadaRegister.dog')}</h2>

            {loadingDogs && <p>{t('caminhadaRegister.loadingDogs')}</p>}
            {dogsError && <p style={errorStyle}>{dogsError}</p>}

            {!loadingDogs && !dogsError && dogs.length === 0 && (
              <p style={mutedTextStyle}>{t('caminhadaRegister.noDogs')}</p>
            )}

            {!loadingDogs && !dogsError && dogs.length > 0 && (
              <div style={dogGridStyle}>
                {dogs.map((dog) => {
                  const isSelected =
                    String(dog.caominhada_dog_id) === String(caminhadaDogId)
                  const isAvailable = dog.status === 'available'

                  return (
                    <CaminhadaDogCard
                      key={dog.caominhada_dog_id}
                      dog={dog}
                      selected={isSelected}
                      disabled={!isAvailable}
                      onSelect={() =>
                        setCaminhadaDogId(String(dog.caominhada_dog_id))
                      }
                    />
                  )
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              {selectedDog
                ? `${t('caminhadaRegister.submit')} 🐶 ${selectedDog.dog_name}`
                : t('caminhadaRegister.submit')}
            </h2>

            <div style={formGridStyle}>
              <div>
                <label style={labelStyle}>{t('caminhadaRegister.yourName')}</label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>{t('caminhadaRegister.phoneNumber')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>{t('caminhadaRegister.emailOptional')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  {t('caminhadaRegister.participantCount')}
                </label>
                <input
                  type="number"
                  min={1}
                  value={participantCount}
                  onChange={(e) => setParticipantCount(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>{t('caminhadaRegister.notesOptional')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={textareaStyle}
                placeholder={t('caminhadaRegister.notesPlaceholder')}
              />
            </div>

            {submitError && <p style={errorStyle}>{submitError}</p>}

            <div style={{ marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={submitting || !caminhadaDogId}
                className="azl-button-primary"
                style={{
                  opacity: submitting || !caminhadaDogId ? 0.7 : 1,
                  cursor: submitting || !caminhadaDogId ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting
                  ? t('caminhadaRegister.submitting')
                  : t('caminhadaRegister.submit')}
              </button>
            </div>
          </form>
        </>
      )}

      {confirmation && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            {t('caminhadaRegister.confirmationTitle')}
          </h2>
          <p>
            {t('caminhadaRegister.confirmationBody', {
              dogName: confirmation.dog_name,
            })}
          </p>

          <button onClick={resetForm} style={secondaryButtonStyle}>
            {t('caminhadaRegister.backToTop')}
          </button>
        </div>
      )}
    </div>
  )
}

function EventMetaItem({ label, value }) {
  return (
    <div>
      <div style={metaLabelStyle}>{label}</div>
      <div style={metaValueStyle}>{value}</div>
    </div>
  )
}

function CaminhadaDogCard({ dog, selected, disabled, onSelect }) {
  const { t } = useTranslation()

  return (
    <div style={dogCardStyle({ selected, disabled })}>
      <div style={dogImageWrapperStyle}>
        {dog.dog_image_url ? (
          <img
            src={dog.dog_image_url}
            alt={dog.dog_name}
            style={dogImageStyle(disabled)}
          />
        ) : (
          <div style={dogPlaceholderStyle}>🐶</div>
        )}

        <div style={dogStatusBadgeStyle(dog.status)}>
          {t(`caminhada.dogStatus.${dog.status}`)}
        </div>
      </div>

      <div style={dogCardContentStyle}>
        <h3 style={dogNameStyle}>{dog.dog_name}</h3>

        <div style={dogMetaGridStyle}>
          {dog.dog_sex && (
            <span style={dogMetaTextStyle}>{dog.dog_sex}</span>
          )}
          {dog.dog_size && (
            <span style={dogMetaTextStyle}>{dog.dog_size}</span>
          )}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onSelect}
          style={selectDogButtonStyle(selected, disabled)}
        >
          {selected
            ? t('caminhadaRegister.selectedDog')
            : t('caminhadaRegister.selectThisDog')}
        </button>
      </div>
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

const eventMetaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '1rem',
}

const metaLabelStyle = {
  fontSize: '0.85rem',
  color: '#777',
  marginBottom: '0.15rem',
}

const metaValueStyle = {
  fontWeight: 700,
  color: '#2f2f2f',
}

const dogGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
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

function dogCardStyle({ selected, disabled }) {
  return {
    border: selected ? '2px solid #8a5a2b' : '1px solid #e4d8c8',
    borderRadius: '16px',
    overflow: 'hidden',
    background: disabled ? '#f7f7f7' : selected ? '#fff8ef' : '#fff',
    opacity: disabled ? 0.65 : 1,
    boxShadow: selected
      ? '0 0 0 4px rgba(138, 90, 43, 0.12)'
      : '0 4px 14px rgba(0,0,0,0.08)',
  }
}

const dogImageWrapperStyle = {
  position: 'relative',
  width: '100%',
  aspectRatio: '4 / 3',
  background: '#f7f3ec',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid #eee',
}

const dogPlaceholderStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '3rem',
  color: '#8a5a2b',
}

function dogImageStyle(disabled) {
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 40%',
    display: 'block',
    filter: disabled ? 'grayscale(85%) saturate(40%)' : 'none',
  }
}

function dogStatusBadgeStyle(status) {
  const base = {
    position: 'absolute',
    top: '0.65rem',
    right: '0.65rem',
    padding: '0.3rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.92)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  }

  if (status === 'available') return { ...base, color: '#166534' }
  if (status === 'reserved') return { ...base, color: '#b45309' }
  if (status === 'walked') return { ...base, color: '#1d4ed8' }
  return { ...base, color: '#6b7280' }
}

const dogCardContentStyle = {
  padding: '0.85rem',
}

const dogNameStyle = {
  margin: '0 0 0.5rem 0',
  color: '#6f451f',
  fontSize: '1.1rem',
}

const dogMetaGridStyle = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '0.75rem',
  color: '#777',
  fontSize: '0.85rem',
}

const dogMetaTextStyle = {
  padding: '0.15rem 0.5rem',
  borderRadius: '999px',
  background: '#f7f3ec',
}

function selectDogButtonStyle(selected, disabled) {
  return {
    width: '100%',
    color: disabled ? '#6b7280' : '#fff',
    border: 'none',
    padding: '0.6rem 1rem',
    borderRadius: '999px',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#e5e7eb' : selected ? '#166534' : '#8a5a2b',
  }
}
