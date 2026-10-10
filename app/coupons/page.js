'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'

function formatValidDate(d) {
  if (!d) return 'Limited time'
  const date = new Date(d)
  if (isNaN(date.getTime())) return 'Limited time'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CouponsPage() {
  const { hosting } = useAuth()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadCoupons() {
      try {
        const res = await fetch('/api/coupons')
        const data = await res.json()
        if (mounted && Array.isArray(data.coupons)) {
          setCoupons(data.coupons)
        }
      } catch (err) {
        console.error('Failed to load coupons:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadCoupons()
    return () => {
      mounted = false
    }
  }, [])

  const handleCopy = (code) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = code
        textarea.style.position = 'fixed'
        textarea.style.left = '-999999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(''), 2500)
    } catch {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(''), 2500)
    }
  }

  return (
    <div className="min-h-[80vh] px-4 py-8 sm:py-12 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6 font-mono">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <span className="text-white">Coupons &amp; Offers</span>
      </nav>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#cc0000]/10 border border-[#cc0000]/20 text-[#cc0000] mb-3">
            <span>🎟</span> Available Offers
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Exclusive Coupons &amp; Discounts
          </h1>
          <p className="text-sm text-neutral-400">
            Apply these coupon codes during checkout to enjoy additional savings on your orders.
          </p>
        </div>

        {/* Host action button */}
        {hosting && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition shrink-0"
          >
            <span>＋</span>
            <span>Create / Manage Coupons</span>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-[#cc0000] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-3 text-neutral-600">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h3 className="font-bold text-white text-lg mb-1">No coupons available right now</h3>
          <p className="text-sm text-neutral-400 mb-6">
            Check back soon for new offers, or start browsing our trending collections.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((c) => {
            const pct = c.percentage || c.discountPercent || 0
            return (
              <div
                key={c.code}
                className="bg-[#161616] border border-neutral-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between hover:border-neutral-700 transition shadow-lg group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#cc0000]/5 rounded-bl-full pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {pct}% OFF
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {c.expiresAt ? `Valid till ${formatValidDate(c.expiresAt)}` : 'Active Offer'}
                    </span>
                  </div>

                  <div className="bg-neutral-900 border border-dashed border-neutral-700 rounded-xl p-3 flex items-center justify-between mb-3 group-hover:border-[#cc0000]/50 transition">
                    <span className="font-mono font-bold text-white tracking-wider text-base">
                      {c.code}
                    </span>
                    <button
                      onClick={() => handleCopy(c.code)}
                      className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-[#cc0000] text-white text-xs font-semibold transition cursor-pointer"
                    >
                      {copiedCode === c.code ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Get an instant {pct}% discount at checkout on your order subtotal.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
                  <span>Terms &amp; Conditions apply</span>
                  <Link href="/checkout" className="text-[#cc0000] hover:underline font-bold">
                    Use in Checkout →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
