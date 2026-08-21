// Amazon Shipping adapter (placeholder implementing the same provider
// interface as the Shiprocket adapter).
//
// The Amazon Shipping service is part of Amazon's Selling Partner API and
// requires Login-with-Amazon (LWA) OAuth + AWS SigV4 request signing with
// seller credentials. Once those credentials are provisioned, implement
// createShipment()/track() against:
//   POST /shipping/v2/shipments          (create shipment)
//   GET  /shipping/v2/shipments/{id}     (tracking status)
//
// Until then the adapter reports itself as unavailable so the admin UI can
// fall back to manual tracking or another configured provider.
export function isConfigured() {
  return Boolean(
    process.env.AMAZON_SHIPPING_CLIENT_ID &&
      process.env.AMAZON_SHIPPING_CLIENT_SECRET &&
      process.env.AMAZON_SHIPPING_REFRESH_TOKEN &&
      process.env.AMAZON_SELLING_PARTNER_ROLE_ARN
  )
}

export async function createShipment(/* { orderId, paymentMode, amount, customer, items } */) {
  if (!isConfigured()) {
    throw new Error(
      'Amazon Shipping is not configured — add LWA credentials or use another shipping provider'
    )
  }
  throw new Error('Amazon Shipping integration pending SP-API signing implementation')
}

export async function track(/* awb */) {
  if (!isConfigured()) {
    throw new Error('Amazon Shipping is not configured')
  }
  throw new Error('Amazon Shipping integration pending SP-API signing implementation')
}
