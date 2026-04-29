import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function ReportsPage() {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState('dog')

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{t('reports.title')}</h1>
          <Link to="/" style={backLinkStyle}>{t('common.back')}</Link>
        </div>
        <LanguageSwitcher />
      </header>

      <div style={tabsStyle}>
        <button
          onClick={() => setTab('dog')}
          style={tab === 'dog' ? activeTabStyle : tabStyle}
        >
          {t('reports.byDog')}
        </button>
        <button
          onClick={() => setTab('date')}
          style={tab === 'date' ? activeTabStyle : tabStyle}
        >
          {t('reports.byDate')}
        </button>
      </div>

      {tab === 'dog' ? <DogReport language={i18n.language} /> : <DateReport language={i18n.language} />}
    </div>
  )
}

function DogReport({ language }) {
  const { t } = useTranslation()
  const [dogs, setDogs] = useState([])
  const [dogSearch, setDogSearch] = useState('')
  const [showDogDropdown, setShowDogDropdown] = useState(false)
  const [selectedDogId, setSelectedDogId] = useState('')
  const [walks, setWalks] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const dogDropdownRef = useRef(null)

  useEffect(() => {
    loadDogs()
  }, [])

  useEffect(() => {
    if (selectedDogId) loadDogReport(selectedDogId)
  }, [selectedDogId])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dogDropdownRef.current?.contains(event.target)) {
        setShowDogDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const filteredDogs = useMemo(() => {
    const text = dogSearch.toLowerCase().trim()
    if (!text) return dogs
    return dogs.filter((dog) => dog.name.toLowerCase().includes(text))
  }, [dogs, dogSearch])

  const selectedDog = dogs.find((dog) => String(dog.id) === String(selectedDogId))

  const loadDogs = async () => {
    const { data, error } = await supabase
      .from('dogs_view')
      .select('id, name, status, image_url, age, sex, size')
      .order('name', { ascending: true })

    if (!error) setDogs(data || [])
  }

  const loadDogReport = async (dogId) => {
    setLoading(true)
    setErrorMessage('')

    const [walksResult, notesResult] = await Promise.all([
      supabase.rpc('report_dog_walks', { p_dog_id: Number(dogId) }),
      supabase.rpc('report_dog_notes', { p_dog_id: Number(dogId) }),
    ])

    if (walksResult.error) {
      setErrorMessage(walksResult.error.message)
      setWalks([])
      setNotes([])
    } else if (notesResult.error) {
      setErrorMessage(notesResult.error.message)
      setWalks([])
      setNotes([])
    } else {
      setWalks(walksResult.data || [])
      setNotes(notesResult.data || [])
    }

    setLoading(false)
  }

  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>{t('reports.dogReport')}</h2>

      <div style={selectorGridStyle}>
        <div ref={dogDropdownRef} style={{ position: 'relative' }}>
          <label style={labelStyle}>{t('reports.selectDog')}</label>
          <input
            value={dogSearch}
            onFocus={() => setShowDogDropdown(true)}
            onChange={(e) => {
              setDogSearch(e.target.value)
              setShowDogDropdown(true)
              if (selectedDog && e.target.value !== selectedDog.name) {
                setSelectedDogId('')
              }
            }}
            placeholder={t('reports.searchDogPlaceholder')}
            style={inputStyle}
          />

          {showDogDropdown && (
            <div style={dropdownMenuStyle}>
              {filteredDogs.length === 0 ? (
                <div style={dropdownEmptyStyle}>{t('reports.noWalks')}</div>
              ) : (
                filteredDogs.map((dog) => (
                  <button
                    key={dog.id}
                    type="button"
                    onClick={() => {
                      setSelectedDogId(String(dog.id))
                      setDogSearch(dog.name)
                      setShowDogDropdown(false)
                    }}
                    style={
                      String(dog.id) === String(selectedDogId)
                        ? { ...dropdownItemStyle, ...dropdownItemActiveStyle }
                        : dropdownItemStyle
                    }
                  >
                    {dog.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedDog && (
        <div style={selectedDogStyle}>
          {selectedDog.image_url && (
            <img src={selectedDog.image_url} alt={selectedDog.name} style={dogThumbStyle} />
          )}
          <div>
            <strong>{selectedDog.name}</strong>
            <div style={mutedTextStyle}>
              {selectedDog.size || '-'} · {selectedDog.sex ? t(`dog.${selectedDog.sex}`) : '-'} ·{' '}
              {selectedDog.age != null ? formatAge(selectedDog.age, language) : '-'}
            </div>
          </div>
        </div>
      )}

      {loading && <p>{t('common.loading')}</p>}
      {errorMessage && <p style={errorStyle}>{errorMessage}</p>}

      {selectedDogId && !loading && !errorMessage && (
        <>
          <ReportList
            title={t('reports.walkHistory')}
            emptyMessage={t('reports.noWalks')}
            items={walks}
            renderItem={(walk) => <WalkReportCard walk={walk} language={language} />}
          />

          <ReportList
            title={t('reports.notes')}
            emptyMessage={t('reports.noNotes')}
            items={notes}
            renderItem={(note) => <NoteReportCard note={note} language={language} />}
          />
        </>
      )}
    </section>
  )
}

function DateReport({ language }) {
  const { t } = useTranslation()
  const [reportDate, setReportDate] = useState(getTodayDate())
  const [walks, setWalks] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadDateReport()
  }, [reportDate])

  const summary = useMemo(() => {
    const uniqueDogs = new Set(walks.map((walk) => walk.dog_id)).size
    const lateReturns = walks.filter((walk) => walk.was_late).length

    return {
      walks: walks.length,
      uniqueDogs,
      notes: notes.length,
      lateReturns,
    }
  }, [walks, notes])

  const loadDateReport = async () => {
    setLoading(true)
    setErrorMessage('')

    const [walksResult, notesResult] = await Promise.all([
      supabase.rpc('report_date_walks', { p_report_date: reportDate }),
      supabase.rpc('report_date_notes', { p_report_date: reportDate }),
    ])

    if (walksResult.error) {
      setErrorMessage(walksResult.error.message)
      setWalks([])
      setNotes([])
    } else if (notesResult.error) {
      setErrorMessage(notesResult.error.message)
      setWalks([])
      setNotes([])
    } else {
      setWalks(walksResult.data || [])
      setNotes(notesResult.data || [])
    }

    setLoading(false)
  }

  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>{t('reports.dateReport')}</h2>

      <div style={{ maxWidth: '280px', marginBottom: '1rem' }}>
        <label style={labelStyle}>{t('reports.selectDate')}</label>
        <input
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={summaryGridStyle}>
        <SummaryCard label={t('reports.totalWalks')} value={summary.walks} />
        <SummaryCard label={t('reports.uniqueDogs')} value={summary.uniqueDogs} />
        <SummaryCard label={t('reports.totalNotes')} value={summary.notes} />
        <SummaryCard label={t('reports.lateReturns')} value={summary.lateReturns} />
      </div>

      {loading && <p>{t('common.loading')}</p>}
      {errorMessage && <p style={errorStyle}>{errorMessage}</p>}

      {!loading && !errorMessage && (
        <>
          <ReportList
            title={t('reports.walksForDay')}
            emptyMessage={t('reports.noWalksForDay')}
            items={walks}
            renderItem={(walk) => <WalkReportCard walk={walk} language={language} />}
          />

          <ReportList
            title={t('reports.notesForDay')}
            emptyMessage={t('reports.noNotesForDay')}
            items={notes}
            renderItem={(note) => <NoteReportCard note={note} language={language} />}
          />
        </>
      )}
    </section>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div style={summaryCardStyle}>
      <div style={summaryValueStyle}>{value}</div>
      <div style={summaryLabelStyle}>{label}</div>
    </div>
  )
}

function ReportList({ title, items, emptyMessage, renderItem }) {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={subsectionTitleStyle}>{title}</h3>

      {items.length === 0 ? (
        <div style={emptyStateStyle}>{emptyMessage}</div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {items.map((item) => (
            <div key={item.walk_id || item.note_id}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WalkReportCard({ walk, language }) {
  const { t } = useTranslation()

  return (
    <div style={reportItemStyle}>
      <div style={reportItemHeaderStyle}>
        <strong>{walk.dog_name}</strong>
        <span style={walk.was_late ? lateBadgeStyle : normalBadgeStyle}>
          {walk.was_late ? t('reports.late') : t('reports.onTime')}
        </span>
      </div>

      <div style={reportMetaStyle}>
        {walk.person_name} · {formatDateTime(walk.checked_out_at, language)}
      </div>

      <div style={reportMetaStyle}>
        {t('dashboard.checkedOut')}: {formatTime(walk.checked_out_at, language)} ·{' '}
        {t('publicWalk.returnedAt')}: {formatTime(walk.returned_at, language)} ·{' '}
        {t('reports.duration')}: {walk.duration_minutes ?? '-'} min
      </div>

      {walk.checkout_notes && (
        <p style={noteTextStyle}><strong>{t('publicWalk.checkoutNotes')}:</strong> {walk.checkout_notes}</p>
      )}

      {walk.return_notes && (
        <p style={noteTextStyle}><strong>{t('publicWalk.returnNotes')}:</strong> {walk.return_notes}</p>
      )}
    </div>
  )
}

function NoteReportCard({ note, language }) {
  const { t } = useTranslation()

  return (
    <div style={reportItemStyle}>
      <div style={reportItemHeaderStyle}>
        <strong>{note.dog_name}</strong>
        <span style={noteBadgeStyle}>{t(`notes.${note.note_type}`)}</span>
      </div>

      <div style={reportMetaStyle}>
        {formatDateTime(note.created_at, language)}
        {note.person_name ? ` · ${note.person_name}` : ''}
      </div>

      <p style={noteTextStyle}>{note.content}</p>
    </div>
  )
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
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

function formatAge(age, language = 'en') {
  if (language === 'pt') return age === 1 ? '1 ano' : `${age} anos`
  return age === 1 ? '1 year' : `${age} years`
}

const pageStyle = {
  padding: '2rem',
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
  marginBottom: '1.5rem',
}

const titleStyle = {
  margin: 0,
  color: '#6f451f',
}

const backLinkStyle = {
  display: 'inline-block',
  marginTop: '0.75rem',
  color: '#6f451f',
  fontWeight: 700,
}

const tabsStyle = {
  display: 'flex',
  gap: '0.75rem',
  marginBottom: '1rem',
  flexWrap: 'wrap',
}

const tabStyle = {
  padding: '0.7rem 1rem',
  borderRadius: '999px',
  border: '1px solid #e4d8c8',
  background: '#fff',
  color: '#6f451f',
  cursor: 'pointer',
  fontWeight: 700,
}

const activeTabStyle = {
  ...tabStyle,
  background: '#8a5a2b',
  color: '#fff',
}

const cardStyle = {
  border: '1px solid #e4d8c8',
  borderRadius: '18px',
  padding: '1.25rem',
  background: '#fff',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
}

const sectionTitleStyle = {
  marginTop: 0,
  color: '#6f451f',
}

const selectorGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem',
  marginBottom: '1rem',
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: 700,
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d6c8b8',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}

const dropdownMenuStyle = {
  position: 'absolute',
  top: 'calc(100% + 0.35rem)',
  left: 0,
  right: 0,
  maxHeight: '260px',
  overflowY: 'auto',
  border: '1px solid #d6c8b8',
  borderRadius: '10px',
  background: '#fff',
  boxShadow: '0 8px 18px rgba(0, 0, 0, 0.1)',
  zIndex: 20,
}

const dropdownItemStyle = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  border: 'none',
  borderBottom: '1px solid #f0e9e1',
  background: '#fff',
  padding: '0.7rem 0.8rem',
  cursor: 'pointer',
}

const dropdownItemActiveStyle = {
  background: '#fff8ef',
  fontWeight: 700,
}

const dropdownEmptyStyle = {
  padding: '0.8rem',
  color: '#6b6b6b',
}

const selectedDogStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.9rem',
  borderRadius: '14px',
  background: '#fff8ef',
  marginBottom: '1rem',
}

const dogThumbStyle = {
  width: '56px',
  height: '56px',
  borderRadius: '12px',
  objectFit: 'cover',
}

const mutedTextStyle = {
  color: '#6b6b6b',
  marginTop: '0.2rem',
}

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '0.75rem',
  marginBottom: '1rem',
}

const summaryCardStyle = {
  padding: '1rem',
  borderRadius: '14px',
  background: '#fff8ef',
  border: '1px solid #e4d8c8',
}

const summaryValueStyle = {
  fontSize: '1.6rem',
  fontWeight: 800,
  color: '#6f451f',
}

const summaryLabelStyle = {
  color: '#6b6b6b',
  marginTop: '0.25rem',
}

const subsectionTitleStyle = {
  color: '#6f451f',
  marginBottom: '0.75rem',
}

const emptyStateStyle = {
  padding: '1rem',
  borderRadius: '14px',
  background: '#f7f3ec',
  color: '#6b6b6b',
}

const reportItemStyle = {
  border: '1px solid #eee',
  borderRadius: '14px',
  padding: '1rem',
  background: '#fff',
}

const reportItemHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '0.75rem',
  alignItems: 'center',
}

const reportMetaStyle = {
  color: '#6b6b6b',
  marginTop: '0.45rem',
  fontSize: '0.95rem',
}

const noteTextStyle = {
  margin: '0.7rem 0 0 0',
  lineHeight: 1.45,
}

const normalBadgeStyle = {
  padding: '0.3rem 0.6rem',
  borderRadius: '999px',
  background: '#dcfce7',
  color: '#166534',
  fontWeight: 700,
  fontSize: '0.8rem',
}

const lateBadgeStyle = {
  ...normalBadgeStyle,
  background: '#fee2e2',
  color: '#991b1b',
}

const noteBadgeStyle = {
  ...normalBadgeStyle,
  background: '#eff6ff',
  color: '#1d4ed8',
}

const errorStyle = {
  color: 'crimson',
}
