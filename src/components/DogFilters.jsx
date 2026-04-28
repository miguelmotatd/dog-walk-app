import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function DogFilters({ filters, onChange }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const activeFilterCount = useMemo(() => {
    let count = 0

    if (filters.searchText?.trim()) count += 1
    if (filters.sex && filters.sex !== 'all') count += 1
    if (filters.size && filters.size !== 'all') count += 1
    if (filters.ageRange && filters.ageRange !== 'all') count += 1

    return count
  }, [filters])

  const resetFilters = () => {
    onChange('searchText', '')
    onChange('sex', 'all')
    onChange('size', 'all')
    onChange('ageRange', 'all')
  }

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={toggleButtonStyle}
      >
        <span>
          {t('dogsFilter.filters', 'Filters')}
          {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={panelStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>{t('dogsFilter.name', 'Name')}</label>
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => onChange('searchText', e.target.value)}
              placeholder={t('dogsFilter.searchPlaceholder')}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t('dogsFilter.sex', 'Sex')}</label>
            <select
              value={filters.sex}
              onChange={(e) => onChange('sex', e.target.value)}
              style={selectStyle}
            >
              <option value="all">{t('dogsFilter.allSexes')}</option>
              <option value="male">{t('dogsFilter.male')}</option>
              <option value="female">{t('dogsFilter.female')}</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t('dogsFilter.size', 'Size')}</label>
            <select
              value={filters.size}
              onChange={(e) => onChange('size', e.target.value)}
              style={selectStyle}
            >
              <option value="all">{t('dogsFilter.allSizes')}</option>
              <option value="small">{t('dogsFilter.small')}</option>
              <option value="medium">{t('dogsFilter.medium')}</option>
              <option value="large">{t('dogsFilter.large')}</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t('dogsFilter.age', 'Age')}</label>
            <select
              value={filters.ageRange}
              onChange={(e) => onChange('ageRange', e.target.value)}
              style={selectStyle}
            >
              <option value="all">{t('dogsFilter.allAges')}</option>
              <option value="under_1">{t('dogsFilter.under1')}</option>
              <option value="1_3">{t('dogsFilter.between1And3')}</option>
              <option value="4_7">{t('dogsFilter.between4And7')}</option>
              <option value="8_plus">{t('dogsFilter.over8')}</option>
            </select>
          </div>

          {activeFilterCount > 0 && (
            <button type="button" onClick={resetFilters} style={clearButtonStyle}>
              {t('dogsFilter.clear', 'Clear filters')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const containerStyle = {
  marginBottom: '1rem',
}

const toggleButtonStyle = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.85rem 1rem',
  border: '1px solid #e4d8c8',
  borderRadius: '14px',
  background: '#fff8ef',
  color: '#6f451f',
  fontWeight: 700,
  cursor: 'pointer',
}

const panelStyle = {
  marginTop: '0.75rem',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '0.75rem',
  padding: '1rem',
  border: '1px solid #e4d8c8',
  borderRadius: '14px',
  background: '#fff',
}

const fieldStyle = {
  minWidth: 0,
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.35rem',
  fontSize: '0.9rem',
  fontWeight: 700,
  color: '#6f451f',
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d6c8b8',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}

const selectStyle = {
  ...inputStyle,
  background: '#fff',
}

const clearButtonStyle = {
  padding: '0.75rem 1rem',
  border: '1px solid #d6c8b8',
  borderRadius: '999px',
  background: '#f7f3ec',
  color: '#6f451f',
  fontWeight: 700,
  cursor: 'pointer',
}