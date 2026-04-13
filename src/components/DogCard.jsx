export default function DogCard({
  dog,
  onClick,
  action,
  selectable = false,
  selected = false,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        border: selected ? '2px solid #4CAF50' : '1px solid #ddd',
        borderRadius: '12px',
        padding: '1rem',
        cursor: onClick ? 'pointer' : 'default',
        background: selected ? '#f4fff4' : '#fff',
        transition: 'all 0.2s ease',
      }}
    >
      <h3 style={{ marginTop: 0 }}>{dog.name}</h3>

      <p>
        <strong>Status:</strong> {formatStatus(dog.status)}
      </p>

      {dog.size && (
        <p>
          <strong>Size:</strong> {dog.size}
        </p>
      )}

      {dog.age_text && (
        <p>
          <strong>Age:</strong> {dog.age_text}
        </p>
      )}

      {dog.notes_summary && (
        <p>
          <strong>Summary:</strong> {dog.notes_summary}
        </p>
      )}

      {action && (
        <div style={{ marginTop: '0.75rem' }}>
          {action}
        </div>
      )}
    </div>
  )
}

function formatStatus(status) {
  if (!status) return ''

  if (status === 'available') return 'Available'
  if (status === 'out_on_walk') return 'Out on walk'
  if (status === 'unavailable') return 'Unavailable'

  return status
}