'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AdminConsoleContext = createContext(null)

export function AdminConsoleProvider({ children }) {
  const [authed, setAuthed] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('products')
  const [badges, setBadges] = useState({ orders: 0, returns: 0 })
  const [dbOk, setDbOk] = useState(true)

  // Check auth session
  useEffect(() => {
    let ignore = false
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => {
        if (!ignore) setAuthed(Boolean(d.ok))
      })
      .catch(() => {
        if (!ignore) setAuthed(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  const setSidebarCollapsed = useCallback((val) => {
    setSidebarCollapsedState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev)
  }, [setSidebarCollapsed])

  // Sync CSS variable --sidebar-w on the document or shell root
  useEffect(() => {
    const width = sidebarCollapsed ? '80px' : '256px'
    document.documentElement.style.setProperty('--sidebar-w', width)
  }, [sidebarCollapsed])

  // Mobile body scroll lock when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Periodic badge & health fetcher
  useEffect(() => {
    let active = true

    async function checkHealthAndBadges() {
      try {
        const [healthRes, ordersRes, returnsRes] = await Promise.allSettled([
          fetch('/api/health').then((r) => r.json()),
          fetch('/api/orders').then((r) => r.json()),
          fetch('/api/returns?status=pending').then((r) => r.json()),
        ])

        if (!active) return

        if (healthRes.status === 'fulfilled' && healthRes.value) {
          setDbOk(Boolean(healthRes.value.db))
        }

        let pendingOrders = 0
        let pendingReturns = 0

        if (ordersRes.status === 'fulfilled' && ordersRes.value?.orders) {
          pendingOrders = ordersRes.value.orders.filter((o) => o.status === 'pending').length
        }
        if (returnsRes.status === 'fulfilled' && returnsRes.value?.requests) {
          pendingReturns = returnsRes.value.requests.length
        }

        setBadges({
          orders: pendingOrders,
          returns: pendingReturns,
        })
      } catch {}
    }

    checkHealthAndBadges()
    const timer = setInterval(checkHealthAndBadges, 25000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const value = {
    authed,
    setAuthed,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    mobileOpen,
    setMobileOpen,
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
    activeTab,
    setActiveTab,
    badges,
    setBadges,
    dbOk,
    setDbOk,
  }

  return (
    <AdminConsoleContext.Provider value={value}>
      {children}
    </AdminConsoleContext.Provider>
  )
}

export function useAdminConsole() {
  const ctx = useContext(AdminConsoleContext)
  return ctx
}
