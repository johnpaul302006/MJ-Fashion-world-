'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { wishlistCount } from '@/lib/wishlist-client'

/* ─── SVG Icons ──────────────────────────────────────────── */
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function BoxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  )
}
function TicketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 010 6v3a2 2 0 002 2h16a2 2 0 002-2v-3a3 3 0 010-6V6a2 2 0 00-2-2H4a2 2 0 00-2 2z"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
      <line x1="9" y1="15" x2="9.01" y2="15"/><line x1="15" y1="15" x2="15.01" y2="15"/>
    </svg>
  )
}
function CoinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v10M9 9h6a2 2 0 010 4H9"/>
    </svg>
  )
}
function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  )
}
function MapPinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  )
}
function GiftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

export default function AccountMenu({ isOpen, onClose }) {
  const { user, hosting, logout } = useAuth()
  const [wishCount, setWishCount] = useState(0)
  const menuRef = useRef(null)
  const router = useRouter()

  // Track wishlist count
  useEffect(() => {
    const update = () => setWishCount(wishlistCount())
    update()
    window.addEventListener('wishlist-updated', update)
    return () => window.removeEventListener('wishlist-updated', update)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleLogout() {
    onClose()
    await logout()
    router.push('/')
    router.refresh()
  }

  const menuItems = [
    { label: 'My Profile', href: '/profile', icon: <UserIcon />, badge: null },
    { label: 'Orders', href: '/orders', icon: <BoxIcon />, badge: null },
    { label: 'Coupons', href: '/coupons', icon: <TicketIcon />, badge: 'New' },
    { label: 'Rewards / Supercoin', href: '/rewards', icon: <CoinIcon />, badge: null },
    { label: 'Membership / Plus', href: '/membership', icon: <StarIcon />, badge: null },
    { label: 'Saved Cards & Wallet', href: '/wallet', icon: <CardIcon />, badge: null },
    { label: 'Saved Addresses', href: '/profile#addresses', icon: <MapPinIcon />, badge: null },
    {
      label: 'Wishlist',
      href: '/wishlist',
      icon: <HeartIcon />,
      badge: wishCount > 0 ? `${wishCount}` : null,
      badgeColor: 'bg-brand text-white',
    },
    { label: 'Gift Cards', href: '/gift-cards', icon: <GiftIcon />, badge: null },
    { label: 'Notifications', href: '/notifications', icon: <BellIcon />, badge: null },
  ]

  const displayName = user?.name || user?.email?.split('@')[0] || 'Customer'

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu dropdown/drawer container */}
      <div
        ref={menuRef}
        role="dialog"
        aria-label="Account Menu"
        className="fixed md:absolute bottom-0 md:bottom-auto md:top-full right-0 left-0 md:left-auto md:mt-2.5 w-full md:w-80 bg-white dark:bg-[#161616] md:rounded-lg rounded-t-2xl shadow-2xl border border-gray-100 dark:border-[#2a2a2a] z-50 overflow-hidden max-h-[90vh] md:max-h-[82vh] flex flex-col slide-down"
      >
        {/* Top Header / Profile banner */}
        <div className="bg-gradient-to-r from-gray-900 to-[#1a1a1a] dark:from-black dark:to-[#1a1a1a] text-white p-4 sm:p-5 relative shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-base shadow-inner">
                {user ? displayName.charAt(0).toUpperCase() : <UserIcon />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-light">Your Account</p>
                <h3 className="text-base font-black truncate text-white leading-tight">
                  {user ? displayName : 'Welcome Guest'}
                </h3>
                {user?.email && (
                  <p className="text-xs text-gray-300 truncate max-w-[190px] mt-0.5 font-normal">
                    {user.email}
                  </p>
                )}
                {user?.phone && !user?.email && (
                  <p className="text-xs text-gray-300 truncate max-w-[190px] mt-0.5 font-mono">
                    {user.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-full transition-colors"
              aria-label="Close Account Menu"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Role badge */}
          {hosting && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase">
              <ShieldIcon />
              <span>Host Administrator</span>
            </div>
          )}

          {/* Unauthenticated Login / Register CTA */}
          {!user && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="flex-1 bg-brand hover:bg-brand-dark text-white text-xs font-bold py-2 px-3 rounded text-center tracking-wider uppercase transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 px-3 rounded text-center tracking-wider uppercase border border-white/20 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div className="overflow-y-auto divide-y divide-gray-100 dark:divide-[#242424] py-1 flex-1">
          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#202020] hover:text-brand dark:hover:text-brand transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 dark:text-gray-500 group-hover:text-brand dark:group-hover:text-brand transition-colors shrink-0">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <span className="text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 transition-transform">
                    <ChevronRightIcon />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Track by number option */}
          <div className="py-1">
            <Link
              href="/track-order"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-brand hover:bg-red-50/50 dark:hover:bg-[#201515] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-brand shrink-0">
                  <BoxIcon />
                </span>
                <span>Track Order by Phone</span>
              </div>
              <ChevronRightIcon />
            </Link>
          </div>

          {/* Host Panel (if store host) */}
          {hosting && (
            <div className="py-1">
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center justify-between px-4 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-[#262005] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShieldIcon />
                  <span>Host Management Panel</span>
                </div>
                <ChevronRightIcon />
              </Link>
            </div>
          )}
        </div>

        {/* Footer with Logout */}
        {user ? (
          <div className="p-3 bg-gray-50 dark:bg-[#1f1f1f] border-t border-gray-100 dark:border-[#2a2a2a] shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors uppercase tracking-wider"
            >
              <LogoutIcon />
              <span>Log Out</span>
            </button>
          </div>
        ) : null}
      </div>
    </>
  )
}
