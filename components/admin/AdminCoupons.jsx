'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { inr } from '@/lib/format'

function computeStatus(startsAt, expiresAt, isActive) {
  if (isActive === false) return { label: 'Inactive', color: 'bg-gray-100 dark:bg-gray-800 text-gray-500' }
  const now = new Date()
  const start = new Date(startsAt)
  const expiry = new Date(expiresAt)

  if (now < start) {
    return { label: 'Upcoming', color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' }
  }
  if (now > expiry) {
    return { label: 'Expired', color: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' }
  }
  return { label: 'Active', color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' }
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
  const [coupons, setCoupons] = useState(null)
  const [modal, setModal] = useState(null) // null | 'create' | coupon object for edit
  const [busy, setBusy] = useState(false)
  const [globalMsg, setGlobalMsg] = useState('')

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
    // Real-time polling every 5s for host view
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
    setGlobalMsg('')

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

      setGlobalMsg(`✓ Coupon "${payload.code}" ${isEditing ? 'updated' : 'created'} successfully`)
      setModal(null)
      loadCoupons()
    } catch (err) {
      setGlobalMsg(`✗ ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(c) {
    if (!confirm(`Are you sure you want to delete coupon "${c.code}"?`)) return
    try {
      const res = await fetch('/api/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c._id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setGlobalMsg(`✓ Coupon "${c.code}" removed`)
      loadCoupons()
    } catch (err) {
      setGlobalMsg(`✗ ${err.message}`)
    }
  }

  return (
    <div className="space-y-4">
      {globalMsg && (
        <div className={`p-3 rounded-lg text-sm font-semibold ${
          globalMsg.startsWith('✓') ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
        }`}>
          {globalMsg}
        </div>
      )}

      {/* Header with Create Coupon button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Coupon Codes &amp; Discounts</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create discount codes for your customers. Valid codes appear on customer notifications in real time.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-brand hover:bg-brand-dark text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>＋</span>
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupon List */}
      {!coupons ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">No coupons created yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Click &quot;Create Coupon&quot; to launch your first promotional discount.
          </p>
          <button
            onClick={openCreate}
            className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-lg"
          >
            Create Your First Coupon
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-left text-xs text-slate-500 dark:text-slate-400">
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
                {coupons.map((c) => {
                  const status = computeStatus(c.startsAt, c.expiresAt, c.isActive)
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm tracking-wider text-slate-900 dark:text-white px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                            {c.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mr-4 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200 dark:border-slate-800 my-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {modal === 'create' ? 'Create New Coupon' : `Edit Coupon: ${modal.code}`}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Code Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Coupon Code * (Letters, numbers, hyphens)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))
                  if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: null }))
                }}
                placeholder="e.g. FLASH-50, SUMMER25"
                maxLength={20}
                className={`w-full font-mono uppercase tracking-wider border rounded-lg px-3.5 py-2.5 text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                  fieldErrors.code
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-300 dark:border-slate-700 focus:border-brand'
                }`}
              />
              {fieldErrors.code && (
                <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.code}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">4–20 characters. Automatically saved in UPPERCASE.</p>
            </div>

            {/* Percentage Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  placeholder="e.g. 25"
                  className={`w-full border rounded-lg pl-3.5 pr-8 py-2.5 text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                    fieldErrors.percentage
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-300 dark:border-slate-700 focus:border-brand'
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-sm">%</span>
              </div>
              {fieldErrors.percentage && (
                <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.percentage}</p>
              )}
            </div>

            {/* StartsAt Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date and Time *
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value)
                  if (fieldErrors.startsAt) setFieldErrors((prev) => ({ ...prev, startsAt: null }))
                }}
                className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                  fieldErrors.startsAt
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-300 dark:border-slate-700 focus:border-brand'
                }`}
              />
              {fieldErrors.startsAt && (
                <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.startsAt}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">If scheduled in the future, it stays Upcoming and activates automatically.</p>
            </div>

            {/* ExpiresAt Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expiry Date and Time *
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => {
                  setExpiresAt(e.target.value)
                  if (fieldErrors.expiresAt) setFieldErrors((prev) => ({ ...prev, expiresAt: null }))
                }}
                className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                  fieldErrors.expiresAt
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-300 dark:border-slate-700 focus:border-brand'
                }`}
              />
              {fieldErrors.expiresAt && (
                <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.expiresAt}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">Must be after the start date and time.</p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-brand hover:bg-brand-dark rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Saving...' : modal === 'create' ? 'Create Coupon' : 'Update Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
