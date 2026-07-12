// ============================================================
// AZL Passeios — Service Worker
// Gere push notifications e lembretes de regresso de passeios
// ============================================================

const SW_VERSION = 'azl-walks-v1'

// ── Instalação e activação ──────────────────────────────────

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// ── Push enviado pelo servidor (Supabase Edge Function) ─────
// Payload esperado: { title, body, url, icon? }

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = {
      title: '🐕 Passeio AZL',
      body: event.data.text(),
      url: '/',
    }
  }

  const { title, body, url, icon } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `walk-${url}`,           // evita duplicados para o mesmo passeio
      renotify: true,
      requireInteraction: true,     // fica visível até o utilizador interagir
      data: { url },
      actions: [
        { action: 'return', title: '🏠 Dar entrada do cão' },
        { action: 'dismiss', title: 'Fechar' },
      ],
    })
  )
})

// ── Clique na notificação ───────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Se já há uma janela aberta, foca e navega
        for (const client of windowClients) {
          if ('focus' in client) {
            client.focus()
            client.navigate(targetUrl)
            return
          }
        }
        // Caso contrário abre nova janela
        return clients.openWindow(targetUrl)
      })
  )
})

// ── Agendamento local via mensagem da página ────────────────
// Usado como fallback quando não há servidor de push
// Funciona enquanto o Service Worker estiver activo (sessão aberta)

const scheduledTimers = new Map()

self.addEventListener('message', (event) => {
  const { type } = event.data || {}

  if (type === 'SCHEDULE_WALK_REMINDER') {
    const { walkId, token, dogName, expectedReturnAt, originUrl } = event.data

    // Cancela agendamento anterior para o mesmo passeio (se existir)
    if (scheduledTimers.has(walkId)) {
      clearTimeout(scheduledTimers.get(walkId))
    }

    const returnTime = new Date(expectedReturnAt).getTime()
    const now = Date.now()

    // Lembrete 30 minutos antes do regresso previsto
    const REMINDER_BEFORE_MS = 30 * 60 * 1000
    const delay = returnTime - REMINDER_BEFORE_MS - now

    if (delay <= 0) {
      // Já passou a hora — mostra imediatamente
      showReminderNotification({ walkId, token, dogName, originUrl })
      return
    }

    const timerId = setTimeout(() => {
      showReminderNotification({ walkId, token, dogName, originUrl })
      scheduledTimers.delete(walkId)
    }, delay)

    scheduledTimers.set(walkId, timerId)

    // Confirma agendamento ao caller
    event.source?.postMessage({
      type: 'REMINDER_SCHEDULED',
      walkId,
      reminderAt: new Date(now + delay).toISOString(),
    })
  }

  if (type === 'CANCEL_WALK_REMINDER') {
    const { walkId } = event.data
    if (scheduledTimers.has(walkId)) {
      clearTimeout(scheduledTimers.get(walkId))
      scheduledTimers.delete(walkId)
    }
  }
})

function showReminderNotification({ walkId, token, dogName, originUrl }) {
  const url = `${originUrl}/walk/${walkId}?token=${token}`

  self.registration.showNotification(`🐕 Hora de regressar com ${dogName}!`, {
    body: 'Faltam 30 minutos para o prazo. Clique para registar o regresso.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `walk-reminder-${walkId}`,
    requireInteraction: true,
    data: { url },
    actions: [
      { action: 'return', title: '🏠 Dar entrada do cão' },
      { action: 'dismiss', title: 'Mais tarde' },
    ],
  })
}