'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function formatValidDate(d) {
  if (!d) return 'Limited time'
  const date = new Date(d)
  if (isNaN(date.getTime())) return 'Limited time'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [coupons, setCoupons] = useState([])
  const [activeCoupons, setActiveCoupons] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [copiedCode, setCopiedCode] = useState('')
  const [toast, setToast] = useState(null) // { code, percentage }
  const panelRef = useRef(null)
  const previousCodesRef = useRef(new Set())
  const initialLoadRef = useRef(true)

  // 1. Fetch coupons from server
  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/coupons')
      const data = await res.json()
      if (Array.isArray(data.coupons)) {
        setCoupons(data.coupons)
      }
    } catch {
      // Non-fatal
    }
  }, [])

  // 2. Poll every 6 seconds for real-time coupon arrival
  useEffect(() => {
    const t = setTimeout(() => fetchCoupons(), 0)
    const interval = setInterval(fetchCoupons, 6000)
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [fetchCoupons])

  // 3. Client timer: update active coupons every 2 seconds
  // (promotes upcoming coupons when startsAt arrives, expires them when expiresAt passes)
  useEffect(() => {
    function evaluateActive() {
      const now = new Date()
      const valid = coupons.filter((c) => {
        if (c.isActive === false) return false
        const start = c.startsAt ? new Date(c.startsAt) : null
        const expiry = c.expiresAt ? new Date(c.expiresAt) : null
        if (start && start > now) return false
        if (expiry && expiry <= now) return false
        return true
      })

      setActiveCoupons(valid)

      // Detect newly live coupons during session and trigger subtle toast
      const currentCodes = new Set(valid.map((c) => c.code))
      if (!initialLoadRef.current) {
        for (const c of valid) {
          if (!previousCodesRef.current.has(c.code)) {
            // New coupon detected!
            setToast({ code: c.code, percentage: c.percentage || c.discountPercent })
            break
          }
        }
      } else {
        initialLoadRef.current = false
      }
      previousCodesRef.current = currentCodes

      // Calculate unread count using localStorage
      try {
        const seen = JSON.parse(localStorage.getItem('seen_coupon_codes') || '[]')
        const unseen = valid.filter((c) => !seen.includes(c.code))
        setUnreadCount(unseen.length)
      } catch {
        setUnreadCount(valid.length)
      }
    }

    evaluateActive()
    const timer = setInterval(evaluateActive, 2000)
    return () => clearInterval(timer)
  }, [coupons])

  // 4. Auto-hide toast after 5 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  // 5. When user opens panel, mark coupons as seen
  const handleToggle = () => {
    const nextState = !open
    setOpen(nextState)
    if (nextState) {
      try {
        const allCodes = activeCoupons.map((c) => c.code)
        localStorage.setItem('seen_coupon_codes', JSON.stringify(allCodes))
        setUnreadCount(0)
      } catch {
        setUnreadCount(0)
      }
    }
  }

  // 6. Close on Escape or click outside
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  // 7. Robust copy to clipboard (Clipboard API + textarea fallback)
  const copyCode = async (codeToCopy) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(codeToCopy)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = codeToCopy
        textarea.style.position = 'fixed'
        textarea.style.left = '-999999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopiedCode(codeToCopy)
      setTimeout(() => setCopiedCode(''), 2500)
    } catch {
      setCopiedCode(codeToCopy)
      setTimeout(() => setCopiedCode(''), 2500)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell Icon Button ─────────────────────── */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Offers and Notifications"
        aria-expanded={open}
        className={`relative p-2 rounded-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors flex flex-col items-center cursor-pointer ${
          open ? 'text-brand dark:text-brand bg-gray-100 dark:bg-[#222]' : ''
        }`}
        title="Offers &amp; Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-[#cc0000] text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
        <span className="text-[9px] font-medium mt-0.5 hidden lg:block text-gray-500">Offers</span>
      </button>

      {/* ── Live Toast Notification ─────────────── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-60 bg-[#111] dark:bg-white text-white dark:text-[#111] p-4 rounded-xl shadow-2xl border border-gray-700 dark:border-gray-200 flex items-center gap-3 animate-bounce">
          <div className="w-9 h-9 rounded-full bg-[#cc0000] text-white flex items-center justify-center font-bold text-sm shrink-0">
            %
          </div>
          <div className="text-xs">
            <p className="font-bold text-sm">New Offer Just Went Live!</p>
            <p className="text-gray-300 dark:text-gray-600">
              Use code <span className="font-mono font-bold text-amber-400 dark:text-amber-600">{toast.code}</span> for{' '}
              <span className="font-bold">{toast.percentage}% OFF</span>
            </p>
          </div>
          <button
            onClick={() => copyCode(toast.code)}
            className="ml-2 px-3 py-1.5 bg-[#cc0000] hover:bg-red-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
          >
            {copiedCode === toast.code ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-white dark:hover:text-black p-1 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Dropdown Panel ───────────────────────── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#161616] rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gray-50/70 dark:bg-neutral-900/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                Offers &amp; Coupons
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {activeCoupons.length} Active
            </span>
          </div>

          {/* List of valid coupons */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-neutral-800 p-2 space-y-2">
            {activeCoupons.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">
                  No offers right now
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Check back soon for exclusive flash deals, discount vouchers, and seasonal codes!
                </p>
              </div>
            ) : (
              activeCoupons.map((c) => {
                const isCopied = copiedCode === c.code
                const pct = c.percentage || c.discountPercent
                return (
                  <div
                    key={c.code}
                    className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-[#1f1f1f] border border-gray-100 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm tracking-widest text-[#cc0000] bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/60">
                            {c.code}
                          </span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {pct}% OFF
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          Valid till {formatValidDate(c.expiresAt)}
                        </p>
                      </div>

                      {/* One-tap Copy Button */}
                      <button
                        type="button"
                        onClick={() => copyCode(c.code)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-brand text-gray-800 dark:text-gray-200 hover:text-brand'
                        }`}
                        title="Copy coupon code"
                      >
                        {isCopied ? (
                          <>
                            <CheckIcon />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-gray-400">
                      Apply this code during checkout to save {pct}% off your order subtotal.
                    </p>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer with link to checkout */}
          <div className="p-3 bg-gray-50 dark:bg-neutral-900/80 border-t border-gray-100 dark:border-neutral-800 text-center">
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-[#cc0000] hover:underline"
            >
              Go to Checkout &amp; Apply Coupon →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
