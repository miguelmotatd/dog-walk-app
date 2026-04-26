import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function DogForm({
  initialValues = {
    name: '',
    status: 'available',
    size: '',
    estimated_birth_year: '',
    notes_summary: '',
    is_active: true,
    image_url: initialValues.image_url ?? '',
  },
  onSubmit,
  submitLabel,
  submittingLabel,
  errorMessage = '',
}) {
  const { t } = useTranslation()

  const [formData, setFormData] = useState({
    name: initialValues.name ?? '',
    status: initialValues.status ?? 'available',
    size: initialValues.size ?? '',
    estimated_birth_year:
      initialValues.estimated_birth_year != null
        ? String(initialValues.estimated_birth_year)
        : '',
    notes_summary: initialValues.notes_summary ?? '',
    is_active: initialValues.is_active ?? true,
  })

  const [submitting, setSubmitting] = useState(false)

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await onSubmit({
        name: formData.name.trim(),
        status: formData.status,
        size: formData.size || null,
        estimated_birth_year: formData.estimated_birth_year
          ? Number(formData.estimated_birth_year)
          : null,
        notes_summary: formData.notes_summary.trim() || null,
        is_active: formData.is_active,
        image_url: formData.image_url.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle}>{t('dogForm.name')}</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>{t('dogForm.imageUrl')}</label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => handleChange('image_url', e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>{t('dogForm.status')}</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            style={inputStyle}
          >
            <option value="available">{t('dog.available')}</option>
            <option value="out_on_walk">{t('dog.out_on_walk')}</option>
            <option value="unavailable">{t('dog.unavailable')}</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>{t('dogForm.size')}</label>
          <select
            value={formData.size}
            onChange={(e) => handleChange('size', e.target.value)}
            style={inputStyle}
          >
            <option value="">{t('dogForm.noSize')}</option>
            <option value="small">{t('dogsFilter.small')}</option>
            <option value="medium">{t('dogsFilter.medium')}</option>
            <option value="large">{t('dogsFilter.large')}</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>{t('dogForm.estimatedBirthYear')}</label>
          <input
            type="number"
            value={formData.estimated_birth_year}
            onChange={(e) => handleChange('estimated_birth_year', e.target.value)}
            min="1990"
            max={new Date().getFullYear()}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>{t('dogForm.summary')}</label>
        <textarea
          value={formData.notes_summary}
          onChange={(e) => handleChange('notes_summary', e.target.value)}
          rows={4}
          style={textareaStyle}
        />
      </div>

      <label style={checkboxRowStyle}>
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => handleChange('is_active', e.target.checked)}
        />
        <span>{t('dogForm.active')}</span>
      </label>

      {errorMessage && <p style={errorStyle}>{errorMessage}</p>}

      <button
        type="submit"
        disabled={submitting}
        style={{
          ...primaryButtonStyle,
          opacity: submitting ? 0.7 : 1,
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  )
}

const formStyle = {
  display: 'grid',
  gap: '1rem',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem',
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: 600,
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ccc',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}

const textareaStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ccc',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  resize: 'vertical',
}

const checkboxRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
}

const primaryButtonStyle = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '0.8rem 1rem',
  borderRadius: '10px',
  fontSize: '1rem',
}

const errorStyle = {
  color: 'crimson',
}