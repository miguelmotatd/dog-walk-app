import { useState } from 'react'
import { uploadDogImage } from '../utils/uploadDogImage'
import { useTranslation } from 'react-i18next'

export default function DogForm({
  initialValues = {
    name: '',
    status: 'available',
    size: '',
    estimated_birth_year: '',
    notes_summary: '',
    is_active: true,
    image_url: '',
    image_file: null,
    sex: '',
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
    image_url: initialValues.image_url ?? '',
    image_file: null,
    sex: initialValues.sex ?? '',
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
      let imageUrl = formData.image_url || null

      if (formData.image_file) {
        imageUrl = await uploadDogImage(formData.image_file, formData.name)
      }

      await onSubmit({
        name: formData.name.trim(),
        status: formData.status,
        size: formData.size || null,
        estimated_birth_year: formData.estimated_birth_year
          ? Number(formData.estimated_birth_year)
          : null,
        image_url: imageUrl,
        notes_summary: formData.notes_summary.trim() || null,
        is_active: formData.is_active,
        sex: formData.sex || null,
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
          <label style={labelStyle}>{t('dogForm.photo')}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleChange('image_file', e.target.files?.[0] || null)}
            style={inputStyle}
          />

          {formData.image_url && (
            <div style={{ marginTop: '0.75rem' }}>
              <img
                src={formData.image_url}
                alt={formData.name || 'Dog'}
                style={{
                  width: '180px',
                  height: '135px',
                  objectFit: 'cover',
                  borderRadius: '14px',
                  border: '1px solid #e4d8c8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
            </div>
          )}
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
          <label style={labelStyle}>{t('dogForm.sex')}</label>
          <select
            value={formData.sex}
            onChange={(e) => handleChange('sex', e.target.value)}
            style={inputStyle}
          >
            <option value="">{t('dogForm.noSex')}</option>
            <option value="male">{t('dog.male')}</option>
            <option value="female">{t('dog.female')}</option>
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
            <option value="Pequeno">{t('dogsFilter.small')}</option>
            <option value="Médio">{t('dogsFilter.medium')}</option>
            <option value="Grande">{t('dogsFilter.large')}</option>
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
  gap: '1.25rem',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
  padding: '0.8rem',
  border: '1px solid #d6c8b8',
  borderRadius: '12px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  background: '#fff',
}

const textareaStyle = {
  width: '100%',
  padding: '0.8rem',
  border: '1px solid #d6c8b8',
  borderRadius: '12px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  resize: 'vertical',
  background: '#fff',
}

const checkboxRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.85rem 1rem',
  border: '1px solid #e4d8c8',
  borderRadius: '14px',
  background: '#fff8ef',
  color: '#6f451f',
  fontWeight: 700,
}

const primaryButtonStyle = {
  background: '#8a5a2b',
  color: '#fff',
  border: 'none',
  padding: '0.9rem 1.2rem',
  borderRadius: '999px',
  fontSize: '1rem',
  fontWeight: 700,
}

const errorStyle = {
  padding: '0.8rem',
  borderRadius: '12px',
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fca5a5',
}