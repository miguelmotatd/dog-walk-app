import { useTranslation } from 'react-i18next'

export default function DogCard({
  dog,
  onClick,
  action,
  selected = false,
}) {
  const { t, i18n } = useTranslation()

  return (
    <div
      onClick={onClick}
      style={{
        border: selected ? '2px solid #2563eb' : '1px solid #ddd',
        borderRadius: '12px',
        padding: '1rem',
        cursor: onClick ? 'pointer' : 'default',
        background: selected ? '#eff6ff' : '#fff',
        boxShadow: selected
          ? '0 0 0 3px rgba(37, 99, 235, 0.08)'
          : '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>{dog.name}</h3>

      <p style={rowStyle}>
        <strong>{t('dog.status')}:</strong>{' '}
        <span style={getStatusStyle(dog.status)}>{t(`dog.${dog.status}`)}</span>
      </p>

      {dog.size && (
        <p style={rowStyle}>
          <strong>{t('dog.size')}:</strong> {dog.size}
        </p>
      )}

      {dog.age != null && (
        <p style={rowStyle}>
          <strong>{t('dog.age')}:</strong> {formatAge(dog.age, i18n.language)}
        </p>
      )}

      {dog.notes_summary && (
        <p style={rowStyle}>
          <strong>{t('dog.summary')}:</strong> {dog.notes_summary}
        </p>
      )}

      {action && <div style={{ marginTop: '0.9rem' }}>{action}</div>}
    </div>
  )
}

const rowStyle = {
  margin: '0.35rem 0',
}

function getStatusStyle(status) {
  if (status === 'available') return { color: '#166534', fontWeight: 700 }
  if (status === 'out_on_walk') return { color: '#b45309', fontWeight: 700 }
  if (status === 'unavailable') return { color: '#6b7280', fontWeight: 700 }
  return {}
}

function formatAge(age, language = 'en') {
  if (age == null) return '-'

  if (language === 'pt') {
    return age === 1 ? '1 ano' : `${age} anos`
  }

  return age === 1 ? '1 year' : `${age} years`
}