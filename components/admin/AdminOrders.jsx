'use client'

import { useCallback, useEffect, useState } from 'react'
import { inr, shortDate } from '@/lib/format'
import { getStatusMeta, ORDER_STATUS } from '@/lib/categories'

function TruckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  )
}
function TagIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('all')
  const [noteDraft, setNoteDraft] = useState({})
  const [trackDraft, setTrackDraft] = useState({})

  const load = useCallback(() => {
    const url = filter === 'all' ? '/api/orders' : `/api/orders?status=${filter}`
    fetch(url).then((r) => r.json()).then((d) => setOrders(d.orders || [])).catch(() => setOrders([]))
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  async function update(id, fields) {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    load()
  }

  async function verify(id) {
    if (!confirm('Verify payment for this order? Confirm the UTR matches the money received in your UPI app first.')) return
    await update(id, { status: 'confirmed' })
  }

  const NEXT_STEP = {
    pending: { status: 'confirmed', label: 'Confirm', confirm: 'Confirm this order? Payment is verified.' },
    confirmed: { status: 'shipped', label: 'Mark Shipped', confirm: 'Mark this order as shipped?' },
    shipped: { status: 'delivered', label: 'Mark Delivered', confirm: 'Mark this order as delivered?' },
  }

  async function goNext(o) {
    const step = NEXT_STEP[o.status]
    if (!step || o.status === 'pending' && o.paymentMethod === 'upi') return
    if (!confirm(step.confirm)) return
    await update(o._id, { status: step.status })
  }

  async function del(id) {
    if (!confirm('Delete this order permanently?')) return
    await fetch(`/api/orders/${id}`, { method: 'DELETE' })
    load()
  }

  async function saveTracking(id) {
    const t = trackDraft[id] || {}
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tracking: {
          courier: t.courier || '',
          number: t.number || '',
          url: t.url || '',
          eta: t.eta || '',
        },
      }),
    })
    load()
  }

  const counts = (orders || []).length

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['all', ...ORDER_STATUS.map((s) => s.value)].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {f === 'all' ? `All (${counts})` : getStatusMeta(f).label}
          </button>
        ))}
      </div>

      {!orders ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
          <p className="font-semibold">No orders in this view</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const meta = getStatusMeta(o.status)
            const canVerify = o.status === 'pending'
            return (
              <div key={o._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 dark:text-white">Order {o.orderId}</p>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${o.paymentMethod === 'cod' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {o.paymentMethod === 'cod' ? 'COD' : 'UPI'}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{shortDate(o.createdAt)}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 mt-2">
                      {o.customer.name} · {o.customer.phone}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {o.customer.address}
                      {o.customer.city ? `, ${o.customer.city}` : ''}
                      {o.customer.pincode ? ` - ${o.customer.pincode}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">{inr(o.amount)}</p>
                    {o.couponCode ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 line-through mt-0.5">{inr(o.originalAmount || o.amount)}</p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500">incl. delivery {inr(o.deliveryFee)}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5 space-y-1">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-slate-700 dark:text-slate-200">
                      <span>
                        {i.qty} × {i.name} <span className="text-xs text-slate-400 dark:text-slate-500">({i.size})</span>
                      </span>
                      <span className="font-semibold">{inr(i.price * i.qty)}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon info row */}
                {o.couponCode ? (
                  <div className="mt-2 flex items-center gap-2 text-xs bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 rounded-lg px-3 py-2 text-green-800 dark:text-green-300">
                    <TagIcon />
                    <span>Coupon <b className="font-mono tracking-wider">{o.couponCode}</b> ({o.couponDiscount}% off) — saved <b>{inr(o.discountAmount)}</b> · Original: {inr(o.originalAmount || o.amount + (o.discountAmount || 0))}</span>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 pl-1">Coupon: None</div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {o.paymentMethod === 'upi' ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-800 mr-1">
                      UTR: <b className="tracking-wider">{o.utr || '—'}</b>
                      <span className="block text-[10px] text-blue-600 mt-0.5">Check this number in your bank/UPI app before verifying.</span>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs text-green-800 mr-1">
                      COD order — collect <b>{inr(o.amount)}</b> cash at delivery.
                    </div>
                  )}
                  {canVerify && o.paymentMethod === 'upi' ? (
                    <button onClick={() => verify(o._id)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg">
                      Verify Payment &amp; Confirm
                    </button>
                  ) : null}
                  {canVerify && o.paymentMethod === 'cod' ? (
                    <button onClick={() => update(o._id, { status: 'confirmed' })} className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg">
                      Confirm Order (COD)
                    </button>
                  ) : null}
                  {o.status === 'confirmed' ? (
                    <button onClick={() => update(o._id, { status: 'shipped' })} className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5">
                      <TruckIcon /> Mark Shipped
                    </button>
                  ) : null}
                  {o.status === 'shipped' ? (
                    <button onClick={() => update(o._id, { status: 'delivered' })} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg">
                      Mark Delivered
                    </button>
                  ) : null}
                  {canVerify ? (
                    <button onClick={() => update(o._id, { status: 'rejected' })} className="bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 text-sm font-bold px-4 py-2 rounded-lg">
                      Reject
                    </button>
                  ) : null}
                  {/* Next status button (host-only) */}
                  {NEXT_STEP[o.status] && !(o.status === 'pending' && o.paymentMethod === 'upi') ? (
                    <button
                      onClick={() => goNext(o)}
                      className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
                      title="Advance order to the next stage"
                    >
                      Next: {NEXT_STEP[o.status].label} →
                    </button>
                  ) : null}
                  <a
                    href={`/orders?phone=${o.customer.phone}&orderId=${o.orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline self-center"
                    title="Open the customer's Track Order page"
                  >
                    Customer view
                  </a>
                  <button onClick={() => del(o._id)} className="text-xs text-slate-400 hover:text-red-600 font-medium ml-auto">
                    Delete
                  </button>
                </div>

                <div className="mt-3 flex gap-2 items-center">
                  <input
                    value={noteDraft[o._id] ?? o.note ?? ''}
                    onChange={(e) => setNoteDraft({ ...noteDraft, [o._id]: e.target.value })}
                    placeholder="Add a note for the customer (e.g. dispatch date, tracking number)..."
                    className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => update(o._id, { note: noteDraft[o._id] ?? '' })}
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-sm font-semibold px-3 py-2 rounded-lg"
                  >
                    Save note
                  </button>
                </div>

                <div className="mt-3 border border-violet-200 dark:border-violet-900 bg-violet-50/60 dark:bg-violet-950/40 rounded-xl p-3">
                  <p className="text-xs font-bold text-violet-800 dark:text-violet-300 mb-2 flex items-center gap-1.5">
                    <TruckIcon />
                    Delivery / Tracking Details
                    <span className="font-normal text-[10px] text-violet-500">(only you can update — customer sees it on Track Order)</span>
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      value={trackDraft[o._id]?.courier ?? o.tracking?.courier ?? ''}
                      onChange={(e) => setTrackDraft({ ...trackDraft, [o._id]: { ...(trackDraft[o._id] ?? {}), courier: e.target.value } })}
                      placeholder="Courier (e.g. Delhivery, DTDC, India Post)"
                      className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                    />
                    <input
                      value={trackDraft[o._id]?.number ?? o.tracking?.number ?? ''}
                      onChange={(e) => setTrackDraft({ ...trackDraft, [o._id]: { ...(trackDraft[o._id] ?? {}), number: e.target.value } })}
                      placeholder="AWB / Tracking number"
                      className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                    />
                    <input
                      value={trackDraft[o._id]?.url ?? o.tracking?.url ?? ''}
                      onChange={(e) => setTrackDraft({ ...trackDraft, [o._id]: { ...(trackDraft[o._id] ?? {}), url: e.target.value } })}
                      placeholder="Tracking link (optional)"
                      className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                    />
                    <input
                      value={trackDraft[o._id]?.eta ?? o.tracking?.eta ?? ''}
                      onChange={(e) => setTrackDraft({ ...trackDraft, [o._id]: { ...(trackDraft[o._id] ?? {}), eta: e.target.value } })}
                      placeholder="Expected delivery (e.g. 18 Aug)"
                      className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                    />
                  </div>
                  <button
                    onClick={() => saveTracking(o._id)}
                    className="mt-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
                  >
                    Save Tracking Details
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}