import { NextResponse } from 'next/server'
import { connectDb } from '@/lib/db'
import { Order } from '@/lib/models'
import * as stripe from '@/lib/payments/stripe'
import * as razorpay from '@/lib/payments/razorpay'
import { markOrderPaid } from '@/lib/payments'

// Optional webhook endpoints for extra reliability. The primary source of
// truth is /api/payments/verify, but gateways may also notify us here.
export async function POST(request) {
  let rawBody = ''
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const url = new URL(request.url)
  const provider = url.searchParams.get('provider')

  try {
    if (provider === 'stripe') {
      const signature = request.headers.get('stripe-signature') || ''
      if (!stripe.verifyWebhook(rawBody, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
      const event = JSON.parse(rawBody)
      if (event.type === 'checkout.session.completed') {
        const session = event.data?.object
        const ourOrderId = session?.metadata?.ourOrderId || session?.client_reference_id
        if (session?.payment_status === 'paid' && ourOrderId) {
          await settle(ourOrderId, 'stripe', session.id, session.payment_intent || '')
        }
      }
      return NextResponse.json({ received: true })
    }

    if (provider === 'razorpay') {
      const signature = request.headers.get('x-razorpay-signature') || ''
      if (!razorpay.verifyWebhook(rawBody, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
      const event = JSON.parse(rawBody)
      if (
        event.event === 'payment.captured' &&
        event.payload?.payment?.entity?.order_id
      ) {
        const entity = event.payload.payment.entity
        await settle(
          entity.notes?.ourOrderId || '',
          'razorpay',
          entity.order_id,
          entity.id || ''
        )
      }
      return NextResponse.json({ received: true })
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  } catch (err) {
    console.error('webhook error:', err.message)
    // Never leak internals to the gateway — acknowledge anyway to stop retries
    return NextResponse.json({ received: true })
  }
}

// Idempotent settlement shared by both providers
async function settle(orderId, provider, refId, paymentId) {
  if (!orderId) return false
  if (!(await connectDb())) return false
  const order = await Order.findOne({ orderId: orderId.toUpperCase() })
  if (!order || order.paymentStatus === 'paid') return true
  if (order.payment.refId && refId && order.payment.refId !== refId) return false
  markOrderPaid(order, { provider, refId, paymentId })
  await order.save()
  return true
}
