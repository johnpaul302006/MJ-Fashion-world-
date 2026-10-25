'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { inr, shortDate } from '@/lib/format'
import { getStatusMeta, ORDER_STATUS } from '@/lib/categories'
import { useAdminToast } from './AdminToast'
import AdminConfirmModal from './AdminConfirmModal'

function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

const NEXT_STEP = {
  pending: { status: 'confirmed', label: 'Confirm Order', confirm: 'Confirm this order? Payment is verified.' },
  confirmed: { status: 'packed', label: 'Mark Packed', confirm: 'Mark this order as packed & quality checked?' },
  packed: { status: 'shipped', label: 'Mark Shipped', confirm: 'Mark this order as handed to courier / shipped?' },
  shipped: { status: 'out_for_delivery', label: 'Out for Delivery', confirm: 'Mark this order as out for delivery?' },
  out_for_delivery: { status: 'delivered', label: 'Mark Delivered', confirm: 'Mark this order as delivered?' },
}

export default function AdminOrders() {
  const { showSuccess, showError } = useAdminToast()
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [noteDraft, setNoteDraft] = useState({})
  const [trackDraft, setTrackDraft] = useState({})
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    variant: 'brand',
    action: null,
  })
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(() => {
    const url = filter === 'all' ? '/api/orders' : `/api/orders?status=${filter}`
    fetch(url)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => setOrders([]))
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  async function update(id, fields, successMsg = 'Order updated') {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) throw new Error('Update failed')
      showSuccess(successMsg)
      load()
    } catch (err) {
      showError(err.message || 'Error updating order')
    }
  }

  function handleVerifyClick(o) {
    setConfirmModal({
      open: true,
      title: 'Verify Payment & Confirm Order',
      message: `Have you verified the money received in your bank or UPI app for UTR "${o.utr || 'N/A'}" (${inr(o.amount)})?`,
      confirmLabel: 'Verify & Confirm',
      variant: 'brand',
      action: async () => {
        await update(o._id, { status: 'confirmed' }, `Order ${o.orderId} verified and confirmed!`)
      },
    })
  }

  function handleNextStepClick(o) {
    const step = NEXT_STEP[o.status]
    if (!step || (o.status === 'pending' && o.paymentMethod === 'upi')) return

    setConfirmModal({
      open: true,
      title: `Advance to ${step.label}`,
      message: step.confirm,
      confirmLabel: step.label,
      variant: 'brand',
      action: async () => {
        await update(o._id, { status: step.status }, `Order status moved to ${step.label}`)
      },
    })
  }

  function handleDeleteClick(o) {
    setConfirmModal({
      open: true,
      title: 'Delete Order Record',
      message: `Are you sure you want to delete order ${o.orderId}? This cannot be undone.`,
      confirmLabel: 'Delete Order',
      variant: 'danger',
      action: async () => {
        const res = await fetch(`/api/orders/${o._id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Delete failed')
        showSuccess(`Order ${o.orderId} deleted`)
        load()
      },
    })
  }

  async function handleModalConfirm() {
    if (!confirmModal.action) return
    setActionLoading(true)
    try {
      await confirmModal.action()
      setConfirmModal({ ...confirmModal, open: false })
    } catch (err) {
      showError(err.message || 'Operation failed')
    } finally {
      setActionLoading(false)
    }
  }

  async function saveTracking(id) {
    const t = trackDraft[id] || {}
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking: {
            courier: t.courier ?? '',
            number: t.number ?? '',
            url: t.url ?? '',
            eta: t.eta ?? '',
            currentLocation: t.currentLocation ?? '',
          },
        }),
      })
      if (!res.ok) throw new Error('Save tracking failed')
      showSuccess('Tracking details updated and visible to customer')
      load()
    } catch (err) {
      showError(err.message || 'Failed to save tracking')
    }
  }

  async function saveNote(id) {
    const note = noteDraft[id] ?? ''
    await update(id, { note }, 'Customer note saved')
  }

  const filteredOrders = useMemo(() => {
    if (!orders) return []
    if (!search.trim()) return orders

    const q = search.toLowerCase().trim()
    return orders.filter(
      (o) =>
        o.orderId?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.phone?.includes(q) ||
        o.utr?.toLowerCase().includes(q)
    )
  }, [orders, search])

  const counts = (orders || []).length

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {['all', ...ORDER_STATUS.map((s) => s.value)].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition whitespace-nowrap ${
                filter === f
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? `All (${counts})` : getStatusMeta(f).label}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative flex-1 sm:w-64">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, name, phone, UTR..."
            className="w-full text-xs pl-8 pr-7 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-brand focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-800 dark:text-slate-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Orders List / Empty State */}
      {!orders ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 animate-pulse">
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-12 text-center text-slate-500 dark:text-slate-400 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
            📦
          </div>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">No orders matching this filter</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Try adjusting your search keywords.' : 'Orders in this status will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const meta = getStatusMeta(o.status)
            const canVerify = o.status === 'pending'
            const nextStep = NEXT_STEP[o.status]

            return (
              <div
                key={o._id}
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Order Header: ID, badges, price */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        Order #{o.orderId}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          o.paymentMethod === 'cod'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                        }`}
                      >
                        {o.paymentMethod === 'cod' ? 'COD' : 'UPI'}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">{shortDate(o.createdAt)}</p>

                    <div className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white">{o.customer?.name}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="font-mono">{o.customer?.phone}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {o.customer?.address}
                      {o.customer?.city ? `, ${o.customer?.city}` : ''}
                      {o.customer?.pincode ? ` - ${o.customer?.pincode}` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {inr(o.amount)}
                    </p>
                    {o.couponCode ? (
                      <p className="text-xs text-slate-400 line-through mt-0.5">
                        {inr(o.originalAmount || o.amount)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        incl. delivery {inr(o.deliveryFee || 0)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Purchased List */}
                <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3.5 py-2.5 space-y-1 border border-slate-100 dark:border-slate-800">
                  {o.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                    >
                      <span>
                        <b className="text-slate-900 dark:text-white font-semibold">{item.qty}×</b> {item.name}{' '}
                        <span className="text-xs text-slate-400 font-mono">({item.size})</span>
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {inr(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon info row */}
                {o.couponCode ? (
                  <div className="mt-2.5 flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-3 py-2 text-emerald-800 dark:text-emerald-300">
                    <TagIcon />
                    <span>
                      Coupon <b className="font-mono tracking-wider">{o.couponCode}</b> ({o.couponDiscount}% off) — saved{' '}
                      <b>{inr(o.discountAmount)}</b> · Original: {inr(o.originalAmount || o.amount + (o.discountAmount || 0))}
                    </span>
                  </div>
                ) : null}

                {/* Payment & Verification Actions */}
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-1">
                  {o.paymentMethod === 'upi' ? (
                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl px-3 py-1.5 text-xs text-blue-900 dark:text-blue-200 mr-1">
                      UTR: <b className="font-mono tracking-wider">{o.utr || '—'}</b>
                      <span className="block text-[10px] text-blue-600 dark:text-blue-400">
                        Check UTR in your bank/UPI app before confirming.
                      </span>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl px-3 py-1.5 text-xs text-emerald-900 dark:text-emerald-200 mr-1">
                      COD order — collect <b>{inr(o.amount)}</b> cash on delivery.
                    </div>
                  )}

                  {canVerify && o.paymentMethod === 'upi' && (
                    <button
                      type="button"
                      onClick={() => handleVerifyClick(o)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition"
                    >
                      Verify Payment & Confirm
                    </button>
                  )}

                  {canVerify && o.paymentMethod === 'cod' && (
                    <button
                      type="button"
                      onClick={() => update(o._id, { status: 'confirmed' }, 'COD Order confirmed!')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition"
                    >
                      Confirm Order (COD)
                    </button>
                  )}

                  {o.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => update(o._id, { status: 'packed' }, 'Order marked as Packed!')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition"
                    >
                      Mark Packed
                    </button>
                  )}

                  {o.status === 'packed' && (
                    <button
                      type="button"
                      onClick={() => update(o._id, { status: 'shipped' }, 'Order marked as Shipped!')}
                      className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <TruckIcon />
                      <span>Mark Shipped</span>
                    </button>
                  )}

                  {o.status === 'shipped' && (
                    <button
                      type="button"
                      onClick={() => update(o._id, { status: 'out_for_delivery' }, 'Order is Out for Delivery!')}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <span>🚚 Out for Delivery</span>
                    </button>
                  )}

                  {o.status === 'out_for_delivery' && (
                    <button
                      type="button"
                      onClick={() => update(o._id, { status: 'delivered' }, 'Order marked as Delivered!')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition"
                    >
                      Mark Delivered
                    </button>
                  )}

                  {canVerify && (
                    <button
                      type="button"
                      onClick={() => update(o._id, { status: 'rejected' }, 'Order rejected')}
                      className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold px-3.5 py-2 rounded-xl transition"
                    >
                      Reject
                    </button>
                  )}

                  {/* Stage Advance shortcut */}
                  {nextStep && !(o.status === 'pending' && o.paymentMethod === 'upi') && (
                    <button
                      type="button"
                      onClick={() => handleNextStepClick(o)}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition"
                      title="Advance order to next lifecycle step"
                    >
                      Next: {nextStep.label} →
                    </button>
                  )}

                  {/* Print Documents: Invoice & Packing Slip */}
                  <a
                    href={`/order/${o.orderId}/invoice?print=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg transition"
                    title="Print / Save Tax Invoice PDF"
                  >
                    <span>📄</span> Invoice
                  </a>

                  <a
                    href={`/admin/orders/${o._id}/packing-slip?print=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg transition"
                    title="Print Warehouse Packing & Dispatch Slip"
                  >
                    <span>📦</span> Packing Slip
                  </a>

                  {/* Customer view link */}
                  <a
                    href={`/orders?phone=${o.customer?.phone}&orderId=${o.orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-brand hover:underline px-2 py-1"
                  >
                    Customer Track View ↗
                  </a>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(o)}
                    className="text-xs text-slate-400 hover:text-rose-600 font-semibold ml-auto px-2 py-1"
                  >
                    Delete
                  </button>
                </div>

                {/* Customer Note Input */}
                <div className="mt-3 flex gap-2 items-center">
                  <input
                    value={noteDraft[o._id] ?? o.note ?? ''}
                    onChange={(e) => setNoteDraft({ ...noteDraft, [o._id]: e.target.value })}
                    placeholder="Add a note for customer (e.g. Expected dispatch tomorrow, gift wrapped)..."
                    className="flex-1 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => saveNote(o._id)}
                    className="shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700"
                  >
                    Save Note
                  </button>
                </div>

                {/* Delivery / Live Tracking Box */}
                <div className="mt-3 border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <TruckIcon />
                      Delivery / Live Tracking Details
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Customer sees this updated live on their tracking screen
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <div className="sm:col-span-2">
                      <input
                        value={trackDraft[o._id]?.currentLocation ?? o.tracking?.currentLocation ?? ''}
                        onChange={(e) =>
                          setTrackDraft({
                            ...trackDraft,
                            [o._id]: { ...(trackDraft[o._id] ?? {}), currentLocation: e.target.value },
                          })
                        }
                        placeholder="Current Hub / Status (e.g. In transit: Departed Bangalore Sorting Hub)"
                        className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:border-brand"
                      />
                    </div>
                    <input
                      value={trackDraft[o._id]?.courier ?? o.tracking?.courier ?? ''}
                      onChange={(e) =>
                        setTrackDraft({
                          ...trackDraft,
                          [o._id]: { ...(trackDraft[o._id] ?? {}), courier: e.target.value },
                        })
                      }
                      placeholder="Courier Name (e.g. Delhivery, BlueDart, DTDC)"
                      className="border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:border-brand"
                    />
                    <input
                      value={trackDraft[o._id]?.number ?? o.tracking?.number ?? ''}
                      onChange={(e) =>
                        setTrackDraft({
                          ...trackDraft,
                          [o._id]: { ...(trackDraft[o._id] ?? {}), number: e.target.value },
                        })
                      }
                      placeholder="AWB / Tracking Number"
                      className="border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:border-brand"
                    />
                    <input
                      value={trackDraft[o._id]?.url ?? o.tracking?.url ?? ''}
                      onChange={(e) =>
                        setTrackDraft({
                          ...trackDraft,
                          [o._id]: { ...(trackDraft[o._id] ?? {}), url: e.target.value },
                        })
                      }
                      placeholder="Courier tracking link (https://...)"
                      className="border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:border-brand"
                    />
                    <input
                      value={trackDraft[o._id]?.eta ?? o.tracking?.eta ?? ''}
                      onChange={(e) =>
                        setTrackDraft({
                          ...trackDraft,
                          [o._id]: { ...(trackDraft[o._id] ?? {}), eta: e.target.value },
                        })
                      }
                      placeholder="Expected delivery date (e.g. 28 Oct)"
                      className="border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:border-brand"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => saveTracking(o._id)}
                    className="mt-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition"
                  >
                    Save Tracking Details
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <AdminConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel="Cancel"
        variant={confirmModal.variant}
        loading={actionLoading}
        onConfirm={handleModalConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, open: false })}
      />
    </div>
  )
}
