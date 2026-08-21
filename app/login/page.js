'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import AuthLayout from '@/components/auth/AuthLayout'

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

const inputCls =
  'w-full border-2 border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] dark:text-white rounded-sm px-4 py-3 text-sm outline-none focus:border-brand transition-colors placeholder-gray-300 dark:placeholder-gray-600'

export default function LoginPage() {
  const { login, user, loading } = useAuth()
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [nextPath, setNextPath] = useState('/')
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    // Preserve the page the visitor came from (e.g. /checkout)
    const t = setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search)
        const n = params.get('next')
        if (n && n.startsWith('/') && !n.startsWith('//')) setNextPath(n)
      } catch {}
    }, 0)
    return () => clearTimeout(t)
  }, [])

  // Already signed in? Go straight to the destination.
  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath || '/')
      router.refresh()
    }
  }, [loading, user, router, nextPath])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await login(identifier.trim(), password)
      const dest =
        nextPath !== '/' ? nextPath : data.role === 'host' ? '/admin' : '/'
      router.replace(dest)
      router.refresh()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Sign In"
      subtitle="Use your email or mobile number to access your account"
      footer={
        <div className="text-sm space-y-2">
          <p className="text-gray-500 dark:text-gray-400">
            New here?{' '}
            <Link
              href={`/signup${nextPath !== '/' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
              className="font-bold text-brand hover:underline"
            >
              Create an account
            </Link>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            Browsing never needs an account — you only sign in to place orders, track them and
            save addresses. Store owner: log in with your host email + admin password.
          </p>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
            Email or Mobile Number
          </label>
          <input
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or 9876543210"
            className={inputCls}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Password
            </label>
            <Link
              href={`/forgot-password${identifier.includes('@') ? `?identifier=${encodeURIComponent(identifier.trim())}` : ''}`}
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand transition-colors"
              tabIndex={-1}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              <EyeIcon show={showPw} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="relative w-full bg-brand hover:bg-brand-dark disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-black py-3.5 text-sm tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed shadow-sm hover:shadow-md overflow-hidden mt-2"
        >
          <span aria-hidden className="shine absolute inset-0 pointer-events-none" />
          {busy ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </AuthLayout>
  )
}
