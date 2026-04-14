import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import DogCard from '../components/DogCard'

export default function DashboardPage() {
  const [dogs, setDogs] = useState([])
  const [activeWalks, setActiveWalks] = useState([])
  const [loadingDogs, setLoadingDogs] = useState(true)
  const [loadingWalks, setLoadingWalks] = useState(true)
  const [errorDogs, setErrorDogs] = useState('')
  const [errorWalks, setErrorWalks] = useState('')

  useEffect(() => {
    loadDogs()
    loadActiveWalks()
  }, [])

  const loadDogs = async () => {
    setLoadingDogs(true)
    setErrorDogs('')

    const { data, error } = await supabase
      .from('dogs')
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

  const handleReturnWalk = async (walk) => {
    const confirm = window.confirm(
      `Return ${walk.dog_name}?`
    )

    if (!confirm) return

    const { error } = await supabase.rpc('return_walk', {
      p_walk_id: walk.walk_id,
      p_public_token: walk.public_token,
      p_return_notes: 'Returned by volunteer'
    })

    if (error) {
      alert(error.message)
      return
    }

    // refresh data
    await loadActiveWalks()
    await loadDogs()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1>Volunteer Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Active Walks</h2>

        {loadingWalks && <p>Loading active walks...</p>}
        {errorWalks && <p style={{ color: 'crimson' }}>{errorWalks}</p>}

        {!loadingWalks && !errorWalks && activeWalks.length === 0 && (
          <p>No dogs are currently out on a walk.</p>
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
                  <th style={thStyle}>Dog</th>
                  <th style={thStyle}>Walker</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Checked out</th>
                  <th style={thStyle}>Expected return</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
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
                      {formatDateTime(walk.checked_out_at)}
                    </td>
                    <td style={tdStyle}>
                      {formatDateTime(walk.expected_return_at)}
                    </td>
                    <td style={tdStyle}>
                      {walk.overdue ? (
                        <span style={{ color: 'crimson', fontWeight: 'bold' }}>
                          Overdue
                        </span>
                      ) : (
                        <span>Active</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleReturnWalk(walk)}
                        style={{
                          background: '#ff4d4f',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 0.8rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Return Dog
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
        <h2>Dogs</h2>

        {loadingDogs && <p>Loading dogs...</p>}
        {errorDogs && <p style={{ color: 'crimson' }}>{errorDogs}</p>}

        {!loadingDogs && !errorDogs && dogs.length === 0 && (
          <p>No dogs found.</p>
        )}

        {!loadingDogs && !errorDogs && dogs.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            {dogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString()
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