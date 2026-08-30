import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

const PAYMENT_OPTIONS = ['pending', 'paid', 'waived']
const RESERVATION_ACTIONS = {
  reserved: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['cancelled', 'no_show'],
  cancelled: ['reserved'],
  no_show: ['reserved'],
}

export default function CaminhadaManagePage() {
  const { t } = useTranslation()
  const { caminhadaId } = useParams()

  const [caminhada, setCaminhada] = useState(null)
  const [pool, setPool] = useState([])
  const [reservations, setReservations] = useState([])
  const [availableDogs, setAvailableDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const [dogToAdd, setDogToAdd] = useState('')

  const [manualDogId, setManualDogId] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualParticipants, setManualParticipants] = useState(1)
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [manualError, setManualError] = useState('')

  useEffect(() => {
    loadAll()
  }, [caminhadaId])

  const loadAll = async () => {
    setLoading(true)
    setError('')

    const [caminhadaRes, poolRes, reservationsRes, dogsRes] = await Promise.all([
      supabase.from('caominhadas').select('*').eq('id', caminhadaId).single(),
      supabase
        .from('caominhada_dogs')
        .select('id, dog_id, status, notes, dogs(id, name, image_url, size, sex)')
        .eq('caominhada_id', caminhadaId)
        .order('id', { ascending: true }),
      supabase
        .from('caominhada_reservations')
        .select(
          'id, participant_count, donation_amount, payment_status, reservation_status, souvenir_delivered, notes, created_at, people(id,name,phone,email), caominhada_dogs(id,status,dog_id,dogs(id,name))'
        )
        .eq('caominhada_id', caminhadaId)
        .order('created_at', { ascending: true }),
      supabase
        .from('dogs_view')
        .select('id, name, size, sex, image_url, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true }),
    ])

    if (caminhadaRes.error) {
      setError(caminhadaRes.error.message)
      setLoading(false)
      return
    }

    setCaminhada(caminhadaRes.data)
    setPool(poolRes.data || [])
    setReservations(reservationsRes.data || [])
    setAvailableDogs(dogsRes.data || [])
    setLoading(false)
  }

  const poolDogIds = new Set(pool.map((p) => p.dog_id))
  const dogsNotInPool = availableDogs.filter((d) => !poolDogIds.has(d.id))
  const availablePoolRows = pool.filter((p) => p.status === 'available')

  const handleAddToPool = async (e) => {
    e.preventDefault()
    setActionError('')

    if (!dogToAdd) return

    const { error } = await supabase.from('caominhada_dogs').insert({
      caominhada_id: Number(caminhadaId),
      dog_id: Number(dogToAdd),
      status: 'available',
    })

    if (error) {
      setActionError(error.message)
      return
    }

    setDogToAdd('')
    await loadAll()
  }

  const handleRemoveFromPool = async (poolRow) => {
    setActionError('')

    const { error } = await supabase
      .from('caominhada_dogs')
      .delete()
      .eq('id', poolRow.id)

    if (error) {
      if (error.code === '23503') {
        setActionError(t('caminhadaManage.cannotRemoveDog'))
      } else {
        setActionError(error.message)
      }
      return
    }

    await loadAll()
  }

  const handlePoolStatusChange = async (poolRow, status) => {
    const { error } = await supabase
      .from('caominhada_dogs')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', poolRow.id)

    if (error) {
      setActionError(error.message)
      return
    }

    await loadAll()
  }

  const updateReservationField = async (reservationId, fields) => {
    const { error } = await supabase
      .from('caominhada_reservations')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', reservationId)

    if (error) {
      setActionError(error.message)
      return
    }

    await loadAll()
  }

  const handleReservationStatusChange = async (reservationId, newStatus) => {
    const { error } = await supabase.rpc('set_caominhada_reservation_status', {
      p_reservation_id: reservationId,
      p_new_status: newStatus,
    })

    if (error) {
      setActionError(error.message)
      return
    }

    await loadAll()
  }

  const handleDeleteReservation = async (reservationId) => {
    const confirmed = window.confirm(t('caminhadaManage.confirmDelete'))
    if (!confirmed) return

    const { error } = await supabase.rpc('delete_caominhada_reservation', {
      p_reservation_id: reservationId,
    })

    if (error) {
      setActionError(error.message)
      return
    }

    await loadAll()
  }

  const handleManualAdd = async (e) => {
    e.preventDefault()
    setManualSubmitting(true)
    setManualError('')

    const { error } = await supabase.rpc('public_register_caominhada', {
      p_caominhada_dog_id: Number(manualDogId),
      p_person_name: manualName,
      p_phone: manualPhone,
      p_participant_count: Number(manualParticipants) || 1,
      p_email: manualEmail || null,
    })

    if (error) {
      setManualError(error.message)
      setManualSubmitting(false)
      return
    }

    setManualDogId('')
    setManualName('')
    setManualPhone('')
    setManualEmail('')
    setManualParticipants(1)
    setManualSubmitting(false)
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

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{caminhada.title}</h1>
          <Link to="/caminhadas" style={backLinkStyle}>
            {t('common.back')}
          </Link>
        </div>
        <LanguageSwitcher />
      </header>

      {actionError && <p style={errorStyle}>{actionError}</p>}

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{t('caminhadaManage.dogPoolTitle')}</h2>

        <form onSubmit={handleAddToPool} style={inlineFormStyle}>
          <select
            value={dogToAdd}
            onChange={(e) => setDogToAdd(e.target.value)}
            style={selectStyle}
          >
            <option value="">{t('startWalk.selectDog')}</option>
            {dogsNotInPool.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={!dogToAdd} style={smallButtonStyle}>
            {t('caminhadaManage.addDogToPool')}
          </button>
        </form>

        {pool.length === 0 ? (
          <p style={mutedTextStyle}>{t('caminhadaManage.poolEmpty')}</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>{t('startWalk.dog')}</th>
                  <th style={thStyle}>{t('caminhadaManage.status')}</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {pool.map((poolRow) => (
                  <tr key={poolRow.id}>
                    <td style={tdStrongStyle}>{poolRow.dogs?.name}</td>
                    <td style={tdStyle}>
                      {poolRow.status === 'available' ||
                      poolRow.status === 'unavailable' ? (
                        <select
                          value={poolRow.status}
                          onChange={(e) =>
                            handlePoolStatusChange(poolRow, e.target.value)
                          }
                          style={selectStyle}
                        >
                          <option value="available">
                            {t('caminhada.dogStatus.available')}
                          </option>
                          <option value="unavailable">
                            {t('caminhada.dogStatus.unavailable')}
                          </option>
                        </select>
                      ) : (
                        <span>{t(`caminhada.dogStatus.${poolRow.status}`)}</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleRemoveFromPool(poolRow)}
                        style={dangerButtonStyle}
                      >
                        {t('caminhadaManage.removeDog')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{t('caminhadaManage.addManualTitle')}</h2>

        <form onSubmit={handleManualAdd} style={formGridStyle}>
          <div>
            <label style={labelStyle}>{t('startWalk.dog')}</label>
            <select
              value={manualDogId}
              onChange={(e) => setManualDogId(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">{t('startWalk.selectDog')}</option>
              {availablePoolRows.map((poolRow) => (
                <option key={poolRow.id} value={poolRow.id}>
                  {poolRow.dogs?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>{t('caminhadaRegister.yourName')}</label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('caminhadaRegister.phoneNumber')}</label>
            <input
              type="tel"
              value={manualPhone}
              onChange={(e) => setManualPhone(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('caminhadaRegister.emailOptional')}</label>
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('caminhadaManage.participantCount')}</label>
            <input
              type="number"
              min={1}
              value={manualParticipants}
              onChange={(e) => setManualParticipants(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ alignSelf: 'end' }}>
            <button
              type="submit"
              disabled={manualSubmitting || availablePoolRows.length === 0}
              className="azl-button-primary"
              style={{ opacity: manualSubmitting ? 0.7 : 1 }}
            >
              {t('caminhadaRegister.submit')}
            </button>
          </div>
        </form>

        {manualError && <p style={errorStyle}>{manualError}</p>}
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{t('caminhadaManage.reservationsTitle')}</h2>

        {reservations.length === 0 ? (
          <p style={mutedTextStyle}>{t('caminhadaManage.reservationsEmpty')}</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>{t('startWalk.dog')}</th>
                  <th style={thStyle}>{t('caminhadaManage.walker')}</th>
                  <th style={thStyle}>{t('caminhadaManage.phone')}</th>
                  <th style={thStyle}>{t('caminhadaManage.participantCount')}</th>
                  <th style={thStyle}>{t('caminhadaManage.donationAmount')}</th>
                  <th style={thStyle}>{t('caminhadaManage.paymentStatus')}</th>
                  <th style={thStyle}>{t('caminhadaManage.souvenirDelivered')}</th>
                  <th style={thStyle}>{t('caminhadaManage.reservationStatus')}</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td style={tdStrongStyle}>
                      {reservation.caominhada_dogs?.dogs?.name}
                    </td>
                    <td style={tdStyle}>{reservation.people?.name}</td>
                    <td style={tdStyle}>
                      <a
                        href={`tel:${reservation.people?.phone}`}
                        style={phoneLinkStyle}
                      >
                        {reservation.people?.phone}
                      </a>
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min={1}
                        defaultValue={reservation.participant_count}
                        onBlur={(e) =>
                          updateReservationField(reservation.id, {
                            participant_count: Number(e.target.value) || 1,
                          })
                        }
                        style={narrowInputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={reservation.donation_amount ?? ''}
                        onBlur={(e) =>
                          updateReservationField(reservation.id, {
                            donation_amount: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        style={narrowInputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <select
                        value={reservation.payment_status}
                        onChange={(e) =>
                          updateReservationField(reservation.id, {
                            payment_status: e.target.value,
                          })
                        }
                        style={selectStyle}
                      >
                        {PAYMENT_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {t(`caminhada.paymentStatus.${status}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={reservation.souvenir_delivered}
                        onChange={(e) =>
                          updateReservationField(reservation.id, {
                            souvenir_delivered: e.target.checked,
                          })
                        }
                      />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span>
                          {t(`caminhada.reservationStatus.${reservation.reservation_status}`)}
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {(RESERVATION_ACTIONS[reservation.reservation_status] || []).map(
                            (nextStatus) => (
                              <button
                                key={nextStatus}
                                onClick={() =>
                                  handleReservationStatusChange(reservation.id, nextStatus)
                                }
                                style={smallButtonStyle}
                              >
                                {t(
                                  nextStatus === 'checked_in'
                                    ? 'caminhadaManage.markCheckedIn'
                                    : nextStatus === 'cancelled'
                                      ? 'caminhadaManage.markCancelled'
                                      : nextStatus === 'no_show'
                                        ? 'caminhadaManage.markNoShow'
                                        : 'caminhadaManage.markReserved'
                                )}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDeleteReservation(reservation.id)}
                        style={dangerButtonStyle}
                      >
                        {t('caminhadaManage.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

const pageStyle = {
  padding: '1rem',
  maxWidth: '1300px',
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

const backLinkStyle = {
  display: 'inline-block',
  marginTop: '0.5rem',
  color: '#8a5a2b',
  fontWeight: 700,
  textDecoration: 'none',
}

const cardStyle = {
  border: '1px solid #e4d8c8',
  borderRadius: '18px',
  padding: '1rem',
  background: '#fff',
  marginBottom: '1.25rem',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
}

const sectionTitleStyle = {
  margin: '0 0 1rem 0',
  color: '#6f451f',
}

const inlineFormStyle = {
  display: 'flex',
  gap: '0.75rem',
  marginBottom: '1rem',
  flexWrap: 'wrap',
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: 600,
}

const inputStyle = {
  width: '100%',
  padding: '0.7rem',
  border: '1px solid #ccc',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}

const narrowInputStyle = {
  width: '80px',
  padding: '0.5rem',
  border: '1px solid #ccc',
  borderRadius: '8px',
  fontSize: '0.9rem',
}

const selectStyle = {
  padding: '0.5rem 0.6rem',
  border: '1px solid #ccc',
  borderRadius: '10px',
  fontSize: '0.9rem',
}

const errorStyle = {
  color: 'crimson',
  marginTop: '0.5rem',
}

const mutedTextStyle = {
  color: '#6b6b6b',
}

const tableWrapperStyle = {
  overflowX: 'auto',
  border: '1px solid #eee',
  borderRadius: '14px',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '900px',
}

const thStyle = {
  textAlign: 'left',
  borderBottom: '1px solid #e4d8c8',
  padding: '0.75rem',
  background: '#fff8ef',
  color: '#6f451f',
  fontSize: '0.85rem',
}

const tdStyle = {
  borderBottom: '1px solid #f1eee9',
  padding: '0.75rem',
  verticalAlign: 'middle',
}

const tdStrongStyle = {
  ...tdStyle,
  fontWeight: 700,
  color: '#2f2f2f',
}

const phoneLinkStyle = {
  color: '#1d4ed8',
  textDecoration: 'none',
  fontWeight: 700,
}

const smallButtonStyle = {
  padding: '0.4rem 0.7rem',
  borderRadius: '999px',
  border: '1px solid #e4d8c8',
  background: '#fff8ef',
  color: '#6f451f',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.8rem',
}

const dangerButtonStyle = {
  padding: '0.4rem 0.7rem',
  borderRadius: '999px',
  border: '1px solid #fca5a5',
  background: '#fee2e2',
  color: '#991b1b',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.8rem',
}
