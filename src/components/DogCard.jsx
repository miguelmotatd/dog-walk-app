import { useTranslation } from 'react-i18next'

export default function DogCard({ dog, onClick, action, selected = false }) {
  const { t, i18n } = useTranslation()
  const isUnavailable = dog.status === 'unavailable'

  return (
    <div
      onClick={onClick}
      style={cardStyle({ selected, onClick, isUnavailable })}
    >
      <div style={imageWrapperStyle}>
        {dog.image_url ? (
          <img src={dog.image_url} alt={dog.name} style={imageStyle(isUnavailable)} />
        ) : (
          <div style={placeholderStyle(isUnavailable)}>🐶</div>
        )}

        {isUnavailable && (
          <div style={unavailableOverlayStyle}>⛔ {t('dog.unavailable')}</div>
        )}

        <div style={statusBadgeStyle(dog.status)}>
          {t(`dog.${dog.status}`)}
        </div>
      </div>

      <div style={contentStyle}>
        <h3 style={nameStyle}>{dog.name}</h3>

        <div style={metaGridStyle}>
          {dog.sex && (
            <InfoItem label={t('dog.sex')} value={t(`dog.${dog.sex}`)} />
          )}

          {dog.size && (
            <InfoItem label={t('dog.size')} value={dog.size} />
          )}

          {dog.age != null && (
            <InfoItem
              label={t('dog.age')}
              value={formatAge(dog.age, i18n.language)}
            />
          )}
        </div>

        {dog.notes_summary && (
          <p style={summaryStyle}>{dog.notes_summary}</p>
        )}

        {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
      </div>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  )
}

const imageWrapperStyle = {
  position: 'relative',
  width: '100%',
  aspectRatio: '4 / 3',
  background: '#f7f3ec',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid #eee',
}

const imageStyle = (isUnavailable) => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center 40%',
  display: 'block',
  filter: isUnavailable ? 'grayscale(85%) saturate(40%)' : 'none',
})

const placeholderStyle = (isUnavailable) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '3.25rem',
  color: isUnavailable ? '#6b7280' : '#8a5a2b',
  background: isUnavailable ? '#f3f4f6' : '#f7f3ec',
})

const unavailableOverlayStyle = {
  position: 'absolute',
  left: '0.75rem',
  bottom: '0.75rem',
  padding: '0.28rem 0.55rem',
  borderRadius: '8px',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#991b1b',
  background: 'rgba(255, 255, 255, 0.92)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
}

const contentStyle = {
  padding: '1rem',
}

const nameStyle = {
  margin: '0 0 0.85rem 0',
  color: '#6f451f',
  fontSize: '1.25rem',
}

const metaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
  gap: '0.75rem',
}

const infoLabelStyle = {
  fontSize: '0.78rem',
  color: '#777',
  marginBottom: '0.15rem',
}

const infoValueStyle = {
  fontWeight: 700,
  color: '#2f2f2f',
}

const summaryStyle = {
  margin: '0.9rem 0 0 0',
  color: '#555',
  lineHeight: 1.4,
}

function cardStyle({ selected, onClick, isUnavailable }) {
  return {
    border: isUnavailable
      ? '2px dashed #9ca3af'
      : selected
        ? '2px solid #8a5a2b'
        : '1px solid #e4d8c8',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    background: isUnavailable
      ? 'linear-gradient(180deg, #fafafa 0%, #f3f4f6 100%)'
      : selected
        ? '#fff8ef'
        : '#fff',
    boxShadow: selected
      ? '0 0 0 4px rgba(138, 90, 43, 0.12)'
      : '0 4px 14px rgba(0,0,0,0.08)',
    transition: 'all 0.15s ease',
  }
}

function statusBadgeStyle(status) {
  const base = {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    padding: '0.35rem 0.65rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.92)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  }

  if (status === 'available') {
    return { ...base, color: '#166534' }
  }

  if (status === 'out_on_walk') {
    return { ...base, color: '#b45309' }
  }

  if (status === 'unavailable') {
    return { ...base, color: '#6b7280' }
  }

  return base
}

function formatAge(age, language = 'en') {
  if (language === 'pt') {
    return age === 1 ? '1 ano' : `${age} anos`
  }

  return age === 1 ? '1 year' : `${age} years`
}