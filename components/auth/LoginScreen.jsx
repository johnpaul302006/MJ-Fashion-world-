'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

function EyeIcon({ show }) {
  return show ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function LoginScreen({ storeName }) {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      router.replace(data.role === 'host' ? '/admin' : '/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8f8f8] dark:bg-[#0f0f0f]">

      {/* ── LEFT panel — fashion visual ─────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#111]">
        {/* Geometric pattern */}
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #111 0%, #1a0a0a 40%, #2a0a0a 70%, #cc0000 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo top */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg leading-none">MJ</span>
            </div>
            <span className="font-black text-white text-xl tracking-tight">
              {storeName || 'MJ FASHION'}
            </span>
          </div>

          {/* Middle copy */}
          <div className="fade-up">
            <p className="text-brand text-xs font-bold tracking-[0.25em] uppercase mb-4">Welcome Back</p>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-5">
              Your Style,<br />
              Your Story.
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Discover the latest fashion for the whole family.
              Boys, Girls, Children, Men &amp; Women — all under one roof.
            </p>
          </div>

          {/* Bottom badges */}
          <div className="flex flex-wrap gap-3">
            {['Easy UPI Payment', 'Fast Delivery', '7-Day Returns'].map((b) => (
              <span key={b} className="bg-white/10 text-white text-xs font-medium px-3 py-1.5 border border-white/10">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT panel — login form ────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand flex items-center justify-center">
              <span className="text-white font-black text-sm leading-none">MJ</span>
            </div>
            <span className="font-black text-gray-900 dark:text-white text-lg">
              {storeName || 'MJ FASHION'}
            </span>
          </div>

          <div className="fade-up">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
              Sign In
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Enter your credentials to access the store
            </p>

            <form onSubmit={submit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border-2 border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] dark:text-white rounded-sm px-4 py-3 text-sm outline-none focus:border-brand transition-colors placeholder-gray-300 dark:placeholder-gray-600"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-2 border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] dark:text-white rounded-sm px-4 py-3 pr-11 text-sm outline-none focus:border-brand transition-colors placeholder-gray-300 dark:placeholder-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand transition-colors"
                    tabIndex={-1}
                  >
                    <EyeIcon show={showPw} />
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-sm font-medium">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full bg-brand hover:bg-brand-dark disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-black py-3.5 text-sm tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed shadow-sm hover:shadow-md overflow-hidden mt-2"
              >
                <span aria-hidden className="shine absolute inset-0 pointer-events-none" />
                {loading ? 'Opening Store...' : 'Login & Enter Store'}
              </button>
            </form>

            {/* Help text */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222] rounded-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Access Guide</span>
                <b>Shop Owner:</b> Login with your host email + admin password to unlock product management.<br />
                <b>Customers:</b> Any email + password (4+ characters) works to shop.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}