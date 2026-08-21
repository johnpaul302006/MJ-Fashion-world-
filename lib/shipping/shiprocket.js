// Shiprocket adapter — REST API v1 (apiv2.shiprocket.in).
// Credentials: SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD (+ optional SHIPROCKET_PICKUP_LOCATION)
const API = 'https://apiv2.shiprocket.in/v1/external'

export function isConfigured() {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD)
}

let tokenCache = { token: null, expiresAt: 0 }

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.token) throw new Error(data.message || 'Shiprocket login failed')
  // Shiprocket tokens are valid for 10 days; cache for 7 to be safe
  tokenCache = { token: data.token, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }
  return tokenCache.token
}

async function call(path, options = {}, retries = 1) {
  const token = await getToken()
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && retries > 0) {
    tokenCache = { token: null, expiresAt: 0 }
    return call(path, options, retries - 1)
  }
  if (!res.ok) {
    const detail =
      typeof data?.errors === 'object' ? JSON.stringify(data.errors).slice(0, 300) : data?.message
    throw new Error(detail || `Shiprocket request failed (${res.status})`)
  }
  return data
}

// Creates an adhoc shipment order and best-effort assigns an AWB.
export async function createShipment({ orderId, paymentMode, amount, customer, items }) {
  const payload = {
    order_id: orderId,
    order_date: new Date().toISOString().slice(0, 10),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
    billing_customer_name: customer.name,
    billing_last_name: '',
    billing_address: customer.address.slice(0, 250),
    billing_city: customer.city,
    billing_pincode: customer.pincode,
    billing_state: customer.state,
    billing_country: customer.country || 'India',
    billing_email: '',
    billing_phone: customer.phone,
    shipping_is_billing: true,
    order_items: items.map((i) => ({
      name: i.name.slice(0, 100),
      sku: i.sku.slice(0, 90),
      units: i.qty,
      selling_price: i.price,
    })),
    payment_method: paymentMode === 'cod' ? 'COD' : 'Prepaid',
    sub_total: Math.round(amount),
    length: 25, // default parcel dimensions (cm) — configurable later per product
    breadth: 20,
    height: 5,
    weight: 0.5,
  }
  const created = await call('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const result = {
    refId: String(created.order_id || ''),
    awb: created.awb_code || '',
    courier: created.courier_name || '',
    status: created.status || 'created',
    labelUrl: created.label_url || '',
    trackingUrl: '',
    shipmentId: created.shipment_id || '',
  }

  // AWB is often assigned in a second step — try once, non-fatal on failure
  if (!result.awb && result.shipmentId) {
    try {
      const awbRes = await call('/courier/assign/awb', {
        method: 'POST',
        body: JSON.stringify({ shipment_id: result.shipmentId }),
      })
      result.awb = awbRes.response?.data?.awb_code || awbRes.awb_code || ''
      result.courier = awbRes.response?.data?.courier_name || result.courier
      if (awbRes.response?.data?.label_url) result.labelUrl = awbRes.response.data.label_url
    } catch {
      // Admin can assign a courier from the Shiprocket dashboard later
    }
  }
  if (result.awb) {
    result.trackingUrl = `https://shiprocket.co/tracking/${result.awb}`
  }
  return result
}

// Latest tracking status for an AWB
export async function track(awb) {
  const data = await call(`/courier/track/awb/${encodeURIComponent(awb)}`)
  const scan = Array.isArray(data?.tracking_data?.shipment_track_activities)
    ? data.tracking_data.shipment_track_activities[0]
    : null
  return {
    status: scan?.['activity'] || data?.tracking_data?.shipment_status || '',
    location: scan?.location || '',
    raw: data,
  }
}
