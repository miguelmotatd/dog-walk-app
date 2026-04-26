import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import DogCard from '../components/DogCard'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useMemo } from 'react'
import DogFilters from '../components/DogFilters'
import { filterDogs } from '../utils/dogFilters'

export default function StartWalkPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [dogs, setDogs] = useState([])
  const [loadingDogs, setLoadingDogs] = useState(true)
  const [dogsError, setDogsError] = useState('')

  const [dogId, setDogId] = useState('')
  const [personName, setPersonName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [expectedReturnAt] = useState(getTodayAt11AM())

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [filters, setFilters] = useState({
    searchText: '',
    size: 'all',
    sex: 'all',
    ageRange: 'all',
  })

  useEffect(() => {
    loadAvailableDogs()
  }, [])

  const loadAvailableDogs = async () => {
    setLoadingDogs(true)
    setDogsError('')

    const { data, error } = await supabase
      .from('dogs_view')
      .select('id, name, status, size, sex, estimated_birth_year, age, image_url, notes_summary, is_active')
      .eq('is_active', true)
      .eq('status', 'available')
      .order('name', { ascending: true })

    if (error) {
      setDogs([])
      setDogsError(error.message)
    } else {
      setDogs(data || [])
    }

    setLoadingDogs(false)
  }

  const filteredDogs = useMemo(() => {
    return filterDogs(dogs, filters)
  }, [dogs, filters])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    const { data, error } = await supabase.rpc('start_walk', {
      p_dog_id: Number(dogId),
      p_person_name: personName,
      p_phone: phone,
      p_expected_return_at: new Date(expectedReturnAt).toISOString(),
      p_checkout_notes: checkoutNotes || null,
      p_email: email || null,
    })

    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
      return
    }

    const walk = Array.isArray(data) ? data[0] : data

    if (walk?.person_public_token) {
      localStorage.setItem('person_public_token', walk.person_public_token)
    }

    if (walk) {
      navigate(`/walk/${walk.walk_id}?token=${walk.public_token}`)
      return
    }

    setSubmitting(false)
  }

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div style={brandRowStyle}>
          <img
            src="https://azlfa.com/wp-content/uploads/2020/03/logo_cor-1.png"
            alt="AZL Logo"
            style={logoStyle}
          />

          <div>
            <h1 style={titleStyle}>{t('startWalk.title')}</h1>
            <p style={subtitleStyle}>{t('startWalk.subtitle')}</p>
          </div>
        </div>

        <LanguageSwitcher />
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t('startWalk.dog')}</h2>

        <DogFilters filters={filters} onChange={handleFilterChange} />

        {loadingDogs && <p>{t('startWalk.loadingDogs')}</p>}
        {dogsError && <p style={errorStyle}>{dogsError}</p>}

        {!loadingDogs && !dogsError && filteredDogs.length === 0 && (
          <p>{t('startWalk.noDogs')}</p>
        )}

        {!loadingDogs && !dogsError && filteredDogs.length > 0 && (
          <div style={scrollAreaStyle}>
            <div style={dogGridStyle}>
              {filteredDogs.map((dog) => {
                const isSelected = String(dog.id) === String(dogId)

                return (
                  <DogCard
                    key={dog.id}
                    dog={dog}
                    selected={isSelected}
                    onClick={() => setDogId(String(dog.id))}
                    action={
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDogId(String(dog.id))
                        }}
                        style={{
                          ...selectDogButtonStyle,
                          background: isSelected ? '#166534' : '#8a5a2b',
                        }}
                      >
                        {isSelected ? t('startWalk.selectedDog') : t('startWalk.selectThisDog')}
                      </button>
                    }
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t('startWalk.title')}</h2>

        <div style={formGridStyle}>
          <div>
            <label style={labelStyle}>{t('startWalk.yourName')}</label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('startWalk.phoneNumber')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('startWalk.emailOptional')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label style={labelStyle}>{t('startWalk.checkoutNotesOptional')}</label>
          <textarea
            value={checkoutNotes}
            onChange={(e) => setCheckoutNotes(e.target.value)}
            rows={4}
            style={textareaStyle}
            placeholder={t('startWalk.checkoutNotesPlaceholder')}
          />
        </div>
        <div>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>
            <strong>{t('startWalk.expectedReturnTime')}</strong>
          </p>
        </div>

        {submitError && <p style={errorStyle}>{submitError}</p>}

        <div style={{ marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={submitting || !dogId}
            className="azl-button-primary"
            style={{
              //...primaryButtonStyle,
              opacity: submitting || !dogId ? 0.7 : 1,
              cursor: submitting || !dogId ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? t('startWalk.startingWalk') : t('startWalk.startWalk')}
          </button>
        </div>
      </form>
    </div>
  )
}

function getTodayAt11AM() {
  const date = new Date()

  date.setHours(11, 0, 0, 0)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = '11'
  const minutes = '00'

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const pageStyle = {
  padding: '2rem',
  maxWidth: '960px',
  margin: '0 auto',
}

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '2rem',
}

const titleStyle = {
  margin: 0,
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
}

const dogGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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

const primaryButtonStyle = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '0.8rem 1rem',
  borderRadius: '10px',
  fontSize: '1rem',
}

const errorStyle = {
  color: 'crimson',
  marginTop: '1rem',
}

const scrollAreaStyle = {
  maxHeight: '60vh',
  overflowY: 'auto',
  paddingRight: '0.25rem',
}

const brandRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
}

const logoStyle = {
  width: '72px',
  height: '72px',
  objectFit: 'contain',
  flexShrink: 0,
}

const readonlyBoxStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '10px',
  background: '#f9fafb',
  color: '#444',
  boxSizing: 'border-box',
}

const selectDogButtonStyle = {
  width: '100%',
  color: '#fff',
  border: 'none',
  padding: '0.85rem 1rem',
  borderRadius: '999px',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
}