import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function LoginPage() {
  const { t } = useTranslation()
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

    if (error) setErrorMessage(error.message)
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
      setInfoMessage(t('login.resetEmailSent'))
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '420px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1>{t('login.title')}</h1>
        <LanguageSwitcher />
      </div>

      {!showReset ? (
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label>{t('login.email')}</label>
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
            <label>{t('login.password')}</label>
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
            {loading ? t('login.loggingIn') : t('login.login')}
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
              {t('login.forgotPassword')}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: '1rem' }}>
            <label>{t('login.email')}</label>
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
            {loading ? t('login.sending') : t('login.sendResetEmail')}
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
              {t('login.backToLogin')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}