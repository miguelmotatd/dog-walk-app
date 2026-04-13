import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MyWalksPanel({
  personPublicToken,
  title = 'My active walks',
  emptyMessage = 'You do not have any active walks right now.',
}) {
  const [walks, setWalks] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!personPublicToken) {
        setWalks([])
        setLoading(false)
        setErrorMessage('')
        return
        }

    loadWalks()
  }, [personPublicToken])

  const loadWalks = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase.rpc('public_get_my_active_walks', {
      p_person_public_token: personPublicToken,
    })

    if (error) {
      setWalks([])
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setWalks(data || [])
    setLoading(false)
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button onClick={loadWalks} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading && <p>Loading walks...</p>}

      {!loading && errorMessage && (
        <p style={{ color: 'crimson' }}>{errorMessage}</p>
      )}

      {!loading && !errorMessage && !personPublicToken && (
        <p>Start a walk first to see it here.</p>
    )}

      {!loading && !errorMessage && walks.length === 0 && (
        <p>{emptyMessage}</p>
      )}

      {!loading && !errorMessage && walks.length > 0 && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {walks.map((walk) => (
            <div
              key={walk.walk_id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '12px',
                padding: '1rem',
                background: '#fff',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>
                {walk.dog_name}
              </h3>

              <p>
                <strong>Checked out:</strong> {formatDateTime(walk.checked_out_at)}
              </p>

              <p>
                <strong>Expected return:</strong>{' '}
                {formatDateTime(walk.expected_return_at)}
              </p>

              <p>
                <strong>Status:</strong>{' '}
                {walk.overdue ? (
                  <span style={{ color: 'crimson', fontWeight: 'bold' }}>
                    Overdue
                  </span>
                ) : (
                  walk.status
                )}
              </p>

              <Link to={`/walk/${walk.walk_id}?token=${walk.public_token}`}>
                Open walk
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}