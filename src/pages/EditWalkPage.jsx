import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function EditWalkPage() {
  const { t } = useTranslation()
  const { walkId } = useParams()
  const navigate = useNavigate()

  const [walk, setWalk] = useState(null)
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [formData, setFormData] = useState({
    dogId: '',
    personName: '',
    phone: '',
    expectedReturnAt: '',
    returnedAt: '',
    status: 'active',
    checkoutNotes: '',
    returnNotes: '',
  })

  const isReturned = useMemo(
    () => formData.status === 'returned' || Boolean(walk?.returned_at),
    [formData.status, walk]
  )

  useEffect(() => {
    loadWalk()
  }, [walkId])

  const loadWalk = async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const { data: walkData, error: walkError } = await supabase
        .from('walks')
        .select(`
          id,
          dog_id,
          person_id,
          checked_out_at,
          expected_return_at,
          returned_at,
          status,
          checkout_notes,
          return_notes,
          dogs (
            id,
            name,
            status
          ),
          people (
            id,
            name,
            phone
          )
        `)
        .eq('id', Number(walkId))
        .single()

      if (walkError) {
        setErrorMessage(walkError.message)
        setLoading(false)
        return
      }

      if (!walkData) {
        setErrorMessage(t('publicWalk.walkNotFound'))
        setLoading(false)
        return
      }

      setWalk(walkData)

      setFormData({
        dogId: walkData.dog_id || '',
        personName: walkData.people?.name || '',
        phone: walkData.people?.phone || '',
        expectedReturnAt: formatDateTime(walkData.expected_return_at, 'en'),
        returnedAt: walkData.returned_at
          ? formatDateTime(walkData.returned_at, 'en')
          : '',
        status: walkData.status || 'active',
        checkoutNotes: walkData.checkout_notes || '',
        returnNotes: walkData.return_notes || '',
      })

      const { data: dogsData, error: dogsError } = await supabase
        .from('dogs')
        .select('id, name, status')
        .eq('is_active', true)
        .in('status', ['available'])
        .order('name', { ascending: true })

      if (dogsError) {
        setErrorMessage(dogsError.message)
        setLoading(false)
        return
      }

      // Incluir o cão atual se não estiver na lista (ex: out_on_walk)
      const currentDog = walkData.dogs
      const alreadyInList = dogsData?.some((d) => d.id === currentDog?.id)
      const finalDogs = currentDog && !alreadyInList
        ? [{ id: currentDog.id, name: currentDog.name, status: currentDog.status }, ...(dogsData || [])]
        : (dogsData || [])

      setDogs(finalDogs)
      setLoading(false)
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao carregar passeio.')
      setLoading(false)
    }
  }

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleUpdateWalk = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    try {
      const { error: rpcError } = await supabase.rpc('edit_walk', {
        p_walk_id: Number(walkId),
        p_dog_id: formData.dogId ? Number(formData.dogId) : null,
        p_expected_return_at: formData.expectedReturnAt
          ? new Date(formData.expectedReturnAt).toISOString()
          : null,
        p_returned_at: formData.returnedAt
          ? new Date(formData.returnedAt).toISOString()
          : null,
        p_status: formData.status || 'active',
        p_checkout_notes: formData.checkoutNotes.trim() || null,
        p_return_notes: formData.returnNotes.trim() || null,
        p_person_name: formData.personName.trim() || null,
        p_phone: formData.phone.trim() || null,
      })

      if (rpcError) {
        setErrorMessage(rpcError.message)
        setSubmitting(false)
        return
      }

      if (walk?.person_id) {
        const { error: personError } = await supabase
          .from('people')
          .update({
            name: formData.personName.trim() || null,
            phone: formData.phone.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', walk.person_id)
          .select()

        if (personError) {
          setErrorMessage(personError.message)
          setSubmitting(false)
          return
        }
      }

      navigate('/')
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao guardar alterações.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div style={pageStyle}>{t('common.loading')}</div>
  }

  if (!walk) {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>{t('publicWalk.title')}</h1>
            <div style={{ marginTop: '0.75rem' }}>
              <Link to="/" style={backLinkStyle}>
                {t('common.back')}
              </Link>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
        <p style={errorBoxStyle}>
          {errorMessage || t('publicWalk.walkNotFound')}
        </p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            {t('dashboard.editWalk')} - {walk.dogs?.name || t('startWalk.dog')}
          </h1>
          <div style={{ marginTop: '0.75rem' }}>
            <Link to="/" style={backLinkStyle}>
              {t('common.back')}
            </Link>
          </div>
        </div>
        <LanguageSwitcher />
      </div>

      <div style={cardStyle}>
        <form onSubmit={handleUpdateWalk} style={formStyle}>
          <div style={gridStyle}>
            <div>
              <label htmlFor="walk-dog" style={labelStyle}>
                {t('startWalk.dog')}
              </label>
              <select
                id="walk-dog"
                name="dogId"
                value={formData.dogId}
                onChange={(e) => handleChange('dogId', e.target.value)}
                style={inputStyle}
                required
              >
                <option value="">{t('dashboard.selectDog')}</option>
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.id}>
                    {dog.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="walk-person-name" style={labelStyle}>
                {t('startWalk.yourName')}
              </label>
              <input
                id="walk-person-name"
                name="personName"
                type="text"
                value={formData.personName}
                onChange={(e) => handleChange('personName', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="walk-phone" style={labelStyle}>
                {t('startWalk.phoneNumber')}
              </label>
              <input
                id="walk-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="walk-expected-return-at" style={labelStyle}>
                {t('dashboard.expectedReturn')}
              </label>
              <input
                id="walk-expected-return-at"
                name="expectedReturnAt"
                type="datetime-local"
                value={formData.expectedReturnAt}
                onChange={(e) => handleChange('expectedReturnAt', e.target.value)}
                disabled
                style={dateTimeInputStyle}
              />
            </div>

            {/* Só faz sentido mostrar isto quando o passeio já regressou */}
            {isReturned && (
              <div>
                <label htmlFor="walk-returned-at" style={labelStyle}>
                  {t('publicWalk.returnedAt')}
                </label>
                <input
                  id="walk-returned-at"
                  name="returnedAt"
                  type="datetime-local"
                  value={formData.returnedAt}
                  onChange={(e) => handleChange('returnedAt', e.target.value)}
                  disabled
                  style={dateTimeInputStyle}
                />
              </div>
            )}

            <div>
              <label htmlFor="walk-status" style={labelStyle}>
                {t('dashboard.status')}
              </label>
              <select
                id="walk-status"
                name="status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                style={inputStyle}
              >
                <option value="active">{t('publicWalk.active')}</option>
                <option value="returned">{t('publicWalk.returned')}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="walk-checkout-notes" style={labelStyle}>
              {t('publicWalk.checkoutNotes')}
            </label>
            <textarea
              id="walk-checkout-notes"
              name="checkoutNotes"
              value={formData.checkoutNotes}
              onChange={(e) => handleChange('checkoutNotes', e.target.value)}
              rows={3}
              style={textareaStyle}
            />
          </div>

          {/* Notas de regresso só fazem sentido depois do cão ter regressado */}
          {isReturned && (
            <div>
              <label htmlFor="walk-return-notes" style={labelStyle}>
                {t('publicWalk.returnNotes')}
              </label>
              <textarea
                id="walk-return-notes"
                name="returnNotes"
                value={formData.returnNotes}
                onChange={(e) => handleChange('returnNotes', e.target.value)}
                rows={3}
                style={textareaStyle}
              />
            </div>
          )}

          {errorMessage && <p style={errorBoxStyle}>{errorMessage}</p>}

          <div style={actionsStyle}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...primaryButtonStyle,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? t('common.saving') : t('dashboard.editWalk')}
            </button>
            <Link to="/" style={secondaryButtonStyle}>
              {t('common.cancel')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatDateTime(value, language) {
  if (!value) return '-'
  return new Date(value).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US', 
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }



const pageStyle = {
  padding: '2rem',
  maxWidth: '900px',
  margin: '0 auto',
  minHeight: '100vh',
  background: '#f7f3ec',
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
}

const titleStyle = {
  margin: 0,
  color: '#6f451f',
}

const cardStyle = {
  border: '1px solid #e4d8c8',
  borderRadius: '18px',
  padding: '1.25rem',
  background: '#fff',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
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
  fontWeight: 700,
  boxSizing: 'border-box',
  background: '#fff',
}

const readOnlyInputStyle = {
  ...inputStyle,
  background: '#f5f5f5',
  color: '#666',
  cursor: 'not-allowed',
}

// Estilo dedicado para inputs datetime-local: o browser renderiza estes
// campos com altura própria (por causa dos controlos de calendário/relógio),
// por isso fixamos altura e padding para ficarem alinhados com os outros campos.
const dateTimeInputStyle = {
  ...readOnlyInputStyle,
  height: '3.1rem',
  padding: '0 0.8rem',
  lineHeight: '3.1rem',
  fontWeight: 700,
}

const textareaStyle = {
  ...inputStyle,
  fontWeight: 400,
  resize: 'vertical',
}

const errorBoxStyle = {
  padding: '0.8rem',
  borderRadius: '12px',
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fca5a5',
}

const actionsStyle = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
}

// Base partilhada pelos botões — evita repetir padding/borderRadius/fontWeight
const botaoBaseStyle = {
  padding: '0.9rem 1.2rem',
  borderRadius: '999px',
  fontWeight: 700,
}

const primaryButtonStyle = {
  ...botaoBaseStyle,
  background: '#8a5a2b',
  color: '#fff',
  border: 'none',
  fontSize: '1rem',
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  ...botaoBaseStyle,
  display: 'inline-block',
  background: '#fff8ef',
  color: '#6f451f',
  textDecoration: 'none',
  border: '1px solid #e4d8c8',
  textAlign: 'center',
}

const backLinkStyle = {
  display: 'inline-block',
  marginTop: '0.75rem',
  color: '#6f451f',
  fontWeight: 700,
}