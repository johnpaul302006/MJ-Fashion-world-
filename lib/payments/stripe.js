import crypto from 'node:crypto'

// Stripe integration over the REST API (no SDK dependency) using
// Stripe Checkout (hosted payment page). Credentials come exclusively
// from environment variables.
const API = 'https://api.stripe.com/v1'

export function isConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function publishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
}

function authHeader() {
  return `Bearer ${process.env.STRIPE_SECRET_KEY}`
}

function formEncode(params, prefix = '') {
  const parts = []
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    const fullKey = prefix ? `${prefix}[${key}]` : key
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (v && typeof v === 'object') parts.push(formEncode(v, `${fullKey}[${i}]`))
        else parts.push(`${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(String(v))}`)
      })
    } else if (typeof value === 'object') {
      parts.push(formEncode(value, fullKey))
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`)
    }
  }
  return parts.join('&')
}

// Creates a Stripe Checkout Session for the order's final payable amount.
export async function createPayment({ order, origin }) {
  if (!isConfigured()) throw new Error('Stripe is not configured')
  const amountPaise = Math.round(Number(order.amount) * 100)
  const summary =
    order.items.map((i) => i.name).join(', ').slice(0, 120) ||
    `${order.items.length} item(s)`

  const res = await fetch(`${API}/checkout/sessions`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formEncode({
      mode: 'payment',
      success_url: `${origin}/order/${order.orderId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=1&orderId=${order.orderId}`,
      client_reference_id: order.orderId,
      metadata: { ourOrderId: order.orderId },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'inr',
            unit_amount: amountPaise,
            product_data: { name: summary },
          },
        },
      ],
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message || 'Could not initialise Stripe payment')
  }
  return { provider: 'stripe', refId: data.id, url: data.url, amount: data.amount_total }
}

// Confirms a returned session server-side. The frontend can never fake this —
// the session is fetched from Stripe with the secret key.
export async function confirmSession(sessionId) {
  if (!isConfigured()) throw new Error('Stripe is not configured')
  const res = await fetch(
    `${API}/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: authHeader() } }
  )
  const data = await res.json()
  if (!res.ok || !data.id) {
    return { ok: false, reason: data.error?.message || 'session_lookup_failed' }
  }
  return {
    ok: data.payment_status === 'paid',
    reason: data.payment_status,
    orderId: data.metadata?.ourOrderId || data.client_reference_id || '',
    paymentId: data.payment_intent || '',
    amountTotal: data.amount_total,
  }
}

export function verifyWebhook(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const parts = String(signature).split(',').reduce((acc, part) => {
    const [k, v] = part.split('=')
    if (k === 't') acc.t = v
    if (k === 'v1') acc.signatures.push(v)
    return acc
  }, { t: '', signatures: [] })
  if (!parts.t || parts.signatures.length === 0) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${parts.t}.${rawBody}`)
    .digest('hex')
  return parts.signatures.some((sig) => {
    const a = Buffer.from(expected)
    const b = Buffer.from(sig)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  })
}
