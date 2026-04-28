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

  const switchMode = (mode) => {
    setShowReset(mode === 'reset')
    setErrorMessage('')
    setInfoMessage('')
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={topBarStyle}>
          <img
            src="https://azlfa.com/wp-content/uploads/2020/03/logo_cor-1.png"
            alt="AZL Logo"
            style={logoStyle}
          />
          <LanguageSwitcher />
        </div>

        <div style={introStyle}>
          <h1 style={titleStyle}>
            {showReset ? t('login.forgotPassword') : t('login.title')}
          </h1>
          <p style={subtitleStyle}>
            {showReset
              ? t(
                  'login.resetSubtitle',
                  'Enter your email and we will send you a password reset link.'
                )
              : t(
                  'login.subtitle',
                  'Access the volunteer dashboard to manage walks and dogs.'
                )}
          </p>
        </div>

        {!showReset ? (
          <form onSubmit={handleLogin} style={formStyle}>
            <div>
              <label style={labelStyle}>{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                autoComplete="current-password"
                required
              />
            </div>

            {errorMessage && <div style={errorBoxStyle}>{errorMessage}</div>}
            {infoMessage && <div style={successBoxStyle}>{infoMessage}</div>}

            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? t('login.loggingIn') : t('login.login')}
            </button>

            <button
              type="button"
              onClick={() => switchMode('reset')}
              style={linkButtonStyle}
            >
              {t('login.forgotPassword')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={formStyle}>
            <div>
              <label style={labelStyle}>{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                autoComplete="email"
                required
              />
            </div>

            {errorMessage && <div style={errorBoxStyle}>{errorMessage}</div>}
            {infoMessage && <div style={successBoxStyle}>{infoMessage}</div>}

            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? t('login.sending') : t('login.sendResetEmail')}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              style={linkButtonStyle}
            >
              {t('login.backToLogin')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  padding: '2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f7f3ec',
  boxSizing: 'border-box',
}

const cardStyle = {
  width: '100%',
  maxWidth: '460px',
  background: '#fff',
  border: '1px solid #e4d8c8',
  borderRadius: '22px',
  padding: '1.5rem',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1.5rem',
}

const logoStyle = {
  width: '82px',
  height: '82px',
  objectFit: 'contain',
}

const introStyle = {
  marginBottom: '1.5rem',
}

const titleStyle = {
  margin: 0,
  color: '#6f451f',
  fontSize: '1.75rem',
}

const subtitleStyle = {
  margin: '0.5rem 0 0 0',
  color: '#6b6b6b',
  lineHeight: 1.45,
}

const formStyle = {
  display: 'grid',
  gap: '1rem',
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: 700,
  color: '#2f2f2f',
}

const inputStyle = {
  width: '100%',
  padding: '0.85rem',
  border: '1px solid #d6c8b8',
  borderRadius: '12px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  background: '#fff',
}

const primaryButtonStyle = {
  width: '100%',
  background: '#8a5a2b',
  color: '#fff',
  border: 'none',
  padding: '0.9rem 1rem',
  borderRadius: '999px',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
}

const linkButtonStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#6f451f',
  cursor: 'pointer',
  textDecoration: 'underline',
  fontWeight: 700,
  justifySelf: 'center',
}

const errorBoxStyle = {
  padding: '0.8rem',
  borderRadius: '12px',
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fca5a5',
}

const successBoxStyle = {
  padding: '0.8rem',
  borderRadius: '12px',
  background: '#dcfce7',
  color: '#166534',
  border: '1px solid #86efac',
}