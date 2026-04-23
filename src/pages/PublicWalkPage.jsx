import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function PublicWalkPage() {
  const { t, i18n } = useTranslation()
  const { walkId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') || ''

  const [walk, setWalk] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const [noteType, setNoteType] = useState('general')
  const [noteContent, setNoteContent] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [noteError, setNoteError] = useState('')

  const [returnNotes, setReturnNotes] = useState('')
  const [returningWalk, setReturningWalk] = useState(false)
  const [returnError, setReturnError] = useState('')

  const isReturned = useMemo(() => walk?.status === 'returned', [walk])

  useEffect(() => {
    if (!walkId || !token) {
      setPageError(t('publicWalk.missingWalkOrToken'))
      setLoading(false)
      return
    }

    loadPage()
  }, [walkId, token, t])

  const loadPage = async () => {
    setLoading(true)
    setPageError('')

    const [walkResponse, notesResponse] = await Promise.all([
      supabase.rpc('public_get_walk', {
        p_walk_id: Number(walkId),
        p_public_token: token,
      }),
      supabase.rpc('public_get_walk_notes', {
        p_walk_id: Number(walkId),
        p_public_token: token,
      }),
    ])

    if (walkResponse.error) {
      setPageError(walkResponse.error.message)
      setWalk(null)
      setNotes([])
      setLoading(false)
      return
    }

    if (notesResponse.error) {
      setPageError(notesResponse.error.message)
      setWalk(null)
      setNotes([])
      setLoading(false)
      return
    }

    const walkRow = Array.isArray(walkResponse.data)
      ? walkResponse.data[0]
      : walkResponse.data

    setWalk(walkRow || null)
    setNotes(notesResponse.data || [])
    setLoading(false)
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    setAddingNote(true)
    setNoteError('')

    const { error } = await supabase.rpc('add_walk_note', {
      p_walk_id: Number(walkId),
      p_public_token: token,
      p_note_type: noteType,
      p_content: noteContent,
    })

    if (error) {
      setNoteError(error.message)
      setAddingNote(false)
      return
    }

    setNoteContent('')
    await loadPage()
    setAddingNote(false)
  }

  const handleReturnWalk = async (e) => {
    e.preventDefault()
    setReturningWalk(true)
    setReturnError('')

    const { error } = await supabase.rpc('return_walk', {
      p_walk_id: Number(walkId),
      p_public_token: token,
      p_return_notes: returnNotes || null,
    })

    if (error) {
      setReturnError(error.message)
      setReturningWalk(false)
      return
    }

    await loadPage()
    setReturningWalk(false)
  }

  if (loading) {
    return <div style={pageStyle}>{t('common.loading')}</div>
  }

  if (pageError) {
    return (
      <div style={pageStyle}>
        <div style={headerRowStyle}>
          <h1 style={titleStyle}>{t('publicWalk.title')}</h1>
          <LanguageSwitcher />
        </div>
        <p style={errorStyle}>{pageError}</p>
      </div>
    )
  }

  if (!walk) {
    return (
      <div style={pageStyle}>
        <div style={headerRowStyle}>
          <h1 style={titleStyle}>{t('publicWalk.title')}</h1>
          <LanguageSwitcher />
        </div>
        <p>{t('publicWalk.walkNotFound')}</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={titleStyle}>{walk.dog_name}</h1>
          <div style={{ marginTop: '0.75rem' }}>
            <Link to="/my-walks" style={linkStyle}>
              {t('myWalks.title')}
            </Link>
            <button
              onClick={() => navigate('/start-walk')}
              style={secondaryButtonStyle}
            >
              {t('common.back')}
            </button>
          </div>
        </div>
        <LanguageSwitcher />
      </div>

      <div style={cardStyle}>
        <div style={infoGridStyle}>
          <InfoRow
            label={t('publicWalk.walker')}
            value={walk.person_name}
          />
          <InfoRow
            label={t('publicWalk.checkedOut')}
            value={formatDateTime(walk.checked_out_at, i18n.language)}
          />
          <InfoRow
            label={t('publicWalk.expectedReturn')}
            value={formatDateTime(walk.expected_return_at, i18n.language)}
          />
          <InfoRow
            label={t('publicWalk.status')}
            value={
              walk.status === 'returned'
                ? t('publicWalk.returned')
                : walk.overdue
                ? t('publicWalk.overdue')
                : t('publicWalk.active')
            }
            valueStyle={
              walk.status === 'returned'
                ? {}
                : walk.overdue
                ? { color: 'crimson', fontWeight: 700 }
                : { color: '#166534', fontWeight: 700 }
            }
          />
        </div>

        {walk.checkout_notes && (
          <div style={noteBlockStyle}>
            <strong>{t('publicWalk.checkoutNotes')}:</strong>
            <p style={paragraphStyle}>{walk.checkout_notes}</p>
          </div>
        )}

        {walk.returned_at && (
          <div style={noteBlockStyle}>
            <strong>{t('publicWalk.returnedAt')}:</strong>
            <p style={paragraphStyle}>
              {formatDateTime(walk.returned_at, i18n.language)}
            </p>
          </div>
        )}

        {walk.return_notes && (
          <div style={noteBlockStyle}>
            <strong>{t('publicWalk.returnNotes')}:</strong>
            <p style={paragraphStyle}>{walk.return_notes}</p>
          </div>
        )}
      </div>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{t('publicWalk.notesFromThisWalk')}</h2>

        {notes.length === 0 ? (
          <p>{t('publicWalk.noNotesYet')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {notes.map((note) => (
              <div key={note.note_id} style={noteCardStyle}>
                <p style={{ margin: '0 0 0.4rem 0', fontWeight: 700 }}>
                  {t(`notes.${note.note_type}`)}
                </p>
                <p style={{ margin: '0 0 0.4rem 0' }}>{note.content}</p>
                <small>{formatDateTime(note.created_at, i18n.language)}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      {!isReturned && (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>{t('publicWalk.addNote')}</h2>

          <form onSubmit={handleAddNote} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{t('publicWalk.noteType')}</label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                style={inputStyle}
              >
                <option value="general">{t('notes.general')}</option>
                <option value="behavior">{t('notes.behavior')}</option>
                <option value="warning">{t('notes.warning')}</option>
                <option value="preference">{t('notes.preference')}</option>
                <option value="route">{t('notes.route')}</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>{t('publicWalk.comment')}</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                style={textareaStyle}
                placeholder={t('publicWalk.commentPlaceholder')}
                required
              />
            </div>

            {noteError && <p style={errorStyle}>{noteError}</p>}

            <button
              type="submit"
              disabled={addingNote}
              style={{
                ...primaryButtonStyle,
                opacity: addingNote ? 0.7 : 1,
                cursor: addingNote ? 'not-allowed' : 'pointer',
              }}
            >
              {addingNote ? t('publicWalk.savingNote') : t('publicWalk.addNoteButton')}
            </button>
          </form>
        </section>
      )}

      {!isReturned && (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>{t('publicWalk.returnDog')}</h2>

          <form onSubmit={handleReturnWalk} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{t('publicWalk.finalNotesOptional')}</label>
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                rows={4}
                style={textareaStyle}
                placeholder={t('publicWalk.finalNotesPlaceholder')}
              />
            </div>

            {returnError && <p style={errorStyle}>{returnError}</p>}

            <button
              type="submit"
              disabled={returningWalk}
              style={{
                ...dangerButtonStyle,
                opacity: returningWalk ? 0.7 : 1,
                cursor: returningWalk ? 'not-allowed' : 'pointer',
              }}
            >
              {returningWalk
                ? t('publicWalk.returningDog')
                : t('publicWalk.returnDogButton')}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}

function InfoRow({ label, value, valueStyle = {} }) {
  return (
    <div>
      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.2rem' }}>
        {label}
      </div>
      <div style={valueStyle}>{value}</div>
    </div>
  )
}

function formatDateTime(value, language) {
  if (!value) return '-'
  return new Date(value).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')
}

const pageStyle = {
  padding: '2rem',
  maxWidth: '860px',
  margin: '0 auto',
}

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1.5rem',
}

const titleStyle = {
  margin: 0,
}

const cardStyle = {
  border: '1px solid #e5e5e5',
  borderRadius: '14px',
  padding: '1.25rem',
  background: '#fff',
  marginBottom: '1.25rem',
}

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: '1rem',
}

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
}

const noteBlockStyle = {
  marginTop: '1rem',
}

const paragraphStyle = {
  margin: '0.35rem 0 0 0',
}

const noteCardStyle = {
  border: '1px solid #eee',
  borderRadius: '10px',
  padding: '0.9rem',
  background: '#fafafa',
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

const dangerButtonStyle = {
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  padding: '0.8rem 1rem',
  borderRadius: '10px',
  fontSize: '1rem',
}

const secondaryButtonStyle = {
  marginLeft: '0.75rem',
  background: '#f3f4f6',
  color: '#111827',
  border: '1px solid #d1d5db',
  padding: '0.55rem 0.8rem',
  borderRadius: '8px',
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