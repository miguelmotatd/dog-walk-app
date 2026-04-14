import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [showReset, setShowReset] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setInfoMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage(error.message)
    }

    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setInfoMessage('')

    const redirectTo =
      window.location.hostname === 'localhost'
        ? 'http://localhost:5173/reset-password'
        : `${window.location.origin}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setInfoMessage('Password reset email sent. Please check your inbox.')
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '420px', margin: '0 auto' }}>
      <h1>Volunteer Login</h1>

      {!showReset ? (
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Password</label>
            <br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
              required
            />
          </div>

          {errorMessage && <p style={{ color: 'crimson' }}>{errorMessage}</p>}
          {infoMessage && <p style={{ color: 'green' }}>{infoMessage}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                setShowReset(true)
                setErrorMessage('')
                setInfoMessage('')
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#0066cc',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Forgot password?
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
              required
            />
          </div>

          {errorMessage && <p style={{ color: 'crimson' }}>{errorMessage}</p>}
          {infoMessage && <p style={{ color: 'green' }}>{infoMessage}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset email'}
          </button>

          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                setShowReset(false)
                setErrorMessage('')
                setInfoMessage('')
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#0066cc',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Back to login
            </button>
          </div>
        </form>
      )}
    </div>
  )
}