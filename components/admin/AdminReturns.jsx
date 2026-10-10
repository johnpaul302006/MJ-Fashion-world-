'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { inr, shortDate } from '@/lib/format'

export default function AdminReturns() {
  const [requests, setRequests] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'pending' | 'accepted' | 'rejected'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewPhoto, setPreviewPhoto] = useState(null)

  // Action Modals State
  const [actionTarget, setActionTarget] = useState(null) // Request being reviewed
  const [actionType, setActionType] = useState('accepted') // 'accepted' | 'rejected'
  const [hostNote, setHostNote] = useState('')
  const [savingAction, setSavingAction] = useState(false)

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const qs = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/returns${qs}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch returns')
      setRequests(data.requests || [])
    } catch (err) {
      if (!silent) setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    const timer = setTimeout(() => fetchRequests(), 0)
    // Auto-refresh every 15 seconds for real-time host monitoring
    const interval = setInterval(() => fetchRequests(true), 15000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [fetchRequests])

  const handleOpenAction = (req, type) => {
    setActionTarget(req)
    setActionType(type)
    setHostNote(
      type === 'accepted'
        ? 'Approved. Reverse pickup will be initiated within 24-48 business hours. Please keep items packed.'
        : 'Unfortunately, your request could not be approved as the item condition does not meet return eligibility criteria.'
    )
  }

  const handleConfirmAction = async (e) => {
    e.preventDefault()
    if (!actionTarget) return

    setSavingAction(true)
    try {
      const res = await fetch(`/api/returns/${actionTarget._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType,
          hostNote: hostNote.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update request')

      setActionTarget(null)
      fetchRequests(true)
    } catch (err) {
      alert(err.message || 'Error updating return request')
    } finally {
      setSavingAction(false)
    }
  }

  const counts = (requests || []).length
  const pendingCount = (requests || []).filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Returns &amp; Exchanges</h2>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review customer requests, examine proof photos, and approve returns or exchanges.
          </p>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['all', 'pending', 'accepted', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                filter === f
                  ? 'bg-brand text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand'
              }`}
            >
              {f === 'all' ? `All (${counts})` : f}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && requests === null ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-brand rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading return requests…</p>
        </div>
      ) : requests !== null && requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
          <div className="text-3xl mb-2">📦</div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">No requests in this view</p>
          <p className="text-xs text-slate-400 mt-1">When customers submit return or exchange requests, they will show up here.</p>
        </div>
      ) : (
        /* Requests Grid */
        <div className="space-y-4">
          {requests?.map((req) => {
            const isPending = req.status === 'pending'
            const isAccepted = req.status === 'accepted'
            const isRejected = req.status === 'rejected'

            return (
              <div
                key={req._id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand uppercase bg-brand/10 px-2 py-0.5 rounded">
                        {req.requestId}
                      </span>
                      <span className="text-xs text-slate-400">Order</span>
                      <a
                        href={`/orders?orderId=${req.orderId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs font-bold text-slate-900 dark:text-white hover:underline"
                      >
                        #{req.orderId}
                      </a>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Submitted {shortDate(req.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Customer: <b>{req.customerName}</b> · Phone: <span className="font-mono">{req.customerPhone}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        req.type === 'exchange'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {req.type === 'exchange' ? '🔄 Exchange' : '↩ Return'}
                    </span>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : isAccepted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Product & Exchange preference */}
                  <div className="flex gap-3">
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                      {req.product?.image ? (
                        <Image src={req.product.image} alt={req.product.name} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">IMG</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{req.product?.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Current Size: <b>{req.product?.size || 'Standard'}</b> · Qty: {req.product?.qty || 1} · {inr(req.product?.price || 0)}
                      </p>
                      {req.type === 'exchange' && req.exchangeDetails?.newSize && (
                        <div className="mt-2 text-xs bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 p-2 rounded-lg">
                          <span>Replacement Requested: </span>
                          <b>Size {req.exchangeDetails.newSize}</b>
                          {req.exchangeDetails.newColor ? ` (${req.exchangeDetails.newColor})` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Reason & Customer Feedback */}
                  <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Reason: </span>
                      <span className="capitalize font-mono text-slate-900 dark:text-white">
                        {req.reason?.code?.replace(/_/g, ' ')}
                      </span>
                      {req.reason?.text && <p className="text-slate-600 dark:text-slate-400 mt-0.5 italic">&ldquo;{req.reason.text}&rdquo;</p>}
                    </div>

                    {req.feedback && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                          <span>{'★'.repeat(req.feedback.rating || 5)}{'☆'.repeat(5 - (req.feedback.rating || 5))}</span>
                          <span className="text-slate-500 text-[10px]">({req.feedback.rating}/5 rating)</span>
                        </div>
                        {req.feedback.comments && (
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5">&ldquo;{req.feedback.comments}&rdquo;</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>✓</span>
                      <span>Declaration verified: Item reported unworn &amp; tagged</span>
                    </div>
                  </div>
                </div>

                {/* Uploaded Customer Photos Gallery */}
                {req.photos && req.photos.length > 0 && (
                  <div className="mb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Customer Verification Photos ({req.photos.length}):
                    </p>
                    <div className="flex gap-2">
                      {req.photos.map((photo, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPreviewPhoto(photo)}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-80 transition cursor-pointer"
                        >
                          <img src={photo} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Host Decision Notes or Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAction(req, 'accepted')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                      >
                        ✓ Accept &amp; Provide Instructions
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAction(req, 'rejected')}
                        className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold">Decision Note: </span>
                      <span className="italic">{req.hostNote || 'No special note'}</span>
                      {req.reviewedAt && (
                        <span className="text-slate-400 block text-[10px] mt-0.5">
                          Reviewed {shortDate(req.reviewedAt)} by {req.reviewedBy}
                        </span>
                      )}
                    </div>
                  )}

                  <a
                    href={`/order/${req.orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand hover:underline font-semibold"
                  >
                    View Order Details ↗
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Action Review Modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmAction}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {actionTarget.requestId} · Order #{actionTarget.orderId}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {actionType === 'accepted' ? 'Accept Request' : 'Reject Request'}
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {actionType === 'accepted' ? 'Pickup / Return Instructions for Customer' : 'Rejection Reason'}
              </label>
              <textarea
                value={hostNote}
                onChange={(e) => setHostNote(e.target.value)}
                rows={4}
                required
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs outline-none focus:border-brand"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This note is displayed in real time directly on the customer&apos;s order item.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingAction}
                className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition ${
                  actionType === 'accepted' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {savingAction ? 'Saving…' : actionType === 'accepted' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden border border-neutral-700 bg-black">
            <img src={previewPhoto} alt="Customer upload preview" className="w-full h-full object-contain" />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
