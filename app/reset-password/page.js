'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/auth/AuthLayout'

const inputCls =
  'w-full border-2 border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] dark:text-white rounded-sm px-4 py-3 text-sm outline-none focus:border-brand transition-colors placeholder-gray-300 dark:placeholder-gray-600'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    const t = setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search)
        setToken(params.get('token') || '')
      } catch {}
    }, 0)
    return () => clearTimeout(t)
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('This reset link is invalid. Please request a new one.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters with one letter and one number')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not reset your password')
      setDone(true)
      setTimeout(() => router.replace('/login'), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!token && !done && !busy) {
    // No token in URL — likely a malformed/expired link
    return (
      <AuthLayout
        title="Reset Password"
        subtitle=""
        footer={
          <p className="text-sm text-gray-500">
            <Link href="/forgot-password" className="font-bold text-brand hover:underline">
              Request a new reset link
            </Link>
          </p>
        }
      >
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-sm font-medium mb-4">
          This password reset link is invalid or incomplete.
        </div>
        <Link
          href="/forgot-password"
          className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 text-sm tracking-wider uppercase transition-colors"
        >
          Request new link
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Choose a New Password"
      subtitle="Pick something strong you don't use anywhere else"
      footer={
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <Link href="/login" className="font-bold text-brand hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {done ? (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-300 text-sm px-4 py-3 rounded-sm font-medium">
            Your password has been updated successfully. Redirecting you to sign in…
          </div>
          <Link
            href="/login"
            className="inline-block bg-brand hover:bg-brand-dark text-white font-black px-8 py-3 text-sm tracking-widest uppercase transition-colors"
          >
            Go to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 1 letter + 1 number"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
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
            {busy ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
