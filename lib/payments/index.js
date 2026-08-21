import * as razorpay from './razorpay'
import * as stripe from './stripe'

// Payment gateway registry. Checkout only offers methods whose
// credentials are present in the environment.
export const GATEWAYS = { razorpay, stripe }

export function availableGateways() {
  return {
    razorpay: razorpay.isConfigured(),
    stripe: stripe.isConfigured(),
  }
}

// Shared post-payment bookkeeping on our Order document
export function markOrderPaid(order, { provider, refId = '', paymentId = '' }) {
  order.paymentStatus = 'paid'
  order.payment.provider = provider
  order.payment.refId = refId
  order.payment.paymentId = paymentId
  order.payment.paidAt = new Date()
  if (order.status === 'pending') order.status = 'confirmed'
}
