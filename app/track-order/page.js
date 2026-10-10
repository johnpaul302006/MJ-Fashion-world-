'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/format'

const STATUS_CONFIG = {
  placed: { label: 'Order Placed', step: 1, icon: '✓', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  packed: { label: 'Packed', step: 2, icon: '✓', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  shipped: { label: 'Shipped', step: 3, icon: '📦', color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
  out_for_delivery: { label: 'Out for Delivery', step: 4, icon: '🚚', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  delivered: { label: 'Delivered', step: 5, icon: '✓', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', step: 0, icon: '✕', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  pending: { label: 'Order Placed', step: 1, icon: '✓', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
}

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchTarget, setSearchTarget] = useState('')
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  const runTracking = async (val) => {
    const raw = (val ?? query).trim()
    if (!raw) {
      setError('Please enter your mobile number or order number')
      return
    }

    setError('')
    setLoading(true)
    setSearched(true)
    setSearchTarget(raw)

    try {
      const res = await fetch(`/api/orders?q=${encodeURIComponent(raw)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to search for orders')
        setOrders([])
      } else {
        setOrders(Array.isArray(data.orders) ? data.orders : [])
      }
    } catch {
      setError('Unable to track orders. Please check your connection and try again.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Prefill from query param if available
  useEffect(() => {
    const q = (searchParams.get('q') || searchParams.get('phone') || searchParams.get('orderId') || '').trim()
    if (!q) return

    let active = true
    const timer = setTimeout(async () => {
      setQuery(q)
      setLoading(true)
      setSearched(true)
      setSearchTarget(q)
      setError('')

      try {
        const res = await fetch(`/api/orders?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (!active) return
        if (!res.ok) {
          setError(data.error || 'Failed to search for orders')
          setOrders([])
        } else {
          setOrders(Array.isArray(data.orders) ? data.orders : [])
        }
      } catch {
        if (active) {
          setError('Unable to track orders. Please check your connection and try again.')
          setOrders([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }, 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchParams])

  const handleSubmit = (e) => {
    e.preventDefault()
    runTracking(query)
  }

  const handleReset = () => {
    setSearched(false)
    setSearchTarget('')
    setOrders([])
    setQuery('')
    setError('')
    router.replace('/track-order')
  }

  return (
    <div className="min-h-[80vh] px-4 py-8 sm:py-12 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6 font-mono">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <span className="text-white">Track Order</span>
      </nav>

      {/* Main Track Order Box */}
      <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6 sm:p-10 shadow-xl mb-8">
        <div className="max-w-xl mx-auto text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#cc0000]/10 border border-[#cc0000]/20 text-[#cc0000] mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1m-6 0a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Track Your Order
          </h1>
          <p className="text-sm text-neutral-400">
            Enter your registered phone number or order number.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Enter 10-digit number or Order ID"
                className="w-full h-12 px-4 rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-[#cc0000] focus:ring-1 focus:ring-[#cc0000] text-sm font-medium transition"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-6 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 shadow-lg shadow-[#cc0000]/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Tracking...</span>
                </>
              ) : (
                <span>Track Order</span>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-xs text-rose-400 text-center flex items-center justify-center gap-1.5">
              <span>⚠</span> {error}
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-neutral-500">
            <span>Examples:</span>
            <button
              type="button"
              onClick={() => { setQuery('9876543210'); runTracking('9876543210') }}
              className="underline hover:text-neutral-300 transition cursor-pointer"
            >
              9876543210
            </button>
            <span>•</span>
            <Link href="/orders" className="underline hover:text-neutral-300 transition">
              View All My Orders
            </Link>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {searched && !loading && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-400 font-mono">
                Tracking Lookup
              </p>
              <div className="flex flex-wrap items-baseline gap-3 mt-1">
                <span className="text-sm text-neutral-400">Number:</span>
                <span className="text-base font-bold text-white font-mono">{searchTarget}</span>
                <span className="text-neutral-600">|</span>
                <span className="text-sm text-neutral-400">Orders Found:</span>
                <span className="text-base font-bold text-[#cc0000]">
                  {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Track Another Order</span>
            </button>
          </div>

          {/* If No Orders Found */}
          {orders.length === 0 ? (
            <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 text-xl">
                🔍
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                No orders found for this number
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-6">
                We couldn&apos;t find any orders matching &ldquo;{searchTarget}&rdquo;. Make sure you entered the correct 10-digit mobile number or Order ID used during checkout.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Try Another Number
                </button>
                <Link
                  href="/shop"
                  className="px-5 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold transition"
                >
                  Start Shopping
                </Link>
              </div>
            </div>
          ) : (
            /* Orders List */
            <div className="space-y-4">
              {orders.map((order) => {
                const statusMeta = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed
                const primaryItem = order.items?.[0] || { name: 'Fashion Product', price: order.amount }
                const itemsCount = (order.items || []).reduce((acc, i) => acc + (i.qty || 1), 0)

                return (
                  <div
                    key={order.orderId || order._id}
                    className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 sm:p-6 transition hover:border-neutral-700 shadow-md"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 font-mono">Order</span>
                          <span className="text-base font-bold text-white font-mono">
                            #{order.orderId}
                          </span>
                        </div>
                        {order.createdAt && (
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusMeta.color}`}>
                        <span>{statusMeta.icon}</span>
                        <span>{statusMeta.label}</span>
                      </div>
                    </div>

                    {/* Product Preview */}
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                          {primaryItem.image ? (
                            <Image
                              src={primaryItem.image}
                              alt={primaryItem.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                              IMG
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white line-clamp-1">
                            {primaryItem.name}
                          </h4>
                          {itemsCount > 1 && (
                            <p className="text-xs text-neutral-400 mt-0.5">
                              +{itemsCount - 1} other item{itemsCount > 2 ? 's' : ''}
                            </p>
                          )}
                          <p className="text-sm font-bold text-white mt-1">
                            {formatPrice(order.amount)}
                          </p>
                          {order.customer?.city && (
                            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                              <span>📍</span> Delivering to {order.customer.city}
                              {order.customer.pincode ? ` (${order.customer.pincode})` : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <Link
                          href={`/order/${order.orderId}`}
                          className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition"
                        >
                          View Order Details
                        </Link>
                      </div>
                    </div>

                    {/* Progress Track Stepper (if not cancelled) */}
                    {order.status !== 'cancelled' && (
                      <div className="pt-4 border-t border-neutral-800/80">
                        <div className="grid grid-cols-5 gap-2 text-center">
                          {[
                            { key: 'placed', label: 'Placed', step: 1, icon: '✓' },
                            { key: 'packed', label: 'Packed', step: 2, icon: '✓' },
                            { key: 'shipped', label: 'Shipped', step: 3, icon: '📦' },
                            { key: 'out_for_delivery', label: 'Out for Delivery', step: 4, icon: '🚚' },
                            { key: 'delivered', label: 'Delivered', step: 5, icon: '✓' },
                          ].map((s) => {
                            const isDone = statusMeta.step >= s.step
                            const isCurrent = statusMeta.step === s.step
                            return (
                              <div key={s.key} className="flex flex-col items-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition mb-1 ${
                                    isCurrent
                                      ? 'bg-[#cc0000] text-white ring-4 ring-[#cc0000]/20'
                                      : isDone
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : 'bg-neutral-800 text-neutral-500'
                                  }`}
                                >
                                  {isDone ? s.icon : s.step}
                                </div>
                                <span
                                  className={`text-[10px] leading-tight ${
                                    isCurrent
                                      ? 'text-white font-semibold'
                                      : isDone
                                      ? 'text-neutral-300'
                                      : 'text-neutral-500'
                                  }`}
                                >
                                  {s.label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#cc0000] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  )
}
