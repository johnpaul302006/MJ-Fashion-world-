'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { NAV_ITEMS } from './AdminSidebar'
import { useAdminConsole } from './AdminConsoleContext'

export default function AdminTopBar({
  activeTab: propActiveTab,
  onOpenMobile: propOnOpenMobile,
  dbOk: propDbOk,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search across dashboard...',
  showSearch = false,
}) {
  const router = useRouter()
  const consoleCtx = useAdminConsole()
  const activeTab = propActiveTab || consoleCtx?.activeTab || 'products'
  const onOpenMobile = propOnOpenMobile || consoleCtx?.openMobile || (() => {})
  const dbOk = propDbOk !== undefined ? propDbOk : (consoleCtx ? consoleCtx.dbOk : true)

  const [loggingOut, setLoggingOut] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDarkNow = document.documentElement.classList.contains('dark')
      requestAnimationFrame(() => {
        setIsDark(isDarkNow)
      })
    }
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch('/api/auth', { method: 'DELETE' })
      await fetch('/api/login', { method: 'DELETE' })
    } catch {
      // ignore
    } finally {
      router.push('/')
      router.refresh()
    }
  }

  const currentItem = NAV_ITEMS.find((item) => item.id === activeTab) || {
    label: 'Dashboard',
    id: 'dashboard',
  }

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile hamburger + Active Tab Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open sidebar"
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize truncate">
              {currentItem.label}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Host
            </span>
          </div>
          <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
            MJ Fashion World Console
          </p>
        </div>
      </div>

      {/* Middle: Optional Global / Tab Filter Search */}
      {showSearch && onSearchChange && (
        <div className="hidden md:flex flex-1 max-w-xs items-center relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 text-slate-400 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-brand focus:bg-white dark:focus:bg-slate-900 outline-none transition text-slate-800 dark:text-slate-200"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* DB Status Badge */}
        <div
          title={dbOk ? 'Database Connected & Syncing' : 'Database Offline / Demo Mode'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
            dbOk
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 animate-pulse'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              dbOk ? 'bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-800' : 'bg-amber-500'
            }`}
          />
          <span className="hidden sm:inline">{dbOk ? 'Live DB' : 'Demo Mode'}</span>
        </div>

        {/* Dark/Light toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* View Storefront Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700"
        >
          <span>Store</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Link>

        {/* Host Profile Info */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            H
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-none">
              Host
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
              sjohnpaul638@gmail.com
            </span>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out of host console"
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 font-semibold px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 transition disabled:opacity-50 ml-1"
          >
            {loggingOut ? '...' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  )
}
