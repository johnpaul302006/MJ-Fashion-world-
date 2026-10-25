'use client'

import { useState, useEffect } from 'react'

function TagIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export default function ProductOffers({ initialCoupons = [] }) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [copiedCode, setCopiedCode] = useState(null)

  useEffect(() => {
    if (initialCoupons.length > 0) return
    let active = true
    fetch('/api/coupons')
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.coupons)) {
          setCoupons(data.coupons.filter((c) => c.isValid !== false))
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [initialCoupons])

  function copyCode(code) {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 1800)
    })
  }

  return (
    <div className="py-3 border-y border-gray-100 dark:border-[#222] space-y-2.5">
      <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <span>Available Offers</span>
      </h3>

      <div className="space-y-2">
        {/* Real-time Active Coupons */}
        {coupons.slice(0, 3).map((coupon) => (
          <div key={coupon._id || coupon.code} className="flex items-start gap-2 text-[14px] leading-snug">
            <TagIcon />
            <div className="flex-1 text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-white">Special Offer: </span>
              Get {coupon.percentage || coupon.discountPercent}% OFF using code{' '}
              <button
                type="button"
                onClick={() => copyCode(coupon.code)}
                className="inline-flex items-center gap-1 font-mono font-bold text-[12px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors ml-1"
                title="Click to copy coupon code"
              >
                <span>{coupon.code}</span>
                <CopyIcon />
              </button>
              {copiedCode === coupon.code && (
                <span className="ml-1.5 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
                  Copied!
                </span>
              )}
            </div>
          </div>
        ))}

        {/* UPI Payment Offer */}
        <div className="flex items-start gap-2 text-[14px] leading-snug">
          <TagIcon />
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">Bank / UPI Offer: </span>
            Instant verification & prioritized 24-hr dispatch on all UPI QR payments.
          </p>
        </div>

        {/* 7-Day Free Exchange Guarantee */}
        <div className="flex items-start gap-2 text-[14px] leading-snug">
          <TagIcon />
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">Peace of Mind: </span>
            7-day doorstep exchange guarantee on size and fitting.
          </p>
        </div>
      </div>
    </div>
  )
}
