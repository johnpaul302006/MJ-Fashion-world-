'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, offers: [], announcements: [], announcement: '' })

  const refresh = useCallback(async (extra) => {
    if (extra) {
      setState((s) => ({ ...s, user: extra.user || s.user, offers: extra.offers || s.offers, loading: false }))
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
      })
    } catch {
      setState({ loading: false, user: null, offers: [], announcements: [], announcement: '' })
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => refresh(), 0)
    return () => clearTimeout(t)
  }, [refresh])

  async function login(email, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    await refresh({ user: { email: data.email, role: data.role } })
    return data
  }

  async function logout() {
    await fetch('/api/login', { method: 'DELETE' })
    setState({ loading: false, user: null, offers: [] })
  }

  const value = {
    ...state,
    hosting: state.user?.role === 'host',
    user: state.user,
    login,
    logout,
    refresh,
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}