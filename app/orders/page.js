'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { inr, shortDate, getReturnEligibility } from '@/lib/format'
import { getStatusMeta } from '@/lib/categories'
import { useAuth } from '@/components/auth/AuthProvider'
import ReturnExchangeModal from '@/components/ReturnExchangeModal'

/* ─────────────────────────────────────────────────────────────
   SHARED: Order status stepper (6 steps: placed → confirmed → packed → shipped → out for delivery → delivered)
───────────────────────────────────────────────────────────── */
const STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
]

function getStepIndex(status) {
  if (status === 'delivered') return 5
  if (status === 'out_for_delivery') return 4
  if (status === 'shipped') return 3
  if (status === 'packed') return 2
  if (status === 'confirmed') return 1
  return 0
}

function OrderCard({ o, onCancel, onExchange, cancelling }) {
  const sm = getStatusMeta(o.status)
  const stepIdx = getStepIndex(o.status)
  const isCancelled = o.status === 'cancelled'
  const isRejected = o.status === 'rejected'
  const canCancel = o.status === 'pending'
  const isDelivered = o.status === 'delivered'

  const deliveryTimestamp = o.deliveredAt || o.statusTimestamps?.delivered
  const { isWithinWindow, returnDaysRemaining } = isDelivered
    ? getReturnEligibility(deliveryTimestamp)
    : { isWithinWindow: true, returnDaysRemaining: 7 }

  return (
    <div className="bg-white dark:bg-[#161616] rounded-xl border border-gray-200 dark:border-[#262626] p-4 sm:p-6 shadow-xs hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-gray-100 dark:border-[#222]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-gray-400">Order</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">#{o.orderId}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Placed {shortDate(o.createdAt)} &middot; {o.items?.reduce((n, i) => n + i.qty, 0) || 0} item(s)
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            o.paymentMethod === 'cod' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
          }`}>
            {o.paymentMethod === 'cod' ? 'COD' : 'UPI'}
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${sm.color}`}>
            {sm.label}
          </span>
        </div>
      </div>

      {/* Status Stepper */}
      {!isRejected && !isCancelled ? (
        <div className="my-5">
          <div className="flex items-center justify-between relative">
            {STEPS.map((step, i) => {
              const done = i <= stepIdx
              const current = i === stepIdx
              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    done
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 text-center font-medium ${
                    current
                      ? 'text-brand font-bold'
                      : done
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
            {/* Background line */}
            <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-800 -z-0" />
            {/* Progress line */}
            <div
              className="absolute top-3 left-6 h-0.5 bg-brand -z-0 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, (stepIdx / (STEPS.length - 1)) * 100))}%` }}
            />
          </div>
        </div>
      ) : isCancelled ? (
        <div className="my-4 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-lg px-4 py-2.5 flex items-center gap-2">
          <span>This order was cancelled.</span>
        </div>
      ) : (
        <div className="my-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-lg px-4 py-2.5">
          This order was rejected. Contact store support for assistance.
        </div>
      )}

      {/* Items list with images */}
      <div className="space-y-3 py-2 border-t border-b border-gray-100 dark:border-[#222]">
        {o.items?.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-12 h-14 rounded-xs overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-gray-200 dark:border-gray-700">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No img</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
              <p className="text-xs text-gray-400">
                Qty: {item.qty} {item.size ? `· Size: ${item.size}` : ''}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{inr(item.price * item.qty)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tracking info if available */}
      {o.tracking && (o.tracking.courier || o.tracking.number) ? (
        <div className="mt-3 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 rounded-lg px-3 py-2 text-xs text-violet-900 dark:text-violet-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="font-bold">Tracking:</span> {o.tracking.courier} &middot; <span className="font-mono">{o.tracking.number}</span>
          </div>
          {o.tracking.url ? (
            <a href={o.tracking.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Live Courier Tracking ↗
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Total amount row */}
      <div className="mt-3 flex justify-between items-center text-sm">
        <span className="text-gray-500 dark:text-gray-400 text-xs">
          {o.paymentMethod === 'cod' ? 'Total Payable (COD)' : 'Total Paid'}
        </span>
        <div className="text-right">
          <span className="font-black text-base text-gray-900 dark:text-white">{inr(o.amount)}</span>
        </div>
      </div>

      {/* Action Buttons: Track Order, View Details, Cancel Order, Return / Exchange */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#222] flex items-center flex-wrap gap-2">
        <Link
          href={`/order/${o.orderId}`}
          className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-sm uppercase tracking-wider transition-colors"
        >
          Track Order
        </Link>
        <Link
          href={`/order/${o.orderId}`}
          className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-gray-400 text-xs font-bold px-4 py-2 rounded-sm uppercase tracking-wider transition-colors"
        >
          View Details
        </Link>

        {canCancel && onCancel ? (
          <button
            onClick={() => onCancel(o._id)}
            disabled={cancelling}
            className="border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold px-4 py-2 rounded-sm uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </button>
        ) : null}

        {onExchange && (
          isDelivered ? (
            isWithinWindow ? (
              <button
                onClick={() => onExchange(o, o.items?.[0])}
                className="border border-[#cc0000] text-[#cc0000] hover:bg-[#cc0000] hover:text-white text-xs font-bold px-4 py-2 rounded-sm uppercase tracking-wider transition-colors cursor-pointer"
              >
                Return / Exchange ({returnDaysRemaining}d left)
              </button>
            ) : (
              <button
                disabled
                title="The 7-day return and exchange policy has expired for this order"
                className="border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 text-xs font-bold px-4 py-2 rounded-sm uppercase tracking-wider cursor-not-allowed"
              >
                Return Expired
              </button>
            )
          ) : (
            <button
              disabled
              title="Return / Exchange is only available once your order status is marked Delivered"
              className="border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 text-xs font-bold px-4 py-2 rounded-sm uppercase tracking-wider cursor-not-allowed"
            >
              Return (After Delivery)
            </button>
          )
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   HOST VIEW — all orders + filter by Order ID / mobile
───────────────────────────────────────────────────────────── */
function HostOrdersView() {
  const [filterText, setFilterText] = useState('')
  const [orders, setOrders] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchOrders = useCallback(async (params = {}, silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams()
      if (params.orderId) qs.set('orderId', params.orderId)
      else if (params.phone) qs.set('phone', params.phone)
      const res = await fetch(`/api/orders${qs.toString() ? `?${qs}` : ''}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch orders')
      setOrders(data.orders || [])
      setLastUpdate(new Date())
    } catch (err) {
      if (!silent) setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Load all orders on mount
  useEffect(() => {
    const t = setTimeout(() => fetchOrders(), 0)
    // Auto-refresh every 30s
    const id = setInterval(() => fetchOrders({}, true), 30000)
    const onFocus = () => fetchOrders({}, true)
    window.addEventListener('focus', onFocus)
    return () => { clearTimeout(t); clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [fetchOrders])

  function handleSearch(e) {
    e.preventDefault()
    const val = filterText.trim()
    if (!val) {
      fetchOrders()
      return
    }
    // Auto-detect: if it's 10 digits → phone filter; else → order ID filter
    if (/^[0-9]{10}$/.test(val)) {
      fetchOrders({ phone: val })
    } else {
      fetchOrders({ orderId: val })
    }
  }

  function handleClear() {
    setFilterText('')
    fetchOrders()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider">Host Panel</span>
          <span className="text-xs text-slate-400">All orders visible</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Order Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Filter by Order ID or 10-digit mobile number. Leave blank to view all orders.
        </p>
      </div>

      {/* Filter bar */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Order ID (e.g. JN-X3K2A) or Mobile Number (e.g. 9876543210)"
            className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand transition-colors"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 sm:flex-none border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            Clear
          </button>
        </div>
        {error ? <p className="sm:col-span-2 text-sm text-red-600 dark:text-red-400 mt-1">{error}</p> : null}
      </form>

      {/* Results */}
      {loading && orders === null ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-brand rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading orders…</p>
        </div>
      ) : orders !== null ? (
        orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
            <div className="flex justify-center mb-3">
              <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p className="font-semibold text-slate-600 dark:text-slate-300">No orders found</p>
            <p className="text-sm mt-1">Try a different Order ID or mobile number, or clear the filter.</p>
          </div>
        ) : (
          <div>
            {/* Live indicator + count */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-green-700 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
                </span>
                LIVE
                {lastUpdate ? <span className="text-slate-400 font-normal">Updated {lastUpdate.toLocaleTimeString()}</span> : null}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mobile</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {orders.map((o) => {
                      const sm = getStatusMeta(o.status)
                      return (
                        <tr key={o._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">{o.orderId}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{o.customer?.name || '—'}</p>
                            {o.customer?.city ? <p className="text-xs text-slate-400">{o.customer.city}</p> : null}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs whitespace-nowrap">{o.customer?.phone || '—'}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{shortDate(o.createdAt)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${sm.color}`}>{sm.label}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">{inr(o.amount)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {orders.map((o) => <OrderCard key={o._id} o={o} />)}
            </div>
          </div>
        )
      ) : null}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   CUSTOMER VIEW — full order history for authenticated customer
───────────────────────────────────────────────────────────── */
function CustomerOrderView() {
  const { user } = useAuth()
  const [orders, setOrders] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterText, setFilterText] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [exchangeOrder, setExchangeOrder] = useState(null)

  // Phone Search State
  const [phoneInput, setPhoneInput] = useState(user?.phone || '')
  const [phoneError, setPhoneError] = useState('')
  const [searchedPhone, setSearchedPhone] = useState('')
  const [phoneOrderStats, setPhoneOrderStats] = useState(null)

  const fetchCustomerOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load your orders')
      setOrders(data.orders || [])
    } catch (err) {
      if (!silent) setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (user) {
        fetchCustomerOrders()
        if (user.phone) setPhoneInput(user.phone)
      } else {
        setLoading(false)
      }
    }, 0)
    return () => clearTimeout(t)
  }, [user, fetchCustomerOrders])

  async function handlePhoneSearch(e) {
    e.preventDefault()
    setPhoneError('')
    const cleanPhone = phoneInput.replace(/[^0-9]/g, '')
    if (cleanPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number (e.g. 9876543210)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/orders?phone=${cleanPhone}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search orders for this number')
      }
      const matched = data.orders || []
      const productCount = matched.reduce((n, o) => n + (o.items?.reduce((cnt, i) => cnt + (i.qty || 1), 0) || 0), 0)
      setOrders(matched)
      setSearchedPhone(cleanPhone)
      setPhoneOrderStats({ productCount, orderCount: matched.length })
    } catch (err) {
      setPhoneError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleClearPhoneSearch() {
    setSearchedPhone('')
    setPhoneOrderStats(null)
    setPhoneError('')
    fetchCustomerOrders()
  }

  async function handleCancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return
    setCancellingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not cancel order')
      await fetchCustomerOrders(true)
    } catch (err) {
      alert(err.message || 'Could not cancel order')
    } finally {
      setCancellingId(null)
    }
  }

  // If user is not logged in
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-[#161616] border border-gray-100 dark:border-[#262626] rounded-xl p-8 sm:p-12 shadow-sm">
          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            📦
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In to View Your Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Please log in with your email or mobile number to see your order history, delivery status and tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?next=/orders"
              className="bg-brand hover:bg-brand-dark text-white font-bold py-3 px-6 rounded-lg text-sm transition-colors uppercase tracking-wider"
            >
              Sign In
            </Link>
            <Link
              href="/track-order"
              className="border border-gray-300 dark:border-gray-700 hover:border-brand hover:text-brand text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-lg text-sm transition-colors uppercase tracking-wider"
            >
              Track by Phone Number
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Filter orders by orderId or product name
  const filteredOrders = (orders || []).filter((o) => {
    if (!filterText.trim()) return true
    const q = filterText.toLowerCase()
    if (o.orderId?.toLowerCase().includes(q)) return true
    return o.items?.some((i) => i.name?.toLowerCase().includes(q))
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-2">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-200 font-medium">My Orders</span>
          </nav>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Track Order / Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Search orders by your verified mobile number, track deliveries, or request returns.
          </p>
        </div>

        <Link
          href="/track-order"
          className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
        >
          <span>Track by Number ↗</span>
        </Link>
      </div>

      {/* Phone Number Search Bar */}
      <form
        onSubmit={handlePhoneSearch}
        className="mb-6 p-4 rounded-xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-neutral-800 shadow-xs"
      >
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400 mb-2">
          Search Orders by Mobile Number
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center flex-1 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 px-3 overflow-hidden focus-within:border-brand">
            <span className="text-xs font-mono font-bold text-gray-400 dark:text-neutral-500 mr-2 shrink-0">
              🇮🇳 +91
            </span>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value)
                if (phoneError) setPhoneError('')
              }}
              placeholder="Enter 10-digit mobile number"
              className="w-full h-10 bg-transparent text-sm text-gray-900 dark:text-white outline-none font-mono"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-5 py-2.5 rounded-lg transition uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              Search
            </button>
            {searchedPhone && (
              <button
                type="button"
                onClick={handleClearPhoneSearch}
                className="border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        {phoneError && (
          <p className="mt-2 text-xs text-rose-500 flex items-center gap-1">
            <span>⚠</span> {phoneError}
          </p>
        )}
      </form>

      {/* Searched Phone Summary Banner */}
      {searchedPhone && phoneOrderStats && (
        <div className="mb-5 p-3.5 rounded-xl bg-brand/10 border border-brand/20 text-xs text-neutral-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📦</span>
            <span>
              Found <b>{phoneOrderStats.productCount} product{phoneOrderStats.productCount !== 1 ? 's' : ''}</b> in{' '}
              <b>{phoneOrderStats.orderCount} order{phoneOrderStats.orderCount !== 1 ? 's' : ''}</b> registered under{' '}
              <span className="font-mono font-bold text-brand">+91 {searchedPhone}</span>.
            </span>
          </div>
          <button
            onClick={handleClearPhoneSearch}
            className="text-xs text-brand font-bold underline cursor-pointer"
          >
            Show All My Orders
          </button>
        </div>
      )}

      {/* Filter / Search within orders */}
      {orders && orders.length > 0 && !searchedPhone && (
        <div className="mb-6">
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by Order ID or product name..."
            className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161616] dark:text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors placeholder-gray-400"
          />
        </div>
      )}

      {/* Error state */}
      {error ? (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm mb-6">
          {error}
        </div>
      ) : null}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-[#161616] rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
              <div className="shimmer h-4 w-1/3 rounded-xs" />
              <div className="shimmer h-8 w-full rounded-xs" />
              <div className="shimmer h-14 w-full rounded-xs" />
            </div>
          ))}
        </div>
      ) : orders && orders.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#161616] rounded-xl border border-gray-100 dark:border-[#262626] p-12 sm:p-16 text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/60 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            📦
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            {searchedPhone ? `No Orders Found for +91 ${searchedPhone}` : 'No Orders Yet'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
            {searchedPhone
              ? 'Make sure you used this mobile number during checkout.'
              : 'Start shopping to see your orders here. Browse our fashion collection for the best deals.'}
          </p>
          <div className="flex justify-center gap-3">
            {searchedPhone && (
              <button
                onClick={handleClearPhoneSearch}
                className="border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-widest transition"
              >
                Clear Search
              </button>
            )}
            <Link
              href="/shop"
              className="inline-block bg-brand hover:bg-brand-dark text-white font-bold py-3.5 px-8 rounded-lg text-xs uppercase tracking-widest transition-colors shadow-md"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-[#161616] rounded-xl border border-gray-100 dark:border-[#262626] p-8 text-center text-gray-500">
          <p className="font-semibold text-gray-700 dark:text-gray-300">No matching orders found</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search term or clear the filter.</p>
          <button
            onClick={() => setFilterText('')}
            className="mt-3 text-xs font-bold text-brand hover:underline"
          >
            Clear Filter
          </button>
        </div>
      ) : (
        /* Orders list */
        <div className="space-y-4">
          <p className="text-xs text-gray-400 font-medium">
            Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} (newest first)
          </p>
          {filteredOrders.map((o) => (
            <OrderCard
              key={o._id}
              o={o}
              onCancel={handleCancelOrder}
              onExchange={(ord, item) => setExchangeOrder({ order: ord, product: item || ord.items?.[0] })}
              cancelling={cancellingId === o._id}
            />
          ))}
        </div>
      )}

      {/* Return / Exchange Modal */}
      {exchangeOrder && (
        <ReturnExchangeModal
          order={exchangeOrder.order}
          product={exchangeOrder.product}
          onClose={() => setExchangeOrder(null)}
          onSuccess={() => {
            fetchCustomerOrders(true)
          }}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE — route based on role
───────────────────────────────────────────────────────────── */
export default function OrdersPage() {
  const { user, hosting, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  if (hosting) return <HostOrdersView />
  return <CustomerOrderView />
}