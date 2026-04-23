import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const handleChange = (language) => {
    i18n.changeLanguage(language)
    localStorage.setItem('language', language)
  }

  return (
    <select
      value={i18n.language}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        padding: '0.55rem 0.75rem',
        borderRadius: '10px',
        border: '1px solid #d1d5db',
        background: '#fff',
        fontSize: '0.95rem',
      }}
      aria-label="Language"
    >
      <option value="en">{t('language.english')}</option>
      <option value="pt">{t('language.portuguese')}</option>
    </select>
  )
}