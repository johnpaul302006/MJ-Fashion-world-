'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import AuthLayout from '@/components/auth/AuthLayout'

const inputCls =
  'w-full border-2 border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] dark:text-white rounded-sm px-4 py-3 text-sm outline-none focus:border-brand transition-colors placeholder-gray-300 dark:placeholder-gray-600'
const errCls = 'text-xs text-red-600 dark:text-red-400 mt-1 font-medium'

function Field({ label, error, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-[11px] text-gray-400 mt-1">{hint}</p> : null}
      {error ? <p className={errCls}>{error}</p> : null}
    </div>
  )
}

export default function SignupPage() {
  const { signup, user, loading } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [nextPath, setNextPath] = useState('/')
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    const t = setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search)
        const n = params.get('next')
        if (n && n.startsWith('/') && !n.startsWith('//')) setNextPath(n)
      } catch {}
    }, 0)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath || '/')
      router.refresh()
    }
  }, [loading, user, router, nextPath])

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setFieldErrors((fe) => ({ ...fe, [k]: undefined }))
    setError('')
  }

  function validate() {
    const fe = {}
    if (form.name.trim().length < 3) fe.name = 'Enter your full name (min 3 characters)'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) fe.email = 'Enter a valid email address'
    const digits = form.phone.replace(/[^0-9]/g, '')
    if (!/^(91)?0?[6-9][0-9]{9}$/.test(digits)) fe.phone = 'Enter a valid 10-digit mobile number'
    if (form.password.length < 8 || !/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      fe.password = 'Min 8 characters with at least one letter and one number'
    }
    if (form.confirmPassword !== form.password) fe.confirmPassword = 'Passwords do not match'
    return fe
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    const fe = validate()
    setFieldErrors(fe)
    if (Object.keys(fe).length > 0) return
    setBusy(true)
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
      })
      router.replace(nextPath || '/')
      router.refresh()
    } catch (err) {
      if (err.fieldErrors) setFieldErrors(err.fieldErrors)
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up in seconds — checkout, order history and saved addresses in one place"
      footer={
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            href={`/login${nextPath !== '/' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
            className="font-bold text-brand hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full Name" error={fieldErrors.name}>
          <input type="text" required autoComplete="name" value={form.name} onChange={set('name')}
            placeholder="Your full name" className={inputCls} />
        </Field>

        <Field label="Email" error={fieldErrors.email}>
          <input type="email" required autoComplete="email" value={form.email} onChange={set('email')}
            placeholder="you@example.com" className={inputCls} />
        </Field>

        <Field label="Mobile Number" error={fieldErrors.phone} hint="Used for delivery updates">
          <input type="tel" required autoComplete="tel" value={form.phone} onChange={set('phone')}
            placeholder="9876543210" className={inputCls} maxLength={13} />
        </Field>

        <Field label="Password" error={fieldErrors.password}>
          <input type="password" required autoComplete="new-password" value={form.password}
            onChange={set('password')} placeholder="Min 8 chars, 1 letter + 1 number" className={inputCls} />
        </Field>

        <Field label="Confirm Password" error={fieldErrors.confirmPassword}>
          <input type="password" required autoComplete="new-password" value={form.confirmPassword}
            onChange={set('confirmPassword')} placeholder="Re-enter password" className={inputCls} />
        </Field>

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
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  )
}
