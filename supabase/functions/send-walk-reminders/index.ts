import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "npm:web-push"


// ── Supabase (admin, pode ler tudo) ──────────────────────

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

webpush.setVapidDetails(
  "mailto:azleiria.geral@gmail.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
)

// ── Handler principal ─────────────────────────────────────

Deno.serve(async () => {
  const in30min = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const { data: walks, error } = await supabase
    .from("walks")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("status", "active")
    .is("returned_at", null)
    .is("reminder_sent_at", null)
    .lte("expected_return_at", in30min)
    .select("id, public_token, expected_return_at, person_id, people(public_token), dogs(name)")

  if (error) return new Response(error.message, { status: 500 })

  for (const walk of walks ?? []) {
    const personToken = walk.people?.public_token
    if (!personToken) continue

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("person_public_token", personToken)

    const payload = JSON.stringify({
      title: `🐕 Hora de regressar com ${walk.dogs?.name ?? "o cão"}!`,
      body: "Faltam 30 minutos para o prazo. Toque para registar o regresso.",
      url: `/walk/${walk.id}?token=${walk.public_token}`,
    })

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id)
        }
      }
    }
  }

  return new Response("ok")
})


// ── Helper ───────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
