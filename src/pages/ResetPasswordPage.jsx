import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must have at least 6 characters.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setInfoMessage('Password updated successfully. Redirecting to login...')

    setTimeout(() => {
      navigate('/login')
    }, 1500)

    setLoading(false)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '420px', margin: '0 auto' }}>
      <h1>Reset password</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>New password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Confirm new password</label>
          <br />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
            required
          />
        </div>

        {errorMessage && <p style={{ color: 'crimson' }}>{errorMessage}</p>}
        {infoMessage && <p style={{ color: 'green' }}>{infoMessage}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  )
}