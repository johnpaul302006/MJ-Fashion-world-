'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    user: null,
    offers: [],
    announcements: [],
    announcement: '',
    paymentGateways: { razorpay: false, stripe: false },
  })

  const refresh = useCallback(async (extra) => {
    if (extra) {
      setState((s) => ({
        ...s,
        ...(extra.user !== undefined ? { user: extra.user } : {}),
        ...(extra.offers ? { offers: extra.offers } : {}),
        loading: false,
      }))
      return
    }
    try {
      const res = await fetch('/api/me')
      const data = await res.json()
      setState({
        loading: false,
        user: data.user,
        offers: data.offers || [],
        announcements: data.announcements || [],
        announcement: data.announcement || '',
        paymentGateways: data.paymentGateways || { razorpay: false, stripe: false },
      })
    } catch {
      setState((s) => ({ ...s, loading: false, user: null }))
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => refresh(), 0)
    return () => clearTimeout(t)
  }, [refresh])

  // identifier can be an email address OR a mobile number
  async function login(identifier, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    await refresh()
    return data
  }

  async function signup(payload) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw Object.assign(new Error(data.error || 'Sign up failed'), { fieldErrors: data.fieldErrors })
    await refresh()
    return data
  }

  async function logout() {
    await fetch('/api/login', { method: 'DELETE' })
    setState((s) => ({ ...s, user: null }))
  }

  const value = {
    ...state,
    hosting: state.user?.role === 'host',
    user: state.user,
    login,
    signup,
    logout,
    refresh,
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
