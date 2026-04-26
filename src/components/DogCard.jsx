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
        borderRadius: '14px',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        background: selected ? '#eff6ff' : '#fff',
        boxShadow: selected
          ? '0 0 0 3px rgba(37,99,235,0.08)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={imageWrapperStyle}>
        {dog.image_url ? (
          <img
            src={dog.image_url}
            alt={dog.name}
            style={imageStyle}
          />
        ) : (
          <div style={placeholderStyle}>🐶</div>
        )}
      </div>

      <div style={{ padding: '1rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>
          {dog.name}
        </h3>

        <p style={rowStyle}>
          <strong>{t('dog.status')}:</strong>{' '}
          <span style={getStatusStyle(dog.status)}>
            {t(`dog.${dog.status}`)}
          </span>
        </p>

        {dog.size && (
          <p style={rowStyle}>
            <strong>{t('dog.size')}:</strong> {dog.size}
          </p>
        )}

        {dog.age != null && (
          <p style={rowStyle}>
            <strong>{t('dog.age')}:</strong>{' '}
            {formatAge(dog.age, i18n.language)}
          </p>
        )}

        {dog.notes_summary && (
          <p style={rowStyle}>
            <strong>{t('dog.summary')}:</strong> {dog.notes_summary}
          </p>
        )}

        {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
      </div>
    </div>
  )
}

const imageWrapperStyle = {
  width: '100%',
  height: '220px',
  background: '#f3f4f6',
}

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const placeholderStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '3rem',
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
  if (language === 'pt') {
    return age === 1 ? '1 ano' : `${age} anos`
  }

  return age === 1 ? '1 year' : `${age} years`
}