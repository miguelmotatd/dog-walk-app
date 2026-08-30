import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

const ACTIVE_STATUSES = ['reserved', 'checked_in']

export default function CaminhadaChecklistPage() {
  const { t } = useTranslation()
  const { caminhadaId } = useParams()

  const [caminhada, setCaminhada] = useState(null)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    loadAll()
  }, [caminhadaId])

  const loadAll = async () => {
    setLoading(true)
    setError('')

    const [caminhadaRes, reservationsRes] = await Promise.all([
      supabase.from('caominhadas').select('*').eq('id', caminhadaId).single(),
      supabase
        .from('caominhada_reservations')
        .select(
          'id, participant_count, payment_status, reservation_status, souvenir_delivered, people(id,name,phone), caominhada_dogs(id,status,dog_id,dogs(id,name,image_url))'
        )
        .eq('caominhada_id', caminhadaId)
        .in('reservation_status', ACTIVE_STATUSES),
    ])

    if (caminhadaRes.error) {
      setError(caminhadaRes.error.message)
      setLoading(false)
      return
    }

    const rows = (reservationsRes.data || []).sort((a, b) => {
      const nameA = a.caominhada_dogs?.dogs?.name || ''
      const nameB = b.caominhada_dogs?.dogs?.name || ''
      return nameA.localeCompare(nameB)
    })

    setCaminhada(caminhadaRes.data)
    setReservations(rows)
    setLoading(false)
  }

  const handleMarkPaid = async (reservationId) => {
    setActionError('')

    const { error } = await supabase
      .from('caominhada_reservations')
      .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', reservationId)

    if (error) {
      setActionError(error.message)
      return
    }

    await loadAll()
  }

  const handleToggleSouvenir = async (reservationId, delivered) => {
    setActionError('')

    const { error } = await supabase
      .from('caominhada_reservations')
      .update({
        souvenir_delivered: delivered,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)

    if (error) {
      setActionError(error.message)
      return
    }

    await loadAll()
  }

  const handleCheckIn = async (reservationId) => {
    setActionError('')

    const { error } = await supabase.rpc('set_caominhada_reservation_status', {
      p_reservation_id: reservationId,
      p_new_status: 'checked_in',
    })

    if (error) {
      setActionError(error.message)
      return
    }

    const { error: paymentError } = await supabase
      .from('caominhada_reservations')
      .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', reservationId)

    if (paymentError) {
      setActionError(paymentError.message)
      return
    }

    await loadAll()
  }

  const handleMarkWalked = async (caminhadaDogId) => {
    setActionError('')

    const { error } = await supabase
      .from('caominhada_dogs')
      .update({ status: 'walked', updated_at: new Date().toISOString() })
      .eq('id', caminhadaDogId)

    if (error) {
      setActionError(error.message)
      return
    }

    await loadAll()
  }

  if (loading) {
    return <div style={pageStyle}>{t('common.loading')}</div>
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <p style={errorStyle}>{error}</p>
      </div>
    )
  }

  const checkedInCount = reservations.filter(
    (r) => r.reservation_status === 'checked_in'
  ).length
  const pendingPaymentsCount = reservations.filter(
    (r) => r.payment_status === 'pending'
  ).length

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{t('caminhadaChecklist.title')}</h1>
          <p style={subtitleStyle}>{caminhada?.title}</p>
          <Link to={`/caminhadas/${caminhadaId}`} style={backLinkStyle}>
            {t('common.back')}
          </Link>
        </div>
        <LanguageSwitcher />
      </header>

      {actionError && <p style={errorStyle}>{actionError}</p>}

      <div style={summaryRowStyle}>
        <SummaryStat
          label={t('caminhadaChecklist.totalReserved')}
          value={reservations.length}
        />
        <SummaryStat
          label={t('caminhadaChecklist.checkedInCount')}
          value={checkedInCount}
        />
        <SummaryStat
          label={t('caminhadaChecklist.pendingPayments')}
          value={pendingPaymentsCount}
          warn={pendingPaymentsCount > 0}
        />
      </div>

      {reservations.length === 0 ? (
        <div style={emptyStateStyle}>{t('caminhadaChecklist.empty')}</div>
      ) : (
        <div style={cardListStyle}>
          {reservations.map((reservation) => {
            const dog = reservation.caominhada_dogs?.dogs
            const isCheckedIn = reservation.reservation_status === 'checked_in'
            const isWalked = reservation.caominhada_dogs?.status === 'walked'

            return (
              <div key={reservation.id} style={checklistCardStyle}>
                <div style={checklistHeaderStyle}>
                  <div style={dogImageWrapperStyle}>
                    {dog?.image_url ? (
                      <img src={dog.image_url} alt={dog.name} style={dogImageStyle} />
                    ) : (
                      <div style={dogPlaceholderStyle}>🐶</div>
                    )}
                  </div>

                  <div>
                    <strong style={dogNameStyle}>{dog?.name}</strong>
                    <div style={walkerStyle}>{reservation.people?.name}</div>
                    <a href={`tel:${reservation.people?.phone}`} style={phoneLinkStyle}>
                      {reservation.people?.phone}
                    </a>
                  </div>
                </div>

                <div style={metaRowStyle}>
                  <span style={metaBadgeStyle}>
                    {t('caminhadaManage.participantCount')}: {reservation.participant_count}
                  </span>
                  <span
                    style={
                      reservation.payment_status === 'pending'
                        ? pendingBadgeStyle
                        : paidBadgeStyle
                    }
                  >
                    {t(`caminhada.paymentStatus.${reservation.payment_status}`)}
                  </span>
                </div>

                <label style={checkboxRowStyle}>
                  <input
                    type="checkbox"
                    checked={reservation.souvenir_delivered}
                    onChange={(e) =>
                      handleToggleSouvenir(reservation.id, e.target.checked)
                    }
                  />
                  {t('caminhadaManage.souvenirDelivered')}
                </label>

                <div style={actionsRowStyle}>
                  {reservation.payment_status === 'pending' && (
                    <button
                      onClick={() => handleMarkPaid(reservation.id)}
                      style={secondaryActionButtonStyle}
                    >
                      {t('caminhadaChecklist.markPaid')}
                    </button>
                  )}

                  <button
                    onClick={() => handleCheckIn(reservation.id)}
                    disabled={isCheckedIn}
                    style={{
                      ...primaryActionButtonStyle,
                      opacity: isCheckedIn ? 0.6 : 1,
                      cursor: isCheckedIn ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isCheckedIn
                      ? t('caminhadaChecklist.checkedIn')
                      : t('caminhadaChecklist.checkIn')}
                  </button>

                  <button
                    onClick={() => handleMarkWalked(reservation.caominhada_dogs.id)}
                    disabled={isWalked}
                    style={{
                      ...primaryActionButtonStyle,
                      opacity: isWalked ? 0.6 : 1,
                      cursor: isWalked ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isWalked
                      ? t('caminhadaChecklist.walked')
                      : t('caminhadaChecklist.markWalked')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SummaryStat({ label, value, warn }) {
  return (
    <div style={warn ? summaryStatWarnStyle : summaryStatStyle}>
      <div style={summaryValueStyle}>{value}</div>
      <div style={summaryLabelStyle}>{label}</div>
    </div>
  )
}

const pageStyle = {
  padding: '1rem',
  maxWidth: '1100px',
  margin: '0 auto',
  background: '#f7f3ec',
  minHeight: '100vh',
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1.25rem',
  flexWrap: 'wrap',
}

const titleStyle = {
  margin: 0,
  color: '#6f451f',
}

const subtitleStyle = {
  margin: '0.35rem 0 0 0',
  color: '#6b6b6b',
}

const backLinkStyle = {
  display: 'inline-block',
  marginTop: '0.5rem',
  color: '#8a5a2b',
  fontWeight: 700,
  textDecoration: 'none',
}

const errorStyle = {
  color: 'crimson',
  marginBottom: '1rem',
}

const summaryRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '1rem',
  marginBottom: '1.5rem',
}

const summaryStatStyle = {
  border: '1px solid #e4d8c8',
  borderRadius: '14px',
  padding: '1rem',
  background: '#fff',
  textAlign: 'center',
}

const summaryStatWarnStyle = {
  ...summaryStatStyle,
  border: '1px solid #fca5a5',
  background: '#fee2e2',
}

const summaryValueStyle = {
  fontSize: '2rem',
  fontWeight: 800,
  color: '#6f451f',
}

const summaryLabelStyle = {
  marginTop: '0.35rem',
  color: '#6b6b6b',
  fontSize: '0.9rem',
}

const emptyStateStyle = {
  padding: '1.25rem',
  borderRadius: '14px',
  background: '#fff',
  color: '#6b6b6b',
  textAlign: 'center',
  border: '1px solid #e4d8c8',
}

const cardListStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1rem',
}

const checklistCardStyle = {
  border: '1px solid #e4d8c8',
  borderRadius: '16px',
  padding: '1rem',
  background: '#fff',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
}

const checklistHeaderStyle = {
  display: 'flex',
  gap: '0.85rem',
  alignItems: 'center',
  marginBottom: '0.85rem',
}

const dogImageWrapperStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '12px',
  overflow: 'hidden',
  background: '#f7f3ec',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const dogImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const dogPlaceholderStyle = {
  fontSize: '1.75rem',
}

const dogNameStyle = {
  fontSize: '1.1rem',
  color: '#2f2f2f',
}

const walkerStyle = {
  color: '#6b6b6b',
  fontSize: '0.9rem',
}

const phoneLinkStyle = {
  color: '#1d4ed8',
  fontWeight: 700,
  textDecoration: 'none',
  fontSize: '0.9rem',
}

const metaRowStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
  marginBottom: '0.75rem',
}

const metaBadgeStyle = {
  display: 'inline-block',
  padding: '0.3rem 0.6rem',
  borderRadius: '999px',
  background: '#f7f3ec',
  color: '#6f451f',
  fontSize: '0.8rem',
  fontWeight: 700,
}

const pendingBadgeStyle = {
  ...metaBadgeStyle,
  background: '#fee2e2',
  color: '#991b1b',
}

const paidBadgeStyle = {
  ...metaBadgeStyle,
  background: '#dcfce7',
  color: '#166534',
}

const checkboxRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.85rem',
  fontSize: '0.9rem',
}

const actionsRowStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
}

const primaryActionButtonStyle = {
  flex: '1 1 auto',
  background: '#8a5a2b',
  color: '#fff',
  border: 'none',
  padding: '0.6rem 0.85rem',
  borderRadius: '999px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.85rem',
}

const secondaryActionButtonStyle = {
  flex: '1 1 auto',
  background: '#fff8ef',
  color: '#6f451f',
  border: '1px solid #e4d8c8',
  padding: '0.6rem 0.85rem',
  borderRadius: '999px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.85rem',
}
