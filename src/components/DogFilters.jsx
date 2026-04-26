import { useTranslation } from 'react-i18next'

export default function DogFilters({ filters, onChange }) {
  const { t } = useTranslation()

  return (
    <div style={wrapperStyle}>
      <input
        type="text"
        value={filters.searchText}
        onChange={(e) => onChange('searchText', e.target.value)}
        placeholder={t('dogsFilter.searchPlaceholder')}
        style={inputStyle}
      />

      <select
        value={filters.sex}
        onChange={(e) => onChange('sex', e.target.value)}
        style={selectStyle}
      >
        <option value="all">{t('dogsFilter.allSexes')}</option>
        <option value="male">{t('dogsFilter.male')}</option>
        <option value="female">{t('dogsFilter.female')}</option>
      </select>

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
  )
}

const wrapperStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr',
  gap: '0.75rem',
  marginBottom: '1rem',
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ccc',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}

const selectStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ccc',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}