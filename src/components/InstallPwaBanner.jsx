import { useTranslation } from 'react-i18next'
import { usePwaInstall } from '../hooks/usePwaInstall'

export default function InstallPwaBanner() {
  const { t } = useTranslation()
  const { platform, canShowBanner, promptInstall, dismiss } = usePwaInstall()

  if (!canShowBanner) return null

  return (
    <div style={containerStyle} role="dialog" aria-label={t('pwaInstall.title')}>
      <div style={rowStyle}>
        <img
          src="/icons/icon-192x192.png"
          alt="Passeios AZL"
          style={iconStyle}
        />

        <div style={textColStyle}>
          <strong style={titleStyle}>{t('pwaInstall.title')}</strong>

          {platform === 'android' ? (
            <p style={subtitleStyle}>{t('pwaInstall.androidSubtitle')}</p>
          ) : (
            <ol style={stepsListStyle}>
              <li>{t('pwaInstall.iosStep1')}</li>
              <li>{t('pwaInstall.iosStep2')}</li>
              <li>{t('pwaInstall.iosStep3')}</li>
            </ol>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label={t('common.cancel')}
          style={closeButtonStyle}
        >
          ✕
        </button>
      </div>

      {platform === 'android' && (
        <button type="button" onClick={promptInstall} style={installButtonStyle}>
          {t('pwaInstall.installButton')}
        </button>
      )}
    </div>
  )
}

const containerStyle = {
  position: 'fixed',
  left: '1rem',
  right: '1rem',
  bottom: '1rem',
  zIndex: 1000,
  maxWidth: '480px',
  margin: '0 auto',
  background: '#fff',
  border: '1px solid #e4d8c8',
  borderRadius: '18px',
  padding: '1rem',
  boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
}

const rowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem',
}

const iconStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  flexShrink: 0,
}

const textColStyle = {
  flex: 1,
  minWidth: 0,
}

const titleStyle = {
  display: 'block',
  color: '#6f451f',
  fontSize: '1rem',
  marginBottom: '0.3rem',
}

const subtitleStyle = {
  margin: 0,
  color: '#555',
  fontSize: '0.92rem',
  lineHeight: 1.4,
}

const stepsListStyle = {
  margin: '0.2rem 0 0 0',
  paddingLeft: '1.1rem',
  color: '#555',
  fontSize: '0.9rem',
  lineHeight: 1.5,
}

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#999',
  fontSize: '1.1rem',
  cursor: 'pointer',
  padding: '0.15rem 0.3rem',
  flexShrink: 0,
}

const installButtonStyle = {
  width: '100%',
  marginTop: '0.85rem',
  background: '#8a5a2b',
  color: '#fff',
  border: 'none',
  padding: '0.8rem 1rem',
  borderRadius: '999px',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
}