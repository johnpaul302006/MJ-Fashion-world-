'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { inr } from '@/lib/format'
import { useAdminToast } from './AdminToast'
import AdminConfirmModal from './AdminConfirmModal'

function computeStatus(startsAt, expiresAt, isActive) {
  if (isActive === false) return { label: 'Inactive', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500' }
  const now = new Date()
  const start = new Date(startsAt)
  const expiry = new Date(expiresAt)

  if (now < start) {
    return {
      label: 'Upcoming',
      color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900',
    }
  }
  if (now > expiry) {
    return {
      label: 'Expired',
      color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900',
    }
  }
  return {
    label: 'Active',
    color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900',
  }
}

function formatDateForInput(d) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const MM = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}

function formatDisplayDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export default function AdminCoupons() {
  const { showSuccess, showError } = useAdminToast()
  const [coupons, setCoupons] = useState(null)
  const [modal, setModal] = useState(null) // null | 'create' | coupon object for edit
  const [busy, setBusy] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'Active' | 'Upcoming' | 'Expired'
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state
  const [code, setCode] = useState('')
  const [percentage, setPercentage] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const loadCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/coupons')
      const data = await res.json()
      setCoupons(data.coupons || [])
    } catch {
      setCoupons([])
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadCoupons(), 0)
    const interval = setInterval(loadCoupons, 5000)
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [loadCoupons])

  function openCreate() {
    const now = new Date()
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    setCode('')
    setPercentage('20')
    setStartsAt(formatDateForInput(now))
    setExpiresAt(formatDateForInput(nextMonth))
    setFieldErrors({})
    setModal('create')
  }

  function openEdit(c) {
    setCode(c.code)
    setPercentage(String(c.percentage || c.discountPercent || ''))
    setStartsAt(formatDateForInput(c.startsAt))
    setExpiresAt(formatDateForInput(c.expiresAt))
    setFieldErrors({})
    setModal(c)
  }

  function applyPresetDuration(days) {
    const start = startsAt ? new Date(startsAt) : new Date()
    const nextDate = new Date(start.getTime() + days * 24 * 60 * 60 * 1000)
    setExpiresAt(formatDateForInput(nextDate))
  }

  function copyCode(cCode) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cCode)
      showSuccess(`Coupon code "${cCode}" copied!`)
    }
  }

  function validateForm() {
    const errors = {}
    const cleanCode = code.trim().toUpperCase()

    if (!cleanCode) {
      errors.code = 'Coupon code is required'
    } else if (cleanCode.length < 4 || cleanCode.length > 20) {
      errors.code = 'Code must be between 4 and 20 characters'
    } else if (!/^[A-Z0-9-]+$/.test(cleanCode)) {
      errors.code = 'Only letters, numbers, and hyphens (-) allowed'
    }

    const pct = Number(percentage)
    if (isNaN(pct) || pct < 1 || pct > 90) {
      errors.percentage = 'Percentage must be between 1% and 90%'
    }

    if (!startsAt) {
      errors.startsAt = 'Start date and time is required'
    }
    if (!expiresAt) {
      errors.expiresAt = 'Expiry date and time is required'
    } else if (startsAt && new Date(expiresAt) <= new Date(startsAt)) {
      errors.expiresAt = 'Expiry date must be after the start date'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!validateForm()) return

    setBusy(true)
    const payload = {
      code: code.trim().toUpperCase(),
      percentage: Number(percentage),
      startsAt: new Date(startsAt).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
    }

    try {
      const isEditing = modal && modal !== 'create'
      const res = await fetch('/api/coupons', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { ...payload, id: modal._id } : payload),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 || data.error?.includes('already exists')) {
          setFieldErrors({ code: 'This coupon code already exists. Please choose a unique code.' })
          return
        }
        throw new Error(data.error || 'Failed to save coupon')
      }

      showSuccess(`Coupon "${payload.code}" ${isEditing ? 'updated' : 'created'} successfully`)
      setModal(null)
      loadCoupons()
    } catch (err) {
      showError(err.message || 'Error saving coupon')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDeleteCoupon() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch('/api/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget._id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      showSuccess(`Coupon "${deleteTarget.code}" removed`)
      setDeleteTarget(null)
      loadCoupons()
    } catch (err) {
      showError(err.message || 'Error deleting coupon')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredCoupons = useMemo(() => {
    if (!coupons) return []
    if (statusFilter === 'all') return coupons

    return coupons.filter((c) => {
      const s = computeStatus(c.startsAt, c.expiresAt, c.isActive)
      return s.label === statusFilter
    })
  }, [coupons, statusFilter])

  return (
    <div className="space-y-4">
      {/* Header and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Coupon Codes &amp; Discounts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active coupons appear across customer notification banners and auto-apply at checkout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {['all', 'Active', 'Upcoming', 'Expired'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition ${
                  statusFilter === f
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="shrink-0 bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Coupon List Table / Empty State */}
      {!coupons ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 animate-pulse text-xs font-semibold">
          Loading coupons...
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1 text-sm">No coupons found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Click &quot;Create Coupon&quot; to launch your promotional discount.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition"
          >
            Create Your First Coupon
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px] text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-3">Discount</th>
                  <th className="py-3 px-3">Start Date &amp; Time</th>
                  <th className="py-3 px-3">Expiry Date &amp; Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCoupons.map((c) => {
                  const status = computeStatus(c.startsAt, c.expiresAt, c.isActive)
                  return (
                    <tr
                      key={c._id}
                      className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs sm:text-sm tracking-wider text-slate-900 dark:text-white px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyCode(c.code)}
                            title="Copy code"
                            className="text-slate-400 hover:text-brand transition p-1"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                          {c.percentage || c.discountPercent}% OFF
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-300">
                        {formatDisplayDate(c.startsAt)}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-300">
                        {formatDisplayDate(c.expiresAt)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="text-xs font-bold text-brand hover:underline mr-4 px-2 py-1 rounded-lg hover:bg-brand/10 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200 dark:border-slate-800 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                {modal === 'create' ? 'Create New Coupon' : `Edit Coupon: ${modal.code}`}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Code Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Coupon Code * (Letters, numbers, hyphens)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))
                  if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: null }))
                }}
                placeholder="e.g. FESTIVE30, FLASH-SALE"
                maxLength={20}
                className={`w-full font-mono uppercase tracking-wider border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                  fieldErrors.code
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-brand'
                }`}
              />
              {fieldErrors.code && (
                <p className="text-xs text-rose-500 font-medium mt-1">{fieldErrors.code}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">4–20 characters. Automatically saved in UPPERCASE.</p>
            </div>

            {/* Percentage Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Discount Percentage (1–90%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={percentage}
                  onChange={(e) => {
                    setPercentage(e.target.value)
                    if (fieldErrors.percentage) setFieldErrors((prev) => ({ ...prev, percentage: null }))
                  }}
                  placeholder="e.g. 20"
                  className={`w-full border rounded-xl pl-3.5 pr-8 py-2.5 text-xs sm:text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                    fieldErrors.percentage
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-brand'
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-sm">%</span>
              </div>
              {fieldErrors.percentage && (
                <p className="text-xs text-rose-500 font-medium mt-1">{fieldErrors.percentage}</p>
              )}
            </div>

            {/* StartsAt Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date and Time *
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value)
                  if (fieldErrors.startsAt) setFieldErrors((prev) => ({ ...prev, startsAt: null }))
                }}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                  fieldErrors.startsAt
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-brand'
                }`}
              />
              {fieldErrors.startsAt && (
                <p className="text-xs text-rose-500 font-medium mt-1">{fieldErrors.startsAt}</p>
              )}
            </div>

            {/* ExpiresAt Field with duration shortcuts */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Expiry Date and Time *
                </label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => applyPresetDuration(7)}
                    className="text-brand hover:underline px-1"
                  >
                    +7d
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDuration(14)}
                    className="text-brand hover:underline px-1"
                  >
                    +14d
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDuration(30)}
                    className="text-brand hover:underline px-1"
                  >
                    +30d
                  </button>
                </div>
              </div>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => {
                  setExpiresAt(e.target.value)
                  if (fieldErrors.expiresAt) setFieldErrors((prev) => ({ ...prev, expiresAt: null }))
                }}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                  fieldErrors.expiresAt
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-brand'
                }`}
              />
              {fieldErrors.expiresAt && (
                <p className="text-xs text-rose-500 font-medium mt-1">{fieldErrors.expiresAt}</p>
              )}
            </div>

            <div className="pt-2 flex gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-brand hover:bg-brand-dark rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {busy ? 'Saving...' : modal === 'create' ? 'Create Coupon' : 'Update Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Delete Coupon Dialog */}
      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon "${deleteTarget?.code}"? Customers will no longer be able to apply this discount.`}
        confirmLabel="Delete Coupon"
        cancelLabel="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={confirmDeleteCoupon}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
