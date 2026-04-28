import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import DogCard from '../components/DogCard'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useMemo } from 'react'
import DogFilters from '../components/DogFilters'
import { filterDogs } from '../utils/dogFilters'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const [dogs, setDogs] = useState([])
  const [activeWalks, setActiveWalks] = useState([])
  const [loadingDogs, setLoadingDogs] = useState(true)
  const [loadingWalks, setLoadingWalks] = useState(true)
  const [errorDogs, setErrorDogs] = useState('')
  const [errorWalks, setErrorWalks] = useState('')
  
  const [filters, setFilters] = useState({
    searchText: '',
    size: 'all',
    sex: 'all',
    ageRange: 'all',
  })

  useEffect(() => {
    loadDogs()
    loadActiveWalks()
  }, [])

  const loadDogs = async () => {
    setLoadingDogs(true)
    setErrorDogs('')

    const { data, error } = await supabase
      .from('dogs_view')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      setErrorDogs(error.message)
      setDogs([])
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

  const loadActiveWalks = async () => {
    setLoadingWalks(true)
    setErrorWalks('')

    const { data, error } = await supabase
      .from('active_walks_view')
      .select('*')
      .order('expected_return_at', { ascending: true })

    if (error) {
      setErrorWalks(error.message)
      setActiveWalks([])
    } else {
      setActiveWalks(data || [])
    }

    setLoadingWalks(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleReturnWalk = async (walk) => {
    const confirmed = window.confirm(
      t('dashboard.confirmReturn', { dogName: walk.dog_name })
    )
    if (!confirmed) return

    const { error } = await supabase.rpc('return_walk', {
      p_walk_id: walk.walk_id,
      p_public_token: walk.public_token,
      p_return_notes: t('dashboard.returnByVolunteer'),
    })

    if (error) {
      alert(error.message)
      return
    }

    await loadActiveWalks()
    await loadDogs()
  }

  const handleToggleAvailability = async (dog) => {
    if (dog.status === 'out_on_walk') {
      alert('This dog is currently out on a walk.')
      return
    }

    const nextStatus = dog.status === 'unavailable' ? 'available' : 'unavailable'

    const { error } = await supabase
      .from('dogs')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dog.id)

    if (error) {
      alert(error.message)
      return
    }

    await loadDogs()
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          gap: '1rem',
        }}
      >
        <h1>{t('dashboard.title')}</h1>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/walks/new" style={newDogLinkStyle}>
            {t('dashboard.startWalkForPerson')}
          </Link>
          <Link to="/dogs/new" style={newDogLinkStyle}>
            {t('dogForm.create')}
          </Link>
          <LanguageSwitcher />
          <button onClick={handleLogout}>{t('common.logout')}</button>
        </div>
      </div>

      <section style={{ marginBottom: '3rem' }}>
        <h2>{t('dashboard.activeWalks')}</h2>

        {loadingWalks && <p>{t('common.loading')}</p>}
        {errorWalks && <p style={{ color: 'crimson' }}>{errorWalks}</p>}

        {!loadingWalks && !errorWalks && activeWalks.length === 0 && (
          <p>{t('dashboard.noActiveWalks')}</p>
        )}

        {!loadingWalks && !errorWalks && activeWalks.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '1rem',
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>{t('startWalk.dog')}</th>
                  <th style={thStyle}>{t('dashboard.walker')}</th>
                  <th style={thStyle}>{t('dashboard.phone')}</th>
                  <th style={thStyle}>{t('dashboard.checkedOut')}</th>
                  <th style={thStyle}>{t('dashboard.expectedReturn')}</th>
                  <th style={thStyle}>{t('dashboard.status')}</th>
                  <th style={thStyle}>{t('dashboard.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {activeWalks.map((walk) => (
                  <tr key={walk.walk_id}>
                    <td style={tdStyle}>{walk.dog_name}</td>
                    <td style={tdStyle}>{walk.person_name}</td>
                    <td style={tdStyle}>
                      <a href={`tel:${walk.phone}`}>{walk.phone}</a>
                    </td>
                    <td style={tdStyle}>
                      {formatDateTime(walk.checked_out_at, i18n.language)}
                    </td>
                    <td style={tdStyle}>
                      {formatDateTime(walk.expected_return_at, i18n.language)}
                    </td>
                    <td style={tdStyle}>
                      {walk.overdue ? t('publicWalk.overdue') : t('publicWalk.active')}
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => handleReturnWalk(walk)}>
                        {t('dashboard.returnDog')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2>{t('dashboard.dogs')}</h2>

        <DogFilters filters={filters} onChange={handleFilterChange} />

        {loadingDogs && <p>{t('common.loading')}</p>}
        {errorDogs && <p style={{ color: 'crimson' }}>{errorDogs}</p>}

        {!loadingDogs && !errorDogs && filteredDogs.length === 0 && (
          <p>{t('dashboard.noDogs')}</p>
        )}

        {!loadingDogs && !errorDogs && filteredDogs.length > 0 && (
          <div style={dogsScrollAreaStyle}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              {filteredDogs.map((dog) => (
                <DogCard
                  key={dog.id}
                  dog={dog}
                  action={
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleToggleAvailability(dog)}
                        disabled={dog.status === 'out_on_walk'}
                        style={{
                          ...toggleButtonStyle,
                          background:
                            dog.status === 'unavailable' ? '#dcfce7' : '#fee2e2',
                          color:
                            dog.status === 'unavailable' ? '#166534' : '#991b1b',
                          border:
                            dog.status === 'unavailable'
                              ? '1px solid #86efac'
                              : '1px solid #fca5a5',
                          opacity: dog.status === 'out_on_walk' ? 0.6 : 1,
                          cursor: dog.status === 'out_on_walk' ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {dog.status === 'unavailable'
                          ? t('dashboard.unlockDog')
                          : t('dashboard.lockDog')}
                      </button>

                      <Link to={`/dogs/${dog.id}/edit`} style={editLinkStyle}>
                        {t('dogForm.edit')}
                      </Link>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function formatDateTime(value, language) {
  if (!value) return '-'
  return new Date(value).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')
}

const thStyle = {
  textAlign: 'left',
  borderBottom: '1px solid #ddd',
  padding: '0.75rem',
}

const tdStyle = {
  borderBottom: '1px solid #eee',
  padding: '0.75rem',
}

const dogsScrollAreaStyle = {
  maxHeight: '60vh',
  overflowY: 'auto',
  paddingRight: '0.25rem',
}

const newDogLinkStyle = {
  display: 'inline-block',
  padding: '0.55rem 0.8rem',
  borderRadius: '8px',
  background: '#dbeafe',
  color: '#1d4ed8',
  textDecoration: 'none',
}

const editLinkStyle = {
  display: 'inline-block',
  padding: '0.45rem 0.7rem',
  borderRadius: '8px',
  background: '#f3f4f6',
  color: '#111827',
  textDecoration: 'none',
  border: '1px solid #d1d5db',
}

const toggleButtonStyle = {
  padding: '0.45rem 0.7rem',
  borderRadius: '8px',
  fontSize: '0.95rem',
}