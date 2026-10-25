'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import Navbar from './Navbar'
import Footer from './Footer'
import ChatWidget from './ChatWidget'
import OffersBar from './OffersBar'
import AnnouncementBar from './AnnouncementBar'
import { HostAddButton } from './HostProductActions'
import { AdminConsoleProvider, useAdminConsole } from './admin/AdminConsoleContext'
import AdminSidebar from './admin/AdminSidebar'

function AdminShellInner({ children, storeName, address, phone }) {
  const {
    authed,
    sidebarCollapsed,
    toggleSidebar,
    mobileOpen,
    closeMobile,
    activeTab,
    setActiveTab,
    badges,
  } = useAdminConsole()

  // If unauthenticated or loading on /admin, display clean centered auth screen without sidebar
  if (authed === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {children}
      </div>
    )
  }

  return (
    <div
      className="admin-shell-grid w-full min-h-screen"
      style={{
        '--sidebar-w': sidebarCollapsed ? '80px' : '256px',
      }}
    >
      {/* Column 1: AdminSidebar (Full height 100dvh, sticky top-0 on desktop, off-canvas on mobile) */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
        badges={badges}
      />

      {/* Column 2: Content Column — all bars & content shift together seamlessly */}
      <div className="flex flex-col min-w-0 w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950">
        <Navbar storeName={storeName} />
        <OffersBar />
        <AnnouncementBar />
        <main className="flex-1 min-w-0 flex flex-col">{children}</main>
        <Footer storeName={storeName} address={address} phone={phone} />
      </div>
    </div>
  )
}

function Shell({ children, storeName, address, phone }) {
  const { hosting } = useAuth()
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  if (isAdminRoute) {
    return (
      <AdminConsoleProvider>
        <AdminShellInner storeName={storeName} address={address} phone={phone}>
          {children}
        </AdminShellInner>
      </AdminConsoleProvider>
    )
  }

  return (
    <>
      <Navbar storeName={storeName} />
      <OffersBar />
      <AnnouncementBar />
      <main className="flex-1">{children}</main>
      <Footer storeName={storeName} address={address} phone={phone} />
      {hosting ? (
        <div className="fixed bottom-20 right-4 z-40">
          <HostAddButton />
        </div>
      ) : null}
      <ChatWidget storeName={storeName} />
    </>
  )
}

export default function SiteShell({ children, storeName, address, phone }) {
  return (
    <AuthProvider>
      <Shell storeName={storeName} address={address} phone={phone}>
        {children}
      </Shell>
    </AuthProvider>
  )
}
