import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function StartWalkPage() {
  const [dogs, setDogs] = useState([])
  const [loadingDogs, setLoadingDogs] = useState(true)
  const [dogsError, setDogsError] = useState('')

  const [dogId, setDogId] = useState('')
  const [personName, setPersonName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [expectedReturnAt, setExpectedReturnAt] = useState(getDefaultReturnTime())

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    loadAvailableDogs()
  }, [])

  const selectedDog = useMemo(
    () => dogs.find((dog) => String(dog.id) === String(dogId)),
    [dogs, dogId]
  )

  const loadAvailableDogs = async () => {
    setLoadingDogs(true)
    setDogsError('')

    const { data, error } = await supabase
      .from('dogs')
      .select('id, name, status, size, age_text, notes_summary')
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

    if (walk) {
      if (walk?.person_public_token) {
        localStorage.setItem('person_public_token', walk.person_public_token)
      }
      navigate(`/walk/${walk.walk_id}?token=${walk.public_token}`)
      return
    }

    setDogId('')
    setPersonName('')
    setPhone('')
    setEmail('')
    setCheckoutNotes('')
    setExpectedReturnAt(getDefaultReturnTime())

    await loadAvailableDogs()
    setSubmitting(false)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto' }}>
      <h1>Start Walk</h1>
      <p>Register a dog walk before leaving the shelter.</p>

      {loadingDogs && <p>Loading available dogs...</p>}
      {dogsError && <p style={{ color: 'crimson' }}>{dogsError}</p>}

      {!loadingDogs && !dogsError && dogs.length === 0 && (
        <p>No dogs are currently available for walking.</p>
      )}

      {!loadingDogs && !dogsError && dogs.length > 0 && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label>Dog</label>
            <br />
            <select
              value={dogId}
              onChange={(e) => setDogId(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem' }}
            >
              <option value="">Select a dog</option>
              {dogs.map((dog) => (
                <option key={dog.id} value={dog.id}>
                  {dog.name}
                </option>
              ))}
            </select>
          </div>

          {selectedDog && (
            <div
              style={{
                border: '1px solid #ddd',
                borderRadius: '10px',
                padding: '1rem',
                background: '#fafafa',
              }}
            >
              <h3 style={{ marginTop: 0 }}>{selectedDog.name}</h3>
              {selectedDog.size && (
                <p>
                  <strong>Size:</strong> {selectedDog.size}
                </p>
              )}
              {selectedDog.age_text && (
                <p>
                  <strong>Age:</strong> {selectedDog.age_text}
                </p>
              )}
              {selectedDog.notes_summary && (
                <p>
                  <strong>Summary:</strong> {selectedDog.notes_summary}
                </p>
              )}
            </div>
          )}

          <div>
            <label>Your name</label>
            <br />
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem' }}
            />
          </div>

          <div>
            <label>Phone number</label>
            <br />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem' }}
            />
          </div>

          <div>
            <label>Email (optional)</label>
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.6rem' }}
            />
          </div>

          <div>
            <label>Expected return time</label>
            <br />
            <input
              type="datetime-local"
              value={expectedReturnAt}
              onChange={(e) => setExpectedReturnAt(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem' }}
            />
          </div>

          <div>
            <label>Checkout notes (optional)</label>
            <br />
            <textarea
              value={checkoutNotes}
              onChange={(e) => setCheckoutNotes(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '0.6rem' }}
              placeholder="Anything useful before leaving..."
            />
          </div>

          {submitError && <p style={{ color: 'crimson' }}>{submitError}</p>}

          <button type="submit" disabled={submitting || !dogId}>
            {submitting ? 'Starting walk...' : 'Start walk'}
          </button>
        </form>
      )}
    </div>
  )
}

function getDefaultReturnTime() {
  const date = new Date()
  date.setHours(date.getHours() + 1)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}