'use client'

import { useState } from 'react'

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-anim relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="blob-2 absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="blob-3 absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-600/20 blur-3xl" />
      </div>

      <form
        onSubmit={submit}
        className="card-in relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-2xl shadow-[0_25px_80px_-20px_rgba(139,92,246,0.45)] sm:p-8"
      >
        <div className="mb-6 text-center">
          <div className="fade-up mx-auto mb-4 inline-flex rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/40 to-fuchsia-600/20 p-3 text-3xl shadow-[0_0_35px_rgba(139,92,246,0.35)]">
            <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="fade-up anim-delay-1 bg-gradient-to-r from-violet-300 via-white to-fuchsia-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            Seller Login
          </h1>
          <p className="fade-up anim-delay-2 mt-1.5 text-sm text-slate-400">
            Enter your admin password (set in .env.local as ADMIN_PASSWORD)
          </p>
        </div>

        <label className="fade-up anim-delay-2 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Password
          </span>
          <div className="group relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-violet-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none backdrop-blur transition-all duration-200 focus:border-violet-500/60 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.15)]"
            />
          </div>
        </label>

        {error ? (
          <p className="fade-up mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="fade-up anim-delay-3 group relative mt-6 w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-[0_12px_35px_-10px_rgba(139,92,246,0.7)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_15px_45px_-10px_rgba(139,92,246,0.9)] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
        >
          <span aria-hidden className="shine absolute inset-0" />
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>
    </div>
  )
}