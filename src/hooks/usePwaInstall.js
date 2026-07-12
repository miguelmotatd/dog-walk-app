import { useEffect, useState, useCallback } from 'react'

const DISMISS_KEY = 'pwa_install_dismissed_at'
const DISMISS_DAYS = 0 // não volta a incomodar durante 14 dias depois de fechar

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // Safari iOS antigo
  )
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isSafari() {
  const ua = window.navigator.userAgent
  return /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua)
}

function wasRecentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false

  const dismissedAt = Number(raw)
  if (Number.isNaN(dismissedAt)) return false

  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
  return daysSince < DISMISS_DAYS
}

/**
 * Hook que expõe:
 * - platform: 'android' | 'ios' | 'other'
 * - canShowBanner: se faz sentido mostrar sugestão de instalação agora
 * - promptInstall: (só Android/Chrome) dispara o diálogo nativo de instalação
 * - dismiss: esconde o banner e não volta a mostrar durante DISMISS_DAYS dias
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(isStandalone())
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed())

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    const handleAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const platform = isIos() ? 'ios' : deferredPrompt ? 'android' : 'other'

  // No iOS só faz sentido sugerir dentro do Safari (fora do Safari o passo
  // "Adicionar ao Ecrã Principal" nem sequer está disponível no menu de partilha)
  const canShowBanner =
    !installed &&
    !dismissed &&
    ((platform === 'ios' && isSafari()) || platform === 'android')

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }, [])

  return { platform, canShowBanner, promptInstall, dismiss }
}