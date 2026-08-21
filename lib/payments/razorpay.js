import crypto from 'node:crypto'

// Razorpay integration over the REST API (no SDK dependency).
// Credentials come exclusively from environment variables.
const API = 'https://api.razorpay.com/v1'

export function isConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

export function publicKeyId() {
  return process.env.RAZORPAY_KEY_ID || ''
}

function authHeader() {
  const creds = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64')
  return `Basic ${creds}`
}

// Creates a Razorpay order for the given payable amount (in rupees).
export async function createPayment({ order }) {
  if (!isConfigured()) throw new Error('Razorpay is not configured')
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify({
      amount: Math.round(Number(order.amount) * 100), // paise
      currency: 'INR',
      receipt: order.orderId,
      notes: { ourOrderId: order.orderId },
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) {
    throw new Error(data.error?.description || 'Could not initialise Razorpay payment')
  }
  return { provider: 'razorpay', refId: data.id, keyId: publicKeyId(), amount: data.amount }
}

// Verifies the checkout handler signature locally, then cross-checks the
// payment against Razorpay's API when possible before declaring it paid.
export async function verifyPayment({ razorpayOrderId, paymentId, signature }) {
  if (!isConfigured()) throw new Error('Razorpay is not configured')
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(String(signature || ''))
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'signature_mismatch' }
  }

  // Best-effort server-side confirmation straight from the gateway
  try {
    const res = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: authHeader() },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.status !== 'captured' && data.status !== 'authorized') {
        return { ok: false, reason: `payment_status_${data.status}` }
      }
      return { ok: true, payment: data }
    }
  } catch {
    // Signature already verified locally; treat gateway lookup as advisory
  }
  return { ok: true, payment: null }
}

export function verifyWebhook(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(String(signature))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
