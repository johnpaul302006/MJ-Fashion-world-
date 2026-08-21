'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { inr, shortDate } from '@/lib/format'
import { getStatusMeta } from '@/lib/categories'
import { fallbackImg } from '@/lib/img-fallback'
import { imgUrl } from '@/lib/img-url'
import { useAuth } from '@/components/auth/AuthProvider'

/* ─── Status stepper (pending → confirmed → shipped → delivered) ─── */
const STEPS = ['pending', 'confirmed', 'shipped', 'delivered']

function StatusStepper({ status }) {
  const idx = STEPS.indexOf(status)
  const rejected = status === 'rejected'
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const done = !rejected && i <= idx
        return (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              rejected ? 'bg-red-200 dark:bg-red-900' : done ? 'bg-brand' : 'bg-gray-100 dark:bg-[#2a2a2a]'
            }`}
          />
        )
      })}
    </div>
  )
}

function StepLabels({ status }) {
  if (status === 'rejected') {
    return (
      <p className="mt-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs rounded-sm px-3 py-2">
        This order was rejected by the store. If you paid online or via UPI, contact support for a refund.
      </p>
    )
  }
  return (
    <div className="flex justify-between mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
      <span>Placed</span><span>Confirmed</span><span>Shipped</span><span>Delivered</span>
    </div>
  )
}

function PaymentBadge({ o }) {
  const label = { upi: 'UPI', cod: 'COD', razorpay: 'Razorpay', stripe: 'Stripe' }[o.paymentMethod] || o.paymentMethod
  const paid = o.paymentStatus === 'paid'
  const failed = o.paymentStatus === 'failed'
  return (
    <span
      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
        paid
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
          : failed
            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
      }`}
    >
      {label} · {paid ? 'Paid' : failed ? 'Failed' : o.paymentMethod === 'cod' ? 'Pay on delivery' : 'Pending'}
    </span>
  )
}

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [order, setOrder] = useState(null)
  const [state, setState] = useState('loading') // loading | ok | notfound | error
  const [banner, setBanner] = useState('') // placed | paid | processing | unverified
  const [verifying, setVerifying] = useState(false)
  const ranRef = useRef(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?orderId=${encodeURIComponent(String(orderId || ''))}`)
      const data = await res.json()
      if (res.ok && data.orders?.length > 0) {
        setOrder(data.orders[0])
        setState('ok')
      } else {
        setState('notfound')
      }
    } catch {
      setState('error')
    }
  }, [orderId])

  // Initial load + Stripe redirect-back verification
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/order/${orderId}`)}`)
      return
    }
    if (ranRef.current) return
    ranRef.current = true
    load()

    let sessionId = ''
    const timers = []
    timers.push(
      setTimeout(() => {
        try {
          const params = new URLSearchParams(window.location.search)
          if (params.get('placed') === '1') setBanner('placed')
          else if (params.get('paid') === '1') setBanner('paid')
        } catch {}
      }, 0)
    )
    try {
      sessionId = new URLSearchParams(window.location.search).get('session_id') || ''
      if (sessionId) {
        // Stripe redirect-back — confirm the session with the backend, then
        // refresh the order so the paid status shows immediately.
        timers.push(
          setTimeout(() => {
            setVerifying(true)
            fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gateway: 'stripe', orderId, sessionId }),
            })
              .then(async (r) => {
                const d = await r.json().catch(() => ({}))
                if (r.ok && d.ok) {
                  setBanner('paid')
                  await load()
                } else if (d.pending) {
                  setBanner('processing')
                } else {
                  setBanner('unverified')
                }
              })
              .catch(() => setBanner('unverified'))
              .finally(() => {
                setVerifying(false)
                // Clean the URL so refresh doesn't re-verify
                window.history.replaceState({}, '', `/order/${orderId}`)
              })
          }, 0)
        )
      } else {
        window.history.replaceState({}, '', `/order/${orderId}`)
      }
    } catch {}
    return () => timers.forEach(clearTimeout)
  }, [authLoading, user, orderId, load, router])

  /* ── Loading / gates ───────────────────────────── */
  if (authLoading || (state === 'loading' && !banner)) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-gray-400 font-medium tracking-widest uppercase">
          <div className={`w-6 h-6 border-2 border-gray-200 rounded-full animate-spin ${verifying ? 'border-t-brand' : ''}`} />
          {verifying ? 'Confirming your payment…' : 'Loading your order…'}
        </div>
      </div>
    )
  }

  if (state !== 'ok' || !order) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0f0f] flex items-center justify-center px-4">
        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm p-12 max-w-md w-full text-center shadow-sm">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">Order not found</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This order doesn&apos;t exist or doesn&apos;t belong to your account.
            {state === 'error' ? ' (Connection problem — try refreshing.)' : ''}
          </p>
          <Link
            href="/orders"
            className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3 text-sm tracking-wider uppercase transition-colors"
          >
            Track an Order
          </Link>
        </div>
      </div>
    )
  }

  const sm = getStatusMeta(order.status)
  const itemCount = order.items.reduce((n, i) => n + i.qty, 0)
  const preCouponTotal = order.amount - (order.deliveryFee ?? 0) + (order.discountAmount || 0)

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0f0f] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* ── Result banners ─────────────────────────── */}
        {(banner === 'placed' || banner === 'paid') && (
          <div
            className={`mb-6 border p-5 rounded-sm ${
              banner === 'paid'
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/40'
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40'
            }`}
          >
            <p className="font-black text-lg text-gray-900 dark:text-white mb-1">
              {banner === 'paid' ? '🎉 Payment successful!' : '✅ Order placed!'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {banner === 'paid'
                ? 'Your payment has been verified and your order is confirmed.'
                : order.paymentMethod === 'cod'
                  ? 'We will call you shortly to confirm your Cash on Delivery order.'
                  : 'Your UPI transfer will be verified by the store shortly, after which your order ships.'}
            </p>
          </div>
        )}
        {banner === 'processing' && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-5 rounded-sm">
            <p className="font-bold text-gray-900 dark:text-white">Payment is still processing…</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              This usually settles within a few minutes — refresh this page to check again.
            </p>
          </div>
        )}
        {banner === 'unverified' && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 p-5 rounded-sm">
            <p className="font-bold text-gray-900 dark:text-white">We couldn&apos;t verify this payment yet</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              If money was deducted it usually settles automatically. Contact support with your Order ID if it stays unpaid.
            </p>
          </div>
        )}

        {/* ── Header card ────────────────────────────── */}
        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm overflow-hidden shadow-sm">
          <div className="px-5 sm:px-7 py-5 border-b border-gray-50 dark:border-[#222]">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Order</p>
                <p className="text-xl font-black text-gray-900 dark:text-white font-mono">{order.orderId}</p>
                <p className="text-xs text-gray-400 mt-1">Placed {shortDate(order.createdAt)} · {itemCount} item(s)</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${sm.color}`}>{sm.label}</span>
                <PaymentBadge o={order} />
              </div>
            </div>
            <div className="mt-5">
              <StatusStepper status={order.status} />
              <StepLabels status={order.status} />
            </div>
          </div>

          {/* ── Items ──────────────────────────────────── */}
          <div className="divide-y divide-gray-50 dark:divide-[#222]">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex gap-4 px-5 sm:px-7 py-4">
                <div
                  className="shrink-0 w-16 rounded-sm overflow-hidden bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222]"
                  style={{ aspectRatio: '3/4' }}
                >
                  {i.image ? (
                    <img src={imgUrl(i.image)} alt={i.name} onError={fallbackImg} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">{i.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Size {i.size} · Qty {i.qty} · {inr(i.price)} each
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black text-gray-900 dark:text-white">{inr(i.price * i.qty)}</p>
              </div>
            ))}
          </div>

          {/* ── Bill summary ───────────────────────────── */}
          <div className="px-5 sm:px-7 py-4 bg-gray-50/60 dark:bg-[#161616] space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Subtotal</span><span>{inr(preCouponTotal)}</span>
            </div>
            {!!order.deliveryFee && (
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Delivery</span><span>{inr(order.deliveryFee)}</span>
              </div>
            )}
            {!order.deliveryFee && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Delivery</span><span>FREE</span>
              </div>
            )}
            {!!order.couponCode && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Coupon {order.couponCode} ({order.couponDiscount}% off)</span>
                <span>− {inr(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 dark:text-white pt-1.5 border-t border-gray-100 dark:border-[#222]">
              <span>{order.paymentStatus === 'paid' ? 'Total Paid' : order.paymentMethod === 'cod' ? 'Payable on Delivery' : 'Total'}</span>
              <span>{inr(order.amount)}</span>
            </div>
            {order.originalAmount > order.amount ? (
              <p className="text-xs text-green-600 text-right">You saved {inr(order.originalAmount - order.amount)} on this order 🎉</p>
            ) : null}
          </div>

          {/* ── Delivery address ───────────────────────── */}
          <div className="px-5 sm:px-7 py-4 border-t border-gray-50 dark:border-[#222]">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Delivery Address</p>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
              <b>{order.customer.name}</b> · {order.customer.phone}
              <br />
              {order.customer.address}
              <br />
              {[order.customer.city, order.customer.state].filter(Boolean).join(', ')}
              {order.customer.pincode ? ` — ${order.customer.pincode}` : ''}
              <br />
              {order.customer.country}
            </p>
          </div>

          {/* ── Payment + Tracking ─────────────────────── */}
          <div className="px-5 sm:px-7 py-4 border-t border-gray-50 dark:border-[#222] grid sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Payment</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 capitalize">
                {{ upi: 'Direct UPI transfer', cod: 'Cash on Delivery', razorpay: 'Razorpay', stripe: 'Stripe' }[order.paymentMethod] || order.paymentMethod}
                {order.utr ? <span className="block text-xs text-gray-400 mt-1 font-mono break-all">UTR: {order.utr}</span> : null}
                {order.payment?.provider && !['upi-manual', 'cod'].includes(order.payment.provider) ? (
                  <span className="block text-xs text-gray-400 mt-1 capitalize">via {order.payment.provider}</span>
                ) : null}
                {order.payment?.paidAt ? (
                  <span className="block text-xs text-green-600 mt-1">Paid on {shortDate(order.payment.paidAt)}</span>
                ) : null}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Tracking</p>
              {order.tracking && (order.tracking.number || order.tracking.courier) ? (
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {order.tracking.courier || 'Courier'}
                  {order.tracking.number ? (
                    <>
                      <br />AWB: <b className="font-mono">{order.tracking.number}</b>
                    </>
                  ) : null}
                  {order.tracking.eta ? <span className="block text-xs text-gray-400 mt-1">ETA: {order.tracking.eta}</span> : null}
                  {order.tracking.url ? (
                    <a
                      href={order.tracking.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 text-xs font-semibold text-brand hover:underline"
                    >
                      Track package ↗
                    </a>
                  ) : null}
                </p>
              ) : (
                <p className="text-sm text-gray-400">Tracking details appear here once the order ships.</p>
              )}
            </div>
          </div>

          {/* ── Store note ─────────────────────────────── */}
          {order.note ? (
            <div className="px-5 sm:px-7 py-4 border-t border-gray-50 dark:border-[#222]">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Note from store</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{order.note}</p>
            </div>
          ) : null}
        </div>

        {/* ── Actions ────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            href="/orders"
            className="border-2 border-gray-200 dark:border-[#333] hover:border-brand hover:text-brand text-gray-700 dark:text-gray-200 font-bold px-8 py-3 text-sm tracking-wider uppercase transition-colors"
          >
            Track Orders
          </Link>
          <Link
            href="/shop"
            className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3 text-sm tracking-wider uppercase transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
