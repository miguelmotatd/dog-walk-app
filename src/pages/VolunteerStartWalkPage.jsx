import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import DogCard from '../components/DogCard'
import DogFilters from '../components/DogFilters'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { filterDogs } from '../utils/dogFilters'

export default function VolunteerStartWalkPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [dogs, setDogs] = useState([])
  const [filters, setFilters] = useState({
    searchText: '',
    sex: 'all',
    size: 'all',
    ageRange: 'all',
  })

  const [dogId, setDogId] = useState('')
  const [personName, setPersonName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [expectedReturnAt] = useState(getTodayAt11AM())

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [volunteerName, setVolunteerName] = useState('')

  const filteredDogs = filterDogs(dogs, filters)
  const selectedDog = dogs.find((dog) => String(dog.id) === String(dogId))

  useEffect(() => {
    loadDogs()
    loadVolunteerName()
  }, [])

  const loadDogs = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('dogs_view')
      .select('id, name, status, size, sex, estimated_birth_year, age, image_url, notes_summary, is_active')
      .eq('is_active', true)
      .eq('status', 'available')
      .order('name', { ascending: true })

    if (error) {
      setErrorMessage(error.message)
      setDogs([])
    } else {
      setDogs(data || [])
    }

    setLoading(false)
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    const { error } = await supabase.rpc('start_walk', {
      p_dog_id: Number(dogId),
      p_person_name: personName,
      p_phone: phone,
      p_expected_return_at: new Date(expectedReturnAt).toISOString(),
      p_checkout_notes: checkoutNotes || t('dashboard.startedByVolunteer', { volunteerName }),
      p_email: email || null,
    })

    if (error) {
      setErrorMessage(error.message)
      setSubmitting(false)
      return
    }

    navigate('/')
  }

  const loadVolunteerName = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data } = await supabase
    .from('volunteer_profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  if (data?.name) setVolunteerName(data.name)
}

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{t('dashboard.startWalkForPerson')}</h1>
          <div style={{ marginTop: '0.75rem' }}>
            <Link to="/" style={backLinkStyle}>{t('common.back')}</Link>
          </div>
        </div>
        <LanguageSwitcher />
      </div>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{t('startWalk.dog')}</h2>

        <DogFilters filters={filters} onChange={handleFilterChange} />

        {loading && <p>{t('common.loading')}</p>}

        {!loading && filteredDogs.length === 0 && (
          <p>{t('startWalk.noDogs')}</p>
        )}

        {!loading && filteredDogs.length > 0 && (
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
                        onClick={(event) => {
                          event.stopPropagation()
                          setDogId(String(dog.id))
                        }}
                        style={{
                          ...selectDogButtonStyle,
                          background: isSelected ? '#166534' : '#8a5a2b',
                        }}
                      >
                        {isSelected
                          ? t('startWalk.selectedDog')
                          : t('startWalk.selectThisDog')}
                      </button>
                    }
                  />
                )
              })}
            </div>
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} style={cardStyle}>
        <h2 style={sectionTitleStyle}>
          {selectedDog
            ? t('startWalk.titleWithDog', { name: selectedDog.name })
            : t('startWalk.title')}
        </h2>

        <div style={formGridStyle}>
          <div>
            <label style={labelStyle}>{t('startWalk.yourName')}</label>
            <input
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

          <div>
            <label style={labelStyle}>{t('startWalk.expectedReturnTime')}</label>
            <div style={readonlyBoxStyle}>11:00</div>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <label style={labelStyle}>{t('startWalk.checkoutNotesOptional')}</label>
          <textarea
            value={checkoutNotes}
            onChange={(e) => setCheckoutNotes(e.target.value)}
            rows={4}
            style={textareaStyle}
          />
        </div>

        {errorMessage && <p style={errorStyle}>{errorMessage}</p>}

        <button
          type="submit"
          disabled={submitting || !dogId}
          style={{
            ...primaryButtonStyle,
            opacity: submitting || !dogId ? 0.7 : 1,
            cursor: submitting || !dogId ? 'not-allowed' : 'pointer',
            marginTop: '1rem',
          }}
        >
          {submitting ? t('startWalk.startingWalk') : t('startWalk.startWalk')}
        </button>
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

  return `${year}-${month}-${day}T11:00`
}

const pageStyle = {
  padding: '2rem',
  maxWidth: '1100px',
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
  border: '1px solid #e4d8c8',
  borderRadius: '16px',
  padding: '1.25rem',
  background: '#fff',
  marginBottom: '1.5rem',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
}

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: '1rem',
  color: '#6f451f',
}

const scrollAreaStyle = {
  maxHeight: '520px',
  overflowY: 'auto',
  padding: '0.5rem',
  border: '1px solid #e4d8c8',
  borderRadius: '14px',
  background: '#f7f3ec',
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
  border: '1px solid #d6c8b8',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}

const readonlyBoxStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d6c8b8',
  borderRadius: '10px',
  background: '#f7f3ec',
  boxSizing: 'border-box',
  fontWeight: 600,
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
}

const primaryButtonStyle = {
  background: '#8a5a2b',
  color: '#fff',
  border: 'none',
  padding: '0.85rem 1.2rem',
  borderRadius: '999px',
  fontSize: '1rem',
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

const linkStyle = {
  display: 'inline-block',
  padding: '0.55rem 0.8rem',
  borderRadius: '8px',
  background: '#eff6ff',
  color: '#1d4ed8',
  textDecoration: 'none',
}

const errorStyle = {
  color: 'crimson',
}

const backLinkStyle = {
  display: 'inline-block',
  marginTop: '0.75rem',
  color: '#6f451f',
  fontWeight: 700,
}

const titleStyle = {
  margin: 0,
  color: '#6f451f',
}