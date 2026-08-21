'use client'

import Link from 'next/link'

// Shared split-screen layout for all account pages (login, signup,
// forgot/reset password). Mirrors the original store design language.
export default function AuthLayout({ storeName, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex bg-[#f8f8f8] dark:bg-[#0f0f0f]">
      {/* ── LEFT panel — fashion visual ─────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#111]">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #111 0%, #1a0a0a 40%, #2a0a0a 70%, #cc0000 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-brand flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg leading-none">MJ</span>
            </div>
            <span className="font-black text-white text-xl tracking-tight group-hover:text-brand transition-colors">
              {storeName || 'MJ FASHION'}
            </span>
          </Link>

          <div className="fade-up">
            <p className="text-brand text-xs font-bold tracking-[0.25em] uppercase mb-4">
              Welcome
            </p>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-5">
              Your Style,
              <br />
              Your Story.
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Discover the latest fashion for the whole family. Boys, Girls, Children, Men &amp;
              Women — all under one roof.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {['Secure Checkout', 'Razorpay & Stripe', 'Fast Delivery', '7-Day Returns'].map((b) => (
              <span
                key={b}
                className="bg-white/10 text-white text-xs font-medium px-3 py-1.5 border border-white/10"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT panel — form ────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand flex items-center justify-center">
                <span className="text-white font-black text-sm leading-none">MJ</span>
              </div>
              <span className="font-black text-gray-900 dark:text-white text-lg">
                {storeName || 'MJ FASHION'}
              </span>
            </Link>
          </div>

          <div className="fade-up">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{title}</h2>
            {subtitle ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{subtitle}</p>
            ) : (
              <div className="mb-8" />
            )}
            {children}
            {footer ? <div className="mt-8">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
