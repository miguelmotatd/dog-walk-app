import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import DogCard from '../components/DogCard'
import DogFilters from '../components/DogFilters'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { filterDogs } from '../utils/dogFilters'

export default function DashboardPage() {
  const { t, i18n } = useTranslation()

  const [dogs, setDogs] = useState([])
  const [activeWalks, setActiveWalks] = useState([])
  const [loadingDogs, setLoadingDogs] = useState(true)
  const [loadingWalks, setLoadingWalks] = useState(true)
  const [errorDogs, setErrorDogs] = useState('')
  const [errorWalks, setErrorWalks] = useState('')
  const [warningText, setWarningText] = useState('')
  const [savingWarning, setSavingWarning] = useState(false)
  const [warningError, setWarningError] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [moreOpen, setMoreOpen] = useState(false)

  const [filters, setFilters] = useState({
    searchText: '',
    size: 'all',
    sex: 'all',
    ageRange: 'all',
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    loadDogs()
    loadActiveWalks()
    loadWarningText()
  }, [])

  const filteredDogs = useMemo(() => filterDogs(dogs, filters), [dogs, filters])

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

  const loadWarningText = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'start_walk_warning')
      .single()

    if (!error) {
      setWarningText(data?.value || '')
    }
  }

  const saveWarningText = async () => {
    setSavingWarning(true)
    setWarningError('')

    const { error } = await supabase
      .from('app_settings')
      .update({
        value: warningText,
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'start_walk_warning')

    if (error) setWarningError(error.message)

    setSavingWarning(false)
  }

  const clearWarningText = async () => {
    setSavingWarning(true)
    setWarningError('')

    const { error } = await supabase
      .from('app_settings')
      .update({
        value: '',
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'start_walk_warning')

    if (error) {
      setWarningError(error.message)
    } else {
      setWarningText('')
    }

    setSavingWarning(false)
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
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

    await Promise.all([loadActiveWalks(), loadDogs()])
  }

  const handleToggleAvailability = async (dog) => {
    if (dog.status === 'out_on_walk') {
      alert(t('dashboard.dogOutOnWalk', 'This dog is currently out on a walk.'))
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
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{t('dashboard.title')}</h1>
          <p style={subtitleStyle}>
            {activeWalks.length > 0
              ? t('dashboard.activeWalksCount', {
                  count: activeWalks.length,
                  defaultValue: '{{count}} active walks',
                })
              : t('dashboard.noActiveWalks')}
          </p>
        </div>

        {isMobile ? (
          <div style={mobileActionsStyle}>
            <Link to="/walks/new" style={mobilePrimaryActionStyle}>
              {t('dashboard.startWalkForPerson')}
            </Link>

            <button
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              style={moreButtonStyle}
            >
              {t('dashboard.moreOptions')} {moreOpen ? '▲' : '▼'}
            </button>

            {moreOpen && (
              <div style={mobileMenuStyle}>
                <Link to="/reports" style={mobileMenuItemStyle}>
                  {t('dashboard.reportsTitle')}
                </Link>

                <Link to="/dogs/new" style={mobileMenuItemStyle}>
                  {t('dogForm.create')}
                </Link>

                <div style={mobileMenuFooterStyle}>
                  <LanguageSwitcher />

                  <button onClick={handleLogout} style={mobileMenuButtonStyle}>
                    {t('common.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={topActionsStyle}>
            <Link to="/reports" style={secondaryLinkStyle}>
              {t('dashboard.reportsTitle')}
            </Link>

            <Link to="/walks/new" style={primaryLinkStyle}>
              {t('dashboard.startWalkForPerson')}
            </Link>

            <Link to="/dogs/new" style={secondaryLinkStyle}>
              {t('dogForm.create')}
            </Link>

            <LanguageSwitcher />

            <button onClick={handleLogout} style={ghostButtonStyle}>
              {t('common.logout')}
            </button>
          </div>
        )}
      </header>

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>{t('dashboard.activeWalks')}</h2>

          <button onClick={loadActiveWalks} style={smallButtonStyle}>
            {t('common.refresh')}
          </button>
        </div>

        {loadingWalks && <p style={mutedTextStyle}>{t('common.loading')}</p>}
        {errorWalks && <p style={errorStyle}>{errorWalks}</p>}

        {!loadingWalks && !errorWalks && activeWalks.length === 0 && (
          <div style={emptyStateStyle}>{t('dashboard.noActiveWalks')}</div>
        )}

        {!loadingWalks &&
          !errorWalks &&
          activeWalks.length > 0 &&
          (isMobile ? (
            <div style={mobileWalkListStyle}>
              {activeWalks.map((walk) => (
                <div key={walk.walk_id} style={mobileWalkCardStyle}>
                  <div style={mobileWalkHeaderStyle}>
                    <div>
                      <strong style={mobileDogNameStyle}>{walk.dog_name}</strong>
                      <div style={mobileWalkerStyle}>{walk.person_name}</div>
                    </div>

                    <span style={walk.overdue ? overdueBadgeStyle : activeBadgeStyle}>
                      {walk.overdue
                        ? t('publicWalk.overdue')
                        : t('publicWalk.active')}
                    </span>
                  </div>

                  <a href={`tel:${walk.phone}`} style={mobilePhoneStyle}>
                    {walk.phone}
                  </a>

                  <div style={mobileWalkMetaStyle}>
                    {t('dashboard.expectedReturn')}:{' '}
                    {formatTime(walk.expected_return_at, i18n.language)}
                  </div>

                  <button
                    onClick={() => handleReturnWalk(walk)}
                    style={mobileReturnButtonStyle}
                  >
                    {t('dashboard.returnDog')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
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
                      <td style={tdStrongStyle}>{walk.dog_name}</td>
                      <td style={tdStyle}>{walk.person_name}</td>
                      <td style={tdStyle}>
                        <a href={`tel:${walk.phone}`} style={phoneLinkStyle}>
                          {walk.phone}
                        </a>
                      </td>
                      <td style={tdStyle}>
                        {formatDateTime(walk.checked_out_at, i18n.language)}
                      </td>
                      <td style={tdStyle}>
                        {formatDateTime(walk.expected_return_at, i18n.language)}
                      </td>
                      <td style={tdStyle}>
                        <span style={walk.overdue ? overdueBadgeStyle : activeBadgeStyle}>
                          {walk.overdue
                            ? t('publicWalk.overdue')
                            : t('publicWalk.active')}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleReturnWalk(walk)}
                          style={returnButtonStyle}
                        >
                          {t('dashboard.returnDog')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </section>

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>{t('dashboard.dogs')}</h2>
            <p style={sectionHintStyle}>
              {t('dashboard.dogsShown', {
                count: filteredDogs.length,
                total: dogs.length,
                defaultValue: '{{count}} of {{total}} dogs shown',
              })}
            </p>
          </div>

          <button onClick={loadDogs} style={smallButtonStyle}>
            {t('common.refresh')}
          </button>
        </div>

        <DogFilters filters={filters} onChange={handleFilterChange} />

        {loadingDogs && <p style={mutedTextStyle}>{t('common.loading')}</p>}
        {errorDogs && <p style={errorStyle}>{errorDogs}</p>}

        {!loadingDogs && !errorDogs && filteredDogs.length === 0 && (
          <div style={emptyStateStyle}>{t('dashboard.noDogs')}</div>
        )}

        {!loadingDogs && !errorDogs && filteredDogs.length > 0 && (
          <div style={dogsScrollAreaStyle}>
            <div style={dogGridStyle}>
              {filteredDogs.map((dog) => (
                <DogCard
                  key={dog.id}
                  dog={dog}
                  action={
                    <div style={dogActionsStyle}>
                      <button
                        onClick={() => handleToggleAvailability(dog)}
                        disabled={dog.status === 'out_on_walk'}
                        style={getToggleButtonStyle(dog.status)}
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

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>
            {t('dashboard.startWalkWarning', 'Start walk warning')}
          </h2>
        </div>

        <textarea
          value={warningText}
          onChange={(e) => setWarningText(e.target.value)}
          rows={4}
          style={textareaStyle}
        />

        {warningError && <p style={errorStyle}>{warningError}</p>}

        <div style={warningActionsStyle}>
          <button
            onClick={saveWarningText}
            disabled={savingWarning}
            style={smallButtonStyle}
          >
            {savingWarning
              ? t('common.saving', 'Saving...')
              : t('common.save', 'Save')}
          </button>

          <button
            onClick={clearWarningText}
            disabled={savingWarning || !warningText}
            style={clearButtonStyle}
          >
            {t('dashboard.clearWarning', 'Clear warning')}
          </button>
        </div>
      </section>
    </div>
  )
}

function formatDateTime(value, language) {
  if (!value) return '-'
  return new Date(value).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')
}

function formatTime(value, language) {
  if (!value) return '-'
  return new Date(value).toLocaleTimeString(language === 'pt' ? 'pt-PT' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const pageStyle = {
  padding: '1rem',
  maxWidth: '1200px',
  margin: '0 auto',
  background: '#f7f3ec',
  minHeight: '100vh',
}

const headerStyle = {
  display: 'grid',
  gap: '1rem',
  marginBottom: '1.25rem',
}

const titleStyle = {
  margin: 0,
  color: '#6f451f',
  fontSize: 'clamp(2rem, 8vw, 3rem)',
  lineHeight: 1.05,
}

const subtitleStyle = {
  margin: '0.5rem 0 0 0',
  color: '#6b6b6b',
  fontSize: '1.1rem',
}

const topActionsStyle = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
}

const mobileActionsStyle = {
  display: 'grid',
  gap: '0.75rem',
}

const mobilePrimaryActionStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  textAlign: 'center',
  padding: '0.95rem 1rem',
  borderRadius: '999px',
  background: '#8a5a2b',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 800,
  fontSize: '1rem',
}

const moreButtonStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  borderRadius: '999px',
  border: '1px solid #e4d8c8',
  background: '#fff8ef',
  color: '#6f451f',
  fontWeight: 800,
  cursor: 'pointer',
}

const mobileMenuStyle = {
  display: 'grid',
  gap: '0.65rem',
  padding: '0.75rem',
  border: '1px solid #e4d8c8',
  borderRadius: '16px',
  background: '#fff',
}

const mobileMenuItemStyle = {
  display: 'block',
  padding: '0.75rem 0.85rem',
  borderRadius: '12px',
  background: '#fff8ef',
  color: '#6f451f',
  textDecoration: 'none',
  fontWeight: 700,
  border: '1px solid #e4d8c8',
}

const mobileMenuItemPlainStyle = {
  display: 'flex',
  justifyContent: 'flex-start',
}

const mobileMenuButtonStyle = {
  padding: '0.75rem 0.85rem',
  borderRadius: '12px',
  border: '1px solid #e4d8c8',
  background: '#fff',
  color: '#6f451f',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const cardStyle = {
  border: '1px solid #e4d8c8',
  borderRadius: '18px',
  padding: '1rem',
  background: '#fff',
  marginBottom: '1.25rem',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
}

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1rem',
  flexWrap: 'wrap',
}

const sectionTitleStyle = {
  margin: 0,
  color: '#6f451f',
  fontSize: '1.65rem',
}

const sectionHintStyle = {
  margin: '0.35rem 0 0 0',
  color: '#6b6b6b',
  fontSize: '0.95rem',
}

const tableWrapperStyle = {
  overflowX: 'auto',
  border: '1px solid #eee',
  borderRadius: '14px',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '780px',
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

const phoneLinkStyle = {
  color: '#1d4ed8',
  textDecoration: 'none',
  fontWeight: 700,
}

const activeBadgeStyle = {
  display: 'inline-block',
  padding: '0.35rem 0.65rem',
  borderRadius: '999px',
  background: '#dcfce7',
  color: '#166534',
  fontWeight: 700,
  fontSize: '0.85rem',
}

const overdueBadgeStyle = {
  ...activeBadgeStyle,
  background: '#fee2e2',
  color: '#991b1b',
}

const returnButtonStyle = {
  background: '#8a5a2b',
  color: '#fff',
  border: 'none',
  padding: '0.55rem 0.8rem',
  borderRadius: '999px',
  cursor: 'pointer',
  fontWeight: 700,
}

const mobileWalkListStyle = {
  display: 'grid',
  gap: '0.8rem',
}

const mobileWalkCardStyle = {
  border: '1px solid #e4d8c8',
  borderRadius: '16px',
  padding: '1rem',
  background: '#fff8ef',
}

const mobileWalkHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '0.75rem',
}

const mobileDogNameStyle = {
  fontSize: '1.2rem',
  color: '#2f2f2f',
}

const mobileWalkerStyle = {
  marginTop: '0.2rem',
  color: '#6b6b6b',
}

const mobilePhoneStyle = {
  display: 'block',
  marginTop: '0.75rem',
  color: '#1d4ed8',
  fontWeight: 800,
  textDecoration: 'none',
  fontSize: '1.05rem',
}

const mobileWalkMetaStyle = {
  marginTop: '0.6rem',
  color: '#6b6b6b',
  fontSize: '0.95rem',
}

const mobileReturnButtonStyle = {
  marginTop: '0.9rem',
  width: '100%',
  background: '#8a5a2b',
  color: '#fff',
  border: 'none',
  padding: '0.85rem 1rem',
  borderRadius: '999px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '1rem',
}

const primaryLinkStyle = {
  display: 'inline-block',
  padding: '0.65rem 0.95rem',
  borderRadius: '999px',
  background: '#8a5a2b',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
}

const secondaryLinkStyle = {
  display: 'inline-block',
  padding: '0.65rem 0.95rem',
  borderRadius: '999px',
  background: '#fff8ef',
  color: '#6f451f',
  textDecoration: 'none',
  border: '1px solid #e4d8c8',
  fontWeight: 700,
}

const ghostButtonStyle = {
  padding: '0.65rem 0.95rem',
  borderRadius: '999px',
  border: '1px solid #e4d8c8',
  background: '#fff',
  color: '#6f451f',
  cursor: 'pointer',
  fontWeight: 700,
}

const smallButtonStyle = {
  padding: '0.5rem 0.8rem',
  borderRadius: '999px',
  border: '1px solid #e4d8c8',
  background: '#fff8ef',
  color: '#6f451f',
  cursor: 'pointer',
  fontWeight: 700,
}

const mutedTextStyle = {
  color: '#6b6b6b',
}

const errorStyle = {
  color: 'crimson',
}

const emptyStateStyle = {
  padding: '1.25rem',
  borderRadius: '14px',
  background: '#f7f3ec',
  color: '#6b6b6b',
  textAlign: 'center',
}

const dogsScrollAreaStyle = {
  maxHeight: '70vh',
  overflowY: 'auto',
  padding: '0.5rem',
  border: '1px solid #e4d8c8',
  borderRadius: '14px',
  background: '#f7f3ec',
}

const dogGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem',
}

const dogActionsStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
}

const editLinkStyle = {
  display: 'inline-block',
  padding: '0.5rem 0.75rem',
  borderRadius: '999px',
  background: '#fff',
  color: '#6f451f',
  textDecoration: 'none',
  border: '1px solid #e4d8c8',
  fontWeight: 700,
}

const textareaStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d6c8b8',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  resize: 'vertical',
  marginBottom: '1rem',
}

const warningActionsStyle = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
}

const clearButtonStyle = {
  padding: '0.5rem 0.8rem',
  borderRadius: '999px',
  border: '1px solid #fca5a5',
  background: '#fee2e2',
  color: '#991b1b',
  cursor: 'pointer',
  fontWeight: 700,
}

function getToggleButtonStyle(status) {
  const isUnavailable = status === 'unavailable'
  const isOut = status === 'out_on_walk'

  return {
    padding: '0.5rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.95rem',
    fontWeight: 700,
    background: isUnavailable ? '#dcfce7' : '#fee2e2',
    color: isUnavailable ? '#166534' : '#991b1b',
    border: isUnavailable ? '1px solid #86efac' : '1px solid #fca5a5',
    opacity: isOut ? 0.55 : 1,
    cursor: isOut ? 'not-allowed' : 'pointer',
  }
}

const mobileMenuFooterStyle = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
}