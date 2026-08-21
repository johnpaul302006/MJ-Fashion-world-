// Shipping abstraction — Big Pickle never delivers itself; shipments are
// created through external courier providers. Providers are selected via
// the SHIPPING_PROVIDER environment variable:
//   'shiprocket' | 'amazon-shipping' | '' (manual tracking only)
import * as shiprocket from './shiprocket'
import * as amazonShipping from './amazon-shipping'

const PROVIDERS = {
  shiprocket,
  'amazon-shipping': amazonShipping,
}

export function activeProviderName() {
  const name = String(process.env.SHIPPING_PROVIDER || '').trim()
  return PROVIDERS[name] ? name : ''
}

export function getProvider() {
  const name = activeProviderName()
  return name ? PROVIDERS[name] : null
}

// Creates a shipment for an Order through the configured provider.
// Writes the result into the order's shipment/tracking fields.
export async function createShipmentForOrder(order) {
  const provider = getProvider()
  if (!provider) {
    throw new Error('No shipping provider configured (set SHIPPING_PROVIDER)')
  }
  if (!order.shipment?.refId) {
    const result = await provider.createShipment({
      orderId: order.orderId,
      paymentMode: order.paymentMethod === 'cod' ? 'cod' : 'prepaid',
      amount: Number(order.amount),
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.customer.address,
        city: order.customer.city,
        state: order.customer.state,
        pincode: order.customer.pincode,
        country: order.customer.country || 'India',
      },
      items: order.items.map((i) => ({
        name: i.name,
        sku: String(i.productId || i.name),
        qty: i.qty,
        price: i.price,
        size: i.size,
      })),
    })
    order.shipment = {
      ...(order.shipment || {}),
      provider: activeProviderName(),
      refId: result.refId || '',
      awb: result.awb || '',
      courier: result.courier || '',
      status: result.status || 'created',
      labelUrl: result.labelUrl || '',
      trackingUrl: result.trackingUrl || '',
      createdAt: new Date(),
    }
    if (result.awb && !order.tracking.number) order.tracking.number = result.awb
    if (result.courier && !order.tracking.courier) order.tracking.courier = result.courier
    if (result.trackingUrl && !order.tracking.url) order.tracking.url = result.trackingUrl
    order.tracking.updatedAt = new Date()
  }
  return order.shipment
}

// Pulls the latest delivery status for an order's existing shipment.
export async function refreshTrackingForOrder(order) {
  const provider = getProvider()
  const awb = order.shipment?.awb
  if (!provider || !awb) return null
  const status = await provider.track(awb)
  if (status && status.status) {
    order.shipment.status = status.status
    order.tracking.updatedAt = new Date()
  }
  return status
}
