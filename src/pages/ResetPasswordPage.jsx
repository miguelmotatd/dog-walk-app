import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
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
      setErrorMessage(t('resetPassword.passwordsDoNotMatch'))
      return
    }

    if (password.length < 6) {
      setErrorMessage(t('resetPassword.passwordTooShort'))
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setInfoMessage(t('resetPassword.updated'))

    setTimeout(() => {
      navigate('/login')
    }, 1500)

    setLoading(false)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '420px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1>{t('resetPassword.title')}</h1>
        <LanguageSwitcher />
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>{t('resetPassword.newPassword')}</label>
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
          <label>{t('resetPassword.confirmPassword')}</label>
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
          {loading ? t('resetPassword.updating') : t('resetPassword.updatePassword')}
        </button>
      </form>
    </div>
  )
}