'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'
import { cartCount } from '@/lib/cart-client'
import { useAuth } from '@/components/auth/AuthProvider'

/* ─── SVG Icons ──────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  )
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  )
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  )
}
function PackageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

export default function Navbar({ storeName, user }) {
  const { logout, hosting } = useAuth()
  const [q, setQ] = useState('')
  const [count, setCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let saved = null
    try { saved = localStorage.getItem('theme') } catch {}
    const html = document.documentElement
    const isDark = html.classList.contains('dark')
    const applyDark = isDark || saved === 'dark'
    if (applyDark && !isDark) html.classList.add('dark')
    if (!applyDark && isDark) html.classList.remove('dark')
    const t = setTimeout(() => setDark(applyDark), 0)
    const update = () => setCount(cartCount())
    update()
    window.addEventListener('cart-updated', update)
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('cart-updated', update)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
  }

  function onSearch(e) {
    e.preventDefault()
    setMenuOpen(false)
    setSearchOpen(false)
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop')
  }

  async function onLogout() {
    await logout()
    router.push('/')
    router.refresh()
  }

  return (
    <header className={`sticky top-0 z-40 transition-shadow duration-200 ${scrolled ? 'shadow-md' : 'shadow-sm'} bg-white dark:bg-[#111]`}>

      {/* ── TOP UTILITY BAR ─────────────────────────────── */}
      <div className="bg-[#0f0f0f] dark:bg-black text-white text-[11px] font-medium border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-9 flex items-center justify-between gap-4 overflow-hidden">
          {/* Left — scrolling ticker */}
          <div className="ticker-wrap flex-1 max-w-xs hidden sm:block">
            <div className="ticker-inner gap-8 text-gray-400">
              <span className="px-6">Free delivery on orders above ₹499 &nbsp;|&nbsp; Easy 7-day returns &nbsp;|&nbsp; Pay via UPI</span>
              <span className="px-6">Free delivery on orders above ₹499 &nbsp;|&nbsp; Easy 7-day returns &nbsp;|&nbsp; Pay via UPI</span>
            </div>
          </div>
          {/* Right — utility links */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {/* User badge */}
            {user?.email ? (
              <span className="hidden lg:flex items-center gap-1.5 text-gray-400 truncate max-w-[200px] mr-1 text-[11px]">
                <span className="truncate">{user.email}</span>
                {hosting && (
                  <span className="ml-0.5 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-wider">
                    HOST
                  </span>
                )}
              </span>
            ) : null}

            {/* Host Panel */}
            {hosting ? (
              <Link
                href="/admin"
                className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-amber-400 hover:text-amber-300 hover:bg-white/5 transition-colors hidden md:flex text-[11px] font-semibold"
              >
                <ShieldIcon />
                <span>Host Panel</span>
              </Link>
            ) : null}

            {/* Track Order */}
            <Link
              href="/orders"
              className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors hidden md:flex text-[11px]"
            >
              <PackageIcon />
              <span>Track Order</span>
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              className="p-1.5 rounded-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Divider */}
            <span className="hidden md:block w-px h-4 bg-[#333] mx-1" />

            {/* Logout — single, canonical button */}
            <button
              onClick={onLogout}
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors text-[11px]"
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN HEADER ─────────────────────────────────── */}
      <div className="border-b border-gray-100 dark:border-[#1e1e1e]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3.5 flex items-center gap-4 sm:gap-6">

          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-brand flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm leading-none">MJ</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm sm:text-base text-gray-900 dark:text-white tracking-tight leading-tight group-hover:text-brand transition-colors">
                {storeName || 'MJ FASHION'}
              </span>
              <span className="text-[9px] text-gray-400 tracking-widest uppercase leading-tight hidden sm:block">
                Fashion for Everyone
              </span>
            </div>
          </Link>

          {/* Search bar — desktop */}
          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-2xl">
            <div className="flex w-full rounded-sm border border-gray-200 dark:border-[#2a2a2a] overflow-hidden shadow-sm hover:border-brand focus-within:border-brand transition-colors">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for products, brands and more..."
                className="flex-1 px-4 py-2.5 text-sm outline-none bg-white dark:bg-[#1a1a1a] dark:text-white placeholder-gray-400"
              />
              <button
                type="submit"
                className="bg-brand hover:bg-brand-dark text-white px-5 flex items-center gap-1.5 text-sm font-semibold transition-colors shrink-0"
              >
                <SearchIcon />
                <span className="hidden lg:inline">Search</span>
              </button>
            </div>
          </form>

          {/* Action icons — right */}
          <div className="flex items-center gap-0.5 sm:gap-1 ml-auto md:ml-0">

            {/* Mobile search toggle */}
            <button
              onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false) }}
              className="md:hidden p-2 rounded-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
              aria-label="Search"
            >
              <SearchIcon />
            </button>

            {/* Account */}
            <Link
              href={hosting ? '/admin' : '/orders'}
              className="p-2 rounded-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors flex-col items-center hidden sm:flex"
              title={user?.email || 'Account'}
            >
              <UserIcon />
              <span className="text-[9px] font-medium mt-0.5 hidden lg:block text-gray-500">Account</span>
            </Link>

            {/* Wishlist (UI visual) */}
            <button
              className="p-2 rounded-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors flex-col items-center hidden sm:flex"
              title="Wishlist"
            >
              <HeartIcon />
              <span className="text-[9px] font-medium mt-0.5 hidden lg:block text-gray-500">Wishlist</span>
            </button>

            {/* Cart */}
            <Link
              href="/checkout"
              className="relative p-2 rounded-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors flex flex-col items-center"
              title="Cart"
            >
              <CartIcon />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                  {count}
                </span>
              )}
              <span className="text-[9px] font-medium mt-0.5 hidden lg:block text-gray-500">Bag</span>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false) }}
              className="md:hidden p-2 rounded-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE SEARCH BAR ───────────────────────────── */}
      {searchOpen && (
        <div className="md:hidden border-b border-gray-100 dark:border-[#222] px-3 py-2 bg-white dark:bg-[#111]">
          <form onSubmit={onSearch} className="flex gap-2">
            <div className="flex flex-1 rounded-sm border border-gray-200 dark:border-[#333] overflow-hidden focus-within:border-brand transition-colors">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, brands..."
                className="flex-1 px-3 py-2.5 text-sm outline-none bg-white dark:bg-[#1a1a1a] dark:text-white placeholder-gray-400"
              />
              <button type="submit" className="bg-brand text-white px-4 flex items-center">
                <SearchIcon />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── CATEGORY NAV — Desktop ───────────────────────── */}
      <nav className="hidden md:block border-b border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((c) => (
              <div key={c.slug} className="mega-trigger relative">
                <Link
                  href={`/shop?category=${c.slug}`}
                  className="nav-link block py-3 px-1 mr-5"
                >
                  {c.label}
                </Link>
              </div>
            ))}
            <Link href="/shop?onSale=1" className="nav-link sale py-3 px-1 mr-5 font-black">
              SALE
            </Link>
            <Link href="/shop" className="nav-link py-3 px-1">
              ALL
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU ─────────────────────────────────── */}
      {menuOpen && (
        <nav className="md:hidden border-t border-gray-100 dark:border-[#222] bg-white dark:bg-[#111] slide-down">
          <div className="py-1">
            {/* User info */}
            {user?.email && (
              <div className="px-4 py-3 border-b border-gray-100 dark:border-[#222] bg-gray-50 dark:bg-[#1a1a1a]">
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                {hosting && (
                  <p className="text-[11px] font-bold text-amber-600 mt-0.5 uppercase tracking-wider">
                    Host Mode
                  </p>
                )}
              </div>
            )}

            {hosting && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3.5 text-sm font-semibold text-amber-600 dark:text-amber-400 border-b border-gray-100 dark:border-[#222] hover:bg-amber-50 dark:hover:bg-[#1e1a00] transition-colors"
              >
                <ShieldIcon />
                Host Panel
              </Link>
            )}

            {/* Categories */}
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                <span>{c.label}</span>
              </Link>
            ))}

            <Link
              href="/shop?onSale=1"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3.5 text-sm font-bold text-brand border-b border-gray-100 dark:border-[#222] hover:bg-red-50 dark:hover:bg-[#1a0a0a] transition-colors"
            >
              Sale
            </Link>

            <Link
              href="/shop"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            >
              All Products
            </Link>

            <Link
              href="/orders"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            >
              <PackageIcon />
              Track Order
            </Link>

            {/* Single logout — mobile */}
            <button
              onClick={() => { onLogout(); setMenuOpen(false) }}
              className="w-full text-left flex items-center gap-2.5 px-4 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-[#1a0a0a] transition-colors"
            >
              <LogoutIcon />
              Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}