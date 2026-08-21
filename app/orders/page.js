'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { inr, shortDate } from '@/lib/format'
import { getStatusMeta } from '@/lib/categories'
import { useAuth } from '@/components/auth/AuthProvider'

/* ─────────────────────────────────────────────────────────────
   SHARED: Order status stepper
───────────────────────────────────────────────────────────── */
const STEPS = ['pending', 'confirmed', 'shipped', 'delivered']

function OrderCard({ o }) {
  const sm = getStatusMeta(o.status)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-sm">Order {o.orderId}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {shortDate(o.createdAt)} &middot; {o.items.reduce((n, i) => n + i.qty, 0)} item(s)
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${o.paymentMethod === 'cod' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {o.paymentMethod === 'cod' ? 'COD' : 'UPI'}
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sm.color}`}>{sm.label}</span>
        </div>
      </div>

      {o.status !== 'rejected' ? (
        <div className="mt-4 flex items-center gap-1">
          {STEPS.map((s, i) => {
            const idx = STEPS.indexOf(o.status)
            const done = i <= idx
            const current = i === idx
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 ${current ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    {s === 'pending' ? 'Placed' : s[0].toUpperCase() + s.slice(1)}
                  </span>
                </div>
                {i < STEPS.length - 1 ? <div className={`h-0.5 flex-1 -mt-4 ${i < idx ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'}`} /> : null}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-lg px-3 py-2">
          This order was rejected. Contact the store for a refund.
        </div>
      )}

      <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
        {o.items.slice(0, 3).map((i, idx) => (
          <p key={idx}>• {i.qty} × {i.name}{i.size ? ` (${i.size})` : ''}</p>
        ))}
        {o.items.length > 3 ? <p className="text-slate-400">… and {o.items.length - 3} more</p> : null}
      </div>

      {o.tracking && (o.tracking.courier || o.tracking.number) ? (
        <div className="mt-3 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 rounded-xl px-3 py-2.5 text-xs text-violet-900 dark:text-violet-200">
          <p className="font-bold mb-1.5">Delivery tracking</p>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
            {o.tracking.courier ? <p><b>Courier:</b> {o.tracking.courier}</p> : null}
            {o.tracking.number ? <p><b>Tracking no:</b> <span className="tracking-wider font-semibold">{o.tracking.number}</span></p> : null}
            {o.tracking.eta ? <p><b>ETA:</b> {o.tracking.eta}</p> : null}
            {o.tracking.url ? (
              <a href={o.tracking.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Track on courier site ↗
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Coupon info */}
      {o.couponCode ? (
        <div className="mt-3 flex items-center gap-2 text-xs bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 rounded-lg px-3 py-2 text-green-800 dark:text-green-300">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span>Coupon <b className="font-mono tracking-wider">{o.couponCode}</b> ({o.couponDiscount}% off) — you saved <b>{inr(o.discountAmount)}</b></span>
        </div>
      ) : null}

      <div className="mt-3 flex justify-between items-center text-sm border-t border-slate-100 dark:border-slate-800 pt-3">
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {o.paymentMethod === 'cod' ? 'Total payable (COD)' : 'Total paid via UPI'}
        </span>
        <div className="text-right">
          {o.couponCode && o.originalAmount ? (
            <p className="text-xs text-slate-400 line-through">{inr(o.originalAmount)}</p>
          ) : null}
          <span className="font-bold text-slate-900 dark:text-white">{inr(o.amount)}</span>
        </div>
      </div>
      {o.utr ? <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">UTR: {o.utr}</p> : null}
      {o.note ? (
        <p className="mt-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300">
          <b>Store note:</b> {o.note}
        </p>
      ) : null}
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
    fetchOrders()
    // Auto-refresh every 30s
    const id = setInterval(() => fetchOrders({}, true), 30000)
    const onFocus = () => fetchOrders({}, true)
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
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
   CUSTOMER VIEW — single order lookup by Order ID (with ownership check)
───────────────────────────────────────────────────────────── */
function CustomerOrderView() {
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState(null)
  const searchRanRef = useRef(false)

  const fetchOrders = useCallback(
    async (silent = false) => {
      try {
        const params = new URLSearchParams({ orderId: orderId.trim().toUpperCase() })
        if (phone.trim()) params.set('phone', phone.trim())
        const res = await fetch(`/api/orders?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not find order')
        setOrders(data.orders || [])
        setLastUpdate(new Date())
      } catch (err) {
        if (!silent) setError(err.message)
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [orderId, phone]
  )

  async function search(e) {
    if (e) e.preventDefault()
    if (!orderId.trim()) return setError('Enter your Order ID (e.g. JN-X3K2A)')
    setError('')
    setLoading(true)
    setOrders(null)
    searchRanRef.current = true
    await fetchOrders(false)
  }

  // Auto-search from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const o = params.get('orderId') || ''
    const p = params.get('phone') || ''
    if (!o) return
    const t = setTimeout(() => {
      setOrderId(o)
      setPhone(p)
      searchRanRef.current = true
      setError('')
      setLoading(true)
      fetchOrders(false)
    }, 100)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh while viewing results
  useEffect(() => {
    if (!searchRanRef.current) return
    const id = setInterval(() => fetchOrders(true), 12000)
    const onFocus = () => fetchOrders(true)
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [fetchOrders])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">Track Your Order</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Enter your Order ID to see your order's status and tracking details.
      </p>

      <form onSubmit={search} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
        <div className="space-y-2.5">
          <input
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order ID * (e.g. JN-X3K2A)"
            className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand transition-colors"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile number (optional, for legacy orders)"
            pattern="[0-9]{10}"
            className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand transition-colors"
          />
        </div>
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? 'Searching…' : 'Track Order'}
        </button>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Only your order is shown. Other customers&apos; orders are never accessible.
        </p>
      </form>

      {orders !== null ? (
        orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center mt-5">
            <div className="flex justify-center mb-3">
              <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p className="font-semibold text-slate-600 dark:text-slate-300">No order found</p>
            <p className="text-sm text-slate-400 mt-1">
              Check the Order ID and try again. Only orders placed with this account are visible.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-green-700 dark:text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
              </span>
              LIVE — refreshes automatically
              {lastUpdate ? <span className="text-slate-400 font-normal">Updated {lastUpdate.toLocaleTimeString()}</span> : null}
            </p>
            {orders.map((o) => <OrderCard key={o._id} o={o} />)}
          </div>
        )
      ) : null}

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-6 text-center">
        Need help? Ask our AI assistant (button at bottom right) or{' '}
        <Link href="/shop" className="text-brand font-semibold hover:underline">keep shopping</Link>.
      </p>
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