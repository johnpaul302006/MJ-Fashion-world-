'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { inr, shortDate, getReturnEligibility } from '@/lib/format'
import { getStatusMeta } from '@/lib/categories'
import { fallbackImg } from '@/lib/img-fallback'
import { imgUrl } from '@/lib/img-url'
import { useAuth } from '@/components/auth/AuthProvider'
import OrderTrackingTimeline from '@/components/OrderTrackingTimeline'
import ReturnExchangeModal from '@/components/ReturnExchangeModal'

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
  const [returnRequests, setReturnRequests] = useState([])
  const [state, setState] = useState('loading') // loading | ok | notfound | error
  const [banner, setBanner] = useState('') // placed | paid | processing | unverified
  const [verifying, setVerifying] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null) // Product details modal
  const [returnModalProduct, setReturnModalProduct] = useState(null) // Return modal

  const ranRef = useRef(false)

  const load = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`/api/orders?orderId=${encodeURIComponent(String(orderId || ''))}`)
      const data = await res.json()
      if (res.ok && data.orders?.length > 0) {
        setOrder(data.orders[0])
        if (!silent) setState('ok')
      } else {
        if (!silent) setState('notfound')
      }
    } catch {
      if (!silent) setState('error')
    }
  }, [orderId])

  const loadReturns = useCallback(async () => {
    try {
      const res = await fetch(`/api/returns?orderId=${encodeURIComponent(String(orderId || ''))}`)
      const data = await res.json()
      if (res.ok && Array.isArray(data.requests)) {
        setReturnRequests(data.requests)
      }
    } catch {
      // Returns fetch error is non-blocking
    }
  }, [orderId])

  // Initial load + Stripe redirect-back verification + live refresh
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/order/${orderId}`)}`)
      return
    }
    if (ranRef.current) return
    ranRef.current = true
    load()
    loadReturns()

    // Real-time polling every 10s so host changes appear instantly
    const interval = setInterval(() => {
      load(true)
      loadReturns()
    }, 10000)

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
                window.history.replaceState({}, '', `/order/${orderId}`)
              })
          }, 0)
        )
      } else {
        window.history.replaceState({}, '', `/order/${orderId}`)
      }
    } catch {}

    return () => {
      clearInterval(interval)
      timers.forEach(clearTimeout)
    }
  }, [authLoading, user, orderId, load, loadReturns, router])

  /* ── Loading / gates ───────────────────────────── */
  if (authLoading || (state === 'loading' && !banner)) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-neutral-400 font-medium tracking-widest uppercase">
          <div className={`w-6 h-6 border-2 border-neutral-700 rounded-full animate-spin ${verifying ? 'border-t-[#cc0000]' : ''}`} />
          {verifying ? 'Confirming your payment…' : 'Loading your order…'}
        </div>
      </div>
    )
  }

  if (state !== 'ok' || !order) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-xl font-black text-white mb-2">Order not found</h1>
          <p className="text-sm text-neutral-400 mb-6">
            This order doesn&apos;t exist or doesn&apos;t belong to your account.
            {state === 'error' ? ' (Connection problem — try refreshing.)' : ''}
          </p>
          <Link
            href="/orders"
            className="inline-block bg-[#cc0000] hover:bg-[#b30000] text-white font-bold px-8 py-3 rounded-xl text-xs tracking-wider uppercase transition"
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

  // 7-day return eligibility evaluation
  const isDelivered = order.status === 'delivered'
  const deliveryTime = order.deliveredAt || order.statusTimestamps?.delivered
  const { isWithinWindow, returnDaysRemaining } = isDelivered
    ? getReturnEligibility(deliveryTime)
    : { isWithinWindow: true, returnDaysRemaining: 7 }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">

        {/* ── Breadcrumb ─────────────────────────────── */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span>/</span>
          <Link href="/orders" className="hover:text-white transition">My Orders</Link>
          <span>/</span>
          <span className="text-white font-bold">#{order.orderId}</span>
        </nav>

        {/* ── Result banners ─────────────────────────── */}
        {(banner === 'placed' || banner === 'paid') && (
          <div
            className={`border p-5 rounded-2xl ${
              banner === 'paid'
                ? 'bg-green-950/40 border-green-800 text-green-300'
                : 'bg-blue-950/40 border-blue-800 text-blue-300'
            }`}
          >
            <p className="font-black text-lg text-white mb-1">
              {banner === 'paid' ? '🎉 Payment successful!' : '✅ Order placed!'}
            </p>
            <p className="text-sm text-neutral-300">
              {banner === 'paid'
                ? 'Your payment has been verified and your order is confirmed.'
                : order.paymentMethod === 'cod'
                  ? 'We will call you shortly to confirm your Cash on Delivery order.'
                  : 'Your UPI transfer will be verified by the store shortly, after which your order ships.'}
            </p>
          </div>
        )}
        {banner === 'processing' && (
          <div className="bg-amber-950/40 border border-amber-800 p-5 rounded-2xl text-amber-300">
            <p className="font-bold text-white">Payment is still processing…</p>
            <p className="text-sm text-neutral-300 mt-1">
              This usually settles within a few minutes — refresh this page to check again.
            </p>
          </div>
        )}
        {banner === 'unverified' && (
          <div className="bg-red-950/40 border border-red-800 p-5 rounded-2xl text-red-300">
            <p className="font-bold text-white">We couldn&apos;t verify this payment yet</p>
            <p className="text-sm text-neutral-300 mt-1">
              If money was deducted it usually settles automatically. Contact support with your Order ID if it stays unpaid.
            </p>
          </div>
        )}

        {/* ── Order Header Card ───────────────────────── */}
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-4 pb-5 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold text-neutral-400">Order</span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono">#{order.orderId}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Placed {shortDate(order.createdAt)} · {itemCount} item{itemCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${sm.color}`}>
                {sm.label}
              </span>
              <PaymentBadge o={order} />
            </div>
          </div>

          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-neutral-500 block">Payment Method</span>
              <span className="font-semibold text-white capitalize">{order.paymentMethod}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Total Amount</span>
              <span className="font-bold text-white">{inr(order.amount)}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Delivery To</span>
              <span className="font-semibold text-white truncate block">{order.customer?.city || 'India'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Return Window</span>
              <span className={`font-semibold ${isDelivered && isWithinWindow ? 'text-emerald-400' : 'text-neutral-400'}`}>
                {isDelivered
                  ? isWithinWindow
                    ? `${returnDaysRemaining} day${returnDaysRemaining !== 1 ? 's' : ''} left`
                    : 'Window closed'
                  : 'Active after delivery'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 1. Animated Tracking Timeline ───────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
              Live Shipment Tracking
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Sync
            </span>
          </div>
          <OrderTrackingTimeline order={order} />
        </div>

        {/* ── 2. Items & Return/Exchange Options ───────── */}
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              Order Items ({order.items.length})
            </h3>
            <span className="text-xs text-neutral-400">
              Click any product to view details
            </span>
          </div>

          <div className="divide-y divide-neutral-800/80">
            {order.items.map((item, idx) => {
              // Check if a return/exchange request exists for this product
              const activeReq = returnRequests.find((r) => r.product?.name === item.name)

              return (
                <div
                  key={idx}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-900/40 transition"
                >
                  <div
                    onClick={() => setSelectedProduct(item)}
                    className="flex gap-4 cursor-pointer group flex-1 min-w-0"
                  >
                    <div
                      className="shrink-0 w-16 sm:w-20 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 relative"
                      style={{ aspectRatio: '3/4' }}
                    >
                      {item.image ? (
                        <img
                          src={imgUrl(item.image)}
                          alt={item.name}
                          onError={fallbackImg}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#cc0000] transition line-clamp-2">
                        {item.name}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        Size: <b className="text-neutral-200">{item.size || 'Standard'}</b> · Qty: <b className="text-neutral-200">{item.qty}</b>
                      </p>
                      <p className="text-sm font-black text-white mt-2">
                        {inr(item.price * item.qty)}
                        {item.qty > 1 && (
                          <span className="text-[11px] font-normal text-neutral-400 ml-1.5">
                            ({inr(item.price)} each)
                          </span>
                        )}
                      </p>

                      {/* Active Return Status Badge on Item */}
                      {activeReq && (
                        <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border bg-neutral-900 border-neutral-700">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              activeReq.status === 'pending'
                                ? 'bg-amber-400 animate-pulse'
                                : activeReq.status === 'accepted'
                                ? 'bg-emerald-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          <span className="capitalize text-white">
                            {activeReq.type} {activeReq.status}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            ({activeReq.requestId})
                          </span>
                        </div>
                      )}

                      {/* Host Note if decision is made */}
                      {activeReq?.hostNote && (
                        <p className="mt-1.5 text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                          <span className="font-semibold text-white">Seller Instructions: </span>
                          {activeReq.hostNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(item)}
                      className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      View Details
                    </button>

                    {/* Return / Exchange Button with 7-Day Logic */}
                    {!activeReq ? (
                      isDelivered ? (
                        isWithinWindow ? (
                          <button
                            type="button"
                            onClick={() => setReturnModalProduct(item)}
                            className="px-3.5 py-2 rounded-lg border border-[#cc0000] text-[#cc0000] hover:bg-[#cc0000] hover:text-white text-xs font-bold transition cursor-pointer"
                          >
                            Return / Exchange
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            title="The 7-day return and exchange policy window has expired for this order."
                            className="px-3.5 py-2 rounded-lg border border-neutral-800 text-neutral-600 text-xs font-medium cursor-not-allowed"
                          >
                            Return Expired
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Returns and Exchanges become active after your item is delivered."
                          className="px-3.5 py-2 rounded-lg border border-neutral-800 text-neutral-600 text-xs font-medium cursor-not-allowed"
                        >
                          Return (After Delivery)
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Bill summary ───────────────────────────── */}
          <div className="px-6 py-5 bg-neutral-950/70 border-t border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span className="text-white font-mono">{inr(preCouponTotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Delivery Fee</span>
              <span className={order.deliveryFee ? 'text-white font-mono' : 'text-emerald-400 font-semibold'}>
                {order.deliveryFee ? inr(order.deliveryFee) : 'FREE'}
              </span>
            </div>
            {!!order.couponCode && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Coupon {order.couponCode} ({order.couponDiscount}% off)</span>
                <span>− {inr(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-white pt-2 border-t border-neutral-800">
              <span>{order.paymentStatus === 'paid' ? 'Total Paid' : order.paymentMethod === 'cod' ? 'Payable on Delivery' : 'Total Payable'}</span>
              <span className="text-[#cc0000] text-base">{inr(order.amount)}</span>
            </div>
          </div>
        </div>

        {/* ── Delivery address ───────────────────────── */}
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
            Delivery Destination
          </h4>
          <p className="text-sm text-neutral-200 leading-relaxed">
            <b className="text-white">{order.customer.name}</b> · <span className="font-mono text-neutral-400">{order.customer.phone}</span>
            <br />
            {order.customer.address}
            <br />
            {[order.customer.city, order.customer.state].filter(Boolean).join(', ')}
            {order.customer.pincode ? ` — ${order.customer.pincode}` : ''}
          </p>
        </div>

        {/* ── Bottom action buttons ───────────────────── */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link
            href="/orders"
            className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider transition"
          >
            All Orders
          </Link>
          <Link
            href="/shop"
            className="px-6 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-bold uppercase tracking-wider transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* ── Product Details Modal ────────────────────── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-[#141414] border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  Order #{order.orderId}
                </span>
                <h3 className="text-base font-bold text-white">Product Item Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-4">
              <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                {selectedProduct.image ? (
                  <Image src={selectedProduct.image} alt={selectedProduct.name} fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">IMG</div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5 text-xs">
                <h4 className="text-sm font-bold text-white">{selectedProduct.name}</h4>
                <p className="text-neutral-400">Size: <b className="text-white">{selectedProduct.size || 'Standard'}</b></p>
                <p className="text-neutral-400">Quantity: <b className="text-white">{selectedProduct.qty}</b></p>
                <p className="text-neutral-400">Unit Price: <b className="text-white">{inr(selectedProduct.price)}</b></p>
                <p className="text-neutral-400">Item Total: <b className="text-[#cc0000]">{inr(selectedProduct.price * selectedProduct.qty)}</b></p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 space-y-1">
              <p>• Placed on: <b className="text-white">{shortDate(order.createdAt)}</b></p>
              <p>• Delivery Status: <b className="text-emerald-400 capitalize">{order.status}</b></p>
              {order.couponCode && (
                <p>• Applied Discount: <b className="text-green-400">{order.couponCode} ({order.couponDiscount}% OFF)</b></p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {isDelivered && isWithinWindow && (
                <button
                  type="button"
                  onClick={() => {
                    setReturnModalProduct(selectedProduct)
                    setSelectedProduct(null)
                  }}
                  className="px-4 py-2 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-bold transition cursor-pointer"
                >
                  Return or Exchange this item
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Return / Exchange Modal ──────────────────── */}
      {returnModalProduct && (
        <ReturnExchangeModal
          order={order}
          product={returnModalProduct}
          onClose={() => setReturnModalProduct(null)}
          onSuccess={() => {
            loadReturns()
          }}
        />
      )}
    </div>
  )
}
