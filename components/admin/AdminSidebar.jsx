'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { id: 'products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { id: 'categories', label: 'Categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { id: 'orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id: 'returns', label: 'Returns & Exchanges', icon: 'M16 15v-1a4 4 0 00-4-4H4m0 0l3-3m-3 3l3 3m5 4v1a4 4 0 004 4h8m0 0l-3-3m3 3l-3 3' },
  { id: 'coupons', label: 'Coupons', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  { id: 'broadcast', label: 'Broadcast', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  badges = {},
}) {
  const sidebarRef = useRef(null)

  // Escape key closes mobile drawer
  useEffect(() => {
    if (!mobileOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onCloseMobile()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, onCloseMobile])

  return (
    <>
      {/* Mobile Drawer Backdrop (<1024px) */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container:
          - Desktop (lg): Sticky in column 1 of the grid, top: 0, height: 100dvh, NEVER overlaps content!
          - Mobile (<lg): Off-canvas drawer fixed at top-0 bottom-0 left-0, width: 256px
      */}
      <aside
        ref={sidebarRef}
        id="admin-sidebar-nav"
        className={`bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col z-50 transition-all duration-200 ease-out select-none ${
          /* Desktop Styles: sits naturally in column 1 of grid */
          'lg:sticky lg:top-0 lg:h-screen lg:max-h-[100dvh] lg:translate-x-0'
        } ${
          collapsed ? 'lg:w-[80px]' : 'lg:w-[256px]'
        } ${
          /* Mobile Drawer Styles (<lg) */
          'fixed top-0 bottom-0 left-0 w-64 max-h-[100dvh]'
        } ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header & Brand Tile */}
        <div className={`h-16 flex items-center border-b border-slate-800 shrink-0 px-3.5 ${
          collapsed ? 'justify-center lg:justify-between' : 'justify-between'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            {/* Red MJ Tile: perfectly sized so it never clips */}
            <div
              className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-black text-sm shadow-md shadow-brand/30 shrink-0 tracking-tight"
              title="MJ Fashion World Host Console"
            >
              MJ
            </div>

            {/* Brand Title (expanded state only) */}
            {!collapsed && (
              <div className="flex flex-col min-w-0 truncate">
                <span className="text-xs font-black text-white tracking-wider uppercase truncate">
                  MJ FASHION
                </span>
                <span className="text-[10px] font-bold text-amber-400 font-mono tracking-widest uppercase truncate">
                  Host Console
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-controls="admin-sidebar-nav"
            aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
            className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none transition shrink-0"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Mobile Drawer Close Button (<lg) */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Landmark */}
        <nav
          aria-label="Host Console Navigation"
          className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1.5 no-scrollbar"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            const badgeCount = badges[item.id] || 0
            const accessibleBadgeLabel = badgeCount > 0
              ? `${badgeCount} pending ${item.label.toLowerCase()}`
              : ''

            return (
              <div key={item.id} className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id)
                    onCloseMobile()
                  }}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                    collapsed
                      ? 'justify-center h-11 px-0'
                      : 'gap-3 px-3 py-2.5 justify-start'
                  } ${
                    isActive
                      ? 'bg-brand text-white shadow-md shadow-brand/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {/* SVG Icon */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 transition-transform ${
                      isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                    aria-hidden="true"
                  >
                    <path d={item.icon} />
                  </svg>

                  {/* Text Label (expanded mode) */}
                  {!collapsed && (
                    <span className="flex-1 text-left truncate tracking-tight text-xs font-semibold">
                      {item.label}
                    </span>
                  )}

                  {/* Badge count (expanded mode) */}
                  {!collapsed && badgeCount > 0 && (
                    <span
                      aria-label={accessibleBadgeLabel}
                      className={`shrink-0 inline-flex items-center justify-center text-[10px] font-black rounded-full px-1.5 py-0.5 ${
                        isActive
                          ? 'bg-white text-brand'
                          : 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}

                  {/* Badge dot indicator (collapsed mode) */}
                  {collapsed && badgeCount > 0 && (
                    <span
                      aria-label={accessibleBadgeLabel}
                      className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900"
                    />
                  )}
                </button>

                {/* Accessible Tooltip on hover / keyboard focus in collapsed mode */}
                {collapsed && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 hidden group-hover:flex group-focus-within:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-md shadow-2xl border border-slate-800 z-60 whitespace-nowrap"
                  >
                    <span>{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-1 rounded-sm">
                        {badgeCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            aria-label="Open storefront in new tab"
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
              collapsed ? 'h-10 px-0' : 'px-3 py-2 text-xs font-semibold'
            }`}
            title="Open Storefront ↗"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {!collapsed && <span>Storefront ↗</span>}
          </Link>
        </div>
      </aside>
    </>
  )
}
