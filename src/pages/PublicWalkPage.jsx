import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PublicWalkPage() {
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
      setPageError('Missing walk id or token.')
      setLoading(false)
      return
    }

    loadPage()
  }, [walkId, token])

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
    return <div style={{ padding: '2rem' }}>Loading walk...</div>
  }

  if (pageError) {
    return (
      <div style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto' }}>
        <h1>Walk</h1>
        <p style={{ color: 'crimson' }}>{pageError}</p>
      </div>
    )
  }

  if (!walk) {
    return (
      <div style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto' }}>
        <h1>Walk</h1>
        <p>Walk not found.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/start-walk')}>Back to start walk</button>
      </div>

      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ marginTop: 0 }}>{walk.dog_name}</h1>
        <p>
          <strong>Walker:</strong> {walk.person_name}
        </p>
        <p>
          <strong>Checked out:</strong> {formatDateTime(walk.checked_out_at)}
        </p>
        <p>
          <strong>Expected return:</strong> {formatDateTime(walk.expected_return_at)}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          {walk.status === 'returned' ? (
            <span>Returned</span>
          ) : walk.overdue ? (
            <span style={{ color: 'crimson', fontWeight: 'bold' }}>Overdue</span>
          ) : (
            <span>Active</span>
          )}
        </p>
        {walk.checkout_notes && (
          <p>
            <strong>Checkout notes:</strong> {walk.checkout_notes}
          </p>
        )}
        {walk.returned_at && (
          <p>
            <strong>Returned at:</strong> {formatDateTime(walk.returned_at)}
          </p>
        )}
        {walk.return_notes && (
          <p>
            <strong>Return notes:</strong> {walk.return_notes}
          </p>
        )}
      </div>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Notes from this walk</h2>

        {notes.length === 0 ? (
          <p>No notes yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {notes.map((note) => (
              <div
                key={note.note_id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: '10px',
                  padding: '0.9rem',
                  background: '#fafafa',
                }}
              >
                <p style={{ margin: '0 0 0.4rem 0' }}>
                  <strong>{capitalize(note.note_type)}</strong>
                </p>
                <p style={{ margin: '0 0 0.4rem 0' }}>{note.content}</p>
                <small>{formatDateTime(note.created_at)}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      {!isReturned && (
        <section style={{ marginBottom: '2rem' }}>
          <h2>Add note</h2>

          <form onSubmit={handleAddNote} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label>Note type</label>
              <br />
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                style={{ width: '100%', padding: '0.6rem' }}
              >
                <option value="general">General</option>
                <option value="behavior">Behavior</option>
                <option value="warning">Warning</option>
                <option value="preference">Preference</option>
                <option value="route">Route</option>
              </select>
            </div>

            <div>
              <label>Comment</label>
              <br />
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '0.6rem' }}
                placeholder="For example: afraid of motorcycles, loves the river, pulls on the leash..."
                required
              />
            </div>

            {noteError && <p style={{ color: 'crimson' }}>{noteError}</p>}

            <button type="submit" disabled={addingNote}>
              {addingNote ? 'Saving note...' : 'Add note'}
            </button>
          </form>
        </section>
      )}

      {!isReturned && (
        <section>
          <h2>Return dog</h2>

          <form onSubmit={handleReturnWalk} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label>Final notes (optional)</label>
              <br />
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '0.6rem' }}
                placeholder="How did the walk go?"
              />
            </div>

            {returnError && <p style={{ color: 'crimson' }}>{returnError}</p>}

            <button type="submit" disabled={returningWalk}>
              {returningWalk ? 'Returning dog...' : 'Return dog'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function capitalize(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}