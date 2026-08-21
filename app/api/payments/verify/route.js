import { NextResponse } from 'next/server'
import { connectDb } from '@/lib/db'
import { Order } from '@/lib/models'
import { requireUser } from '@/lib/auth'
import * as razorpay from '@/lib/payments/razorpay'
import * as stripe from '@/lib/payments/stripe'
import { markOrderPaid } from '@/lib/payments'

// The frontend can never declare an order paid on its own — every claim is
// verified here against the gateway before the order is marked paid.
export async function POST(request) {
  try {
    const user = await requireUser()
    const conn = await connectDb()
    if (!conn) {
      return NextResponse.json({ error: 'Database not reachable. Please try again.' }, { status: 503 })
    }

    const body = await request.json()
    const gateway = String(body.gateway || '')
    const orderId = String(body.orderId || '').trim().toUpperCase()
    if (!orderId || !['razorpay', 'stripe'].includes(gateway)) {
      return NextResponse.json({ error: 'Invalid payment verification request' }, { status: 400 })
    }

    // Ownership enforced in the query — a user can only pay for their own order
    const query = { orderId }
    if (user.role !== 'host') {
      query.$or = [
        ...(user.id ? [{ userId: user.id }] : []),
        { customerEmail: (user.email || '').toLowerCase() },
      ]
    }
    const order = await Order.findOne(query)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Idempotency: already paid orders just report success
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ ok: true, alreadyPaid: true })
    }

    if (gateway === 'razorpay') {
      if (order.paymentMethod !== 'razorpay') {
        return NextResponse.json({ error: 'This order was not set up for Razorpay' }, { status: 400 })
      }
      const rpOrderId = String(body.razorpay_order_id || '')
      const rpPaymentId = String(body.razorpay_payment_id || '')
      const signature = String(body.razorpay_signature || '')
      if (!rpOrderId || !rpPaymentId || !signature) {
        return NextResponse.json({ error: 'Incomplete payment details' }, { status: 400 })
      }
      if (order.payment.refId && rpOrderId !== order.payment.refId) {
        return NextResponse.json({ error: 'Payment does not belong to this order' }, { status: 400 })
      }
      const result = await razorpay.verifyPayment({
        razorpayOrderId: rpOrderId,
        paymentId: rpPaymentId,
        signature,
      })
      if (!result.ok) {
        order.paymentStatus = 'failed'
        await order.save()
        return NextResponse.json(
          { error: 'We could not verify your payment with the bank. If money was deducted it will auto-refund.' },
          { status: 400 }
        )
      }
      markOrderPaid(order, {
        provider: 'razorpay',
        refId: rpOrderId,
        paymentId: rpPaymentId,
      })
      await order.save()
      return NextResponse.json({ ok: true })
    }

    // ── Stripe ────────────────────────────────────────────────
    if (order.paymentMethod !== 'stripe') {
      return NextResponse.json({ error: 'This order was not set up for Stripe' }, { status: 400 })
    }
    const sessionId = String(body.sessionId || '')
    if (!sessionId || (order.payment.refId && sessionId !== order.payment.refId)) {
      return NextResponse.json({ error: 'Invalid checkout session' }, { status: 400 })
    }
    const result = await stripe.confirmSession(sessionId)
    if (!result.ok) {
      if (result.reason === 'unpaid' || result.reason === 'no_payment_required') {
        // Not paid yet — keep waiting (webhook may still land later)
        return NextResponse.json(
          { ok: false, pending: true, message: 'Your payment is still being processed.' },
          { status: 202 }
        )
      }
      return NextResponse.json(
        { error: 'We could not verify this payment with Stripe.' },
        { status: 400 }
      )
    }
    markOrderPaid(order, {
      provider: 'stripe',
      refId: sessionId,
      paymentId: result.paymentId || '',
    })
    await order.save()
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err.status === 401) {
      return NextResponse.json({ error: err.message, code: 'auth_required' }, { status: 401 })
    }
    console.error('payment verify failed:', err.message)
    return NextResponse.json({ error: 'Payment verification failed. Please contact support if money was deducted.' }, { status: 500 })
  }
}
