'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthLayout from '@/components/auth/AuthLayout'

const inputCls =
  'w-full border-2 border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] dark:text-white rounded-sm px-4 py-3 text-sm outline-none focus:border-brand transition-colors placeholder-gray-300 dark:placeholder-gray-600'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [resetUrl, setResetUrl] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      // Pre-fill the identifier if the user arrived from the login page
      try {
        const params = new URLSearchParams(window.location.search)
        const pre = params.get('identifier')
        if (pre && !identifier) setIdentifier(pre)
      } catch {}
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setDone(true)
      setMessage(data.message || '')
      setResetUrl(data.resetUrl || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your registered email or mobile number — we'll help you reset your password"
      footer={
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Remembered it?{' '}
          <Link href="/login" className="font-bold text-brand hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {done ? (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-300 text-sm px-4 py-3 rounded-sm leading-relaxed">
            {message ||
              'If an account exists with those details, a password reset link will be sent. Check your inbox.'}
          </div>

          {resetUrl ? (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-4 rounded-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-2">
                Your personal reset link
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mb-3 leading-relaxed">
                Email delivery isn&apos;t configured on this store, so use this one-time link
                (valid for 30 minutes):
              </p>
              <Link
                href={resetUrl}
                className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 text-sm tracking-wider uppercase transition-colors"
              >
                Reset my password →
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
              Email or Mobile Number
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or 9876543210"
              className={inputCls}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-black py-3.5 text-sm tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed shadow-sm hover:shadow-md mt-2"
          >
            {busy ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
