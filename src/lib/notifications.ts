import { supabase } from '../lib/supabase'

// ── Registo do Service Worker ───────────────────────────────

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    })
    console.log('✅ Service Worker registado')
    return registration
  } catch (error) {
    console.error('❌ Falha ao registar Service Worker:', error)
    return null
  }
}

// ── Pedir permissão de notificações ────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'

  return await Notification.requestPermission()
}

// ── Notificação imediata ao iniciar passeio ─────────────────

export async function notifyWalkStarted({
  walkId,
  token,
  dogName,
}: {
  walkId: number
  token: string
  dogName: string
}): Promise<void> {
  const permission = await requestNotificationPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready
  const url = `${window.location.origin}/walk/${walkId}?token=${token}` // ✅ token incluído

  await registration.showNotification(`🐕 Passeio com ${dogName} iniciado!`, {
    body: 'Lembre-se de regressar antes das 11:00. Toque para ver o passeio.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `walk-start-${walkId}`,
    data: { url },
  })
}

// ── Agendar lembrete 30 min antes do regresso ───────────────
// O Service Worker agenda um setTimeout local.
// Funciona enquanto o SW estiver activo (tab aberta ou em background recente).
// Para notificações mesmo com a app fechada → ver setupPushSubscription abaixo.

export async function scheduleWalkReminder({
  walkId,
  token,
  dogName,
  expectedReturnAt,
}: {
  walkId: number
  token: string
  dogName: string
  expectedReturnAt: string
}): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready

  if (!registration.active) {
    console.warn('SW activo não disponível para agendamento')
    return
  }

  registration.active.postMessage({
    type: 'SCHEDULE_WALK_REMINDER',
    walkId,
    token,
    dogName,
    expectedReturnAt,
    originUrl: window.location.origin,
  })
}

// ── Cancelar lembrete (ao dar return do passeio) ────────────

export async function cancelWalkReminder(walkId: number): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.ready

  registration.active?.postMessage({
    type: 'CANCEL_WALK_REMINDER',
    walkId,
  })
}

// ── Fluxo completo ao iniciar passeio ──────────────────────
// Chama isto após o RPC start_walk ter sucesso.

export async function setupWalkNotifications({
  walkId,
  token,
  dogName,
  expectedReturnAt,
  personPublicToken,
}: {
  walkId: number
  token: string
  dogName: string
  expectedReturnAt: string
  personPublicToken : string
}): Promise<void> {
  try {
    await notifyWalkStarted({ walkId, token, dogName })
    await setupPushSubscription(personPublicToken) 

    console.log(`✅ Notificações configuradas para passeio ${walkId}`)
  } catch (error) {
    // Falhas de notificação não devem bloquear o fluxo do passeio
    console.error('Erro ao configurar notificações:', error)
  }
}

// ── Web Push (opcional) — para notificações com app fechada ─
// Requer: VITE_VAPID_PUBLIC_KEY e uma Supabase Edge Function
// que envie o push na hora certa (via cron job ou pg_cron).

export async function setupPushSubscription(
  personPublicToken: string
): Promise<PushSubscription | null> {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    console.warn('VITE_VAPID_PUBLIC_KEY não definida — Web Push desactivado')
    return null
  }

  if (!('PushManager' in window)) {
    console.warn('PushManager não suportado neste browser')
    return null
  }

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') return null

  try {
    const registration = await navigator.serviceWorker.ready

    // Reutiliza subscription existente ou cria nova
    const existing = await registration.pushManager.getSubscription()
    const subscription =
      existing ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      }))

    // Guarda na BD para o servidor enviar pushes futuros
    await saveSubscriptionToDatabase(subscription, personPublicToken)

    console.log('✅ Web Push subscription activa')
    return subscription
  } catch (error) {
    console.error('Erro ao criar Web Push subscription:', error)
    return null
  }
}

// ── Guardar subscription na BD ──────────────────────────────

async function saveSubscriptionToDatabase(
  subscription: PushSubscription,
  personPublicToken: string
): Promise<void> {
  const subJson = subscription.toJSON()

  const { error } = await supabase.rpc('upsert_push_subscription', {
    p_person_public_token: personPublicToken,
    p_endpoint: subscription.endpoint,
    p_p256dh: subJson.keys?.p256dh ?? null,
    p_auth: subJson.keys?.auth ?? null,
  })

  if (error) {
    console.error('Erro ao guardar push subscription:', error)
    throw error
  }
}

// ── Helper: converter VAPID key ─────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }

  return output
}