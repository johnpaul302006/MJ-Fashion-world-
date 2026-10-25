'use client'

import { Suspense, lazy, useState, useEffect } from 'react'
import AdminLogin from '@/components/admin/AdminLogin'
import { AdminToastProvider } from './AdminToast'
import AdminTopBar from './AdminTopBar'
import { useAdminConsole } from './AdminConsoleContext'

// Route-level code splitting: lazy load each admin tab screen
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'))
const AdminProducts = lazy(() => import('@/components/admin/AdminProducts'))
const AdminCategories = lazy(() => import('@/components/admin/AdminCategories'))
const AdminOrders = lazy(() => import('@/components/admin/AdminOrders'))
const AdminReturns = lazy(() => import('@/components/admin/AdminReturns'))
const AdminCoupons = lazy(() => import('@/components/admin/AdminCoupons'))
const AdminBroadcast = lazy(() => import('@/components/admin/AdminBroadcast'))
const AdminSettings = lazy(() => import('@/components/admin/AdminSettings'))

function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse py-4">
      <div className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5" />
      <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5" />
    </div>
  )
}

export default function AdminApp() {
  const consoleCtx = useAdminConsole()

  // Fallback states if rendered outside provider
  const [localAuthed, setLocalAuthed] = useState(null)
  const [localTab, setLocalTab] = useState('products')
  const [localDbOk, setLocalDbOk] = useState(true)

  useEffect(() => {
    if (consoleCtx) return
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setLocalAuthed(Boolean(d.ok)))
      .catch(() => setLocalAuthed(false))

    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setLocalDbOk(Boolean(d.db)))
      .catch(() => {})
  }, [consoleCtx])

  const authed = consoleCtx ? consoleCtx.authed : localAuthed
  const setAuthed = consoleCtx ? consoleCtx.setAuthed : setLocalAuthed
  const activeTab = consoleCtx ? consoleCtx.activeTab : localTab
  const setActiveTab = consoleCtx ? consoleCtx.setActiveTab : setLocalTab
  const dbOk = consoleCtx ? consoleCtx.dbOk : localDbOk
  const openMobile = consoleCtx ? consoleCtx.openMobile : () => {}

  if (authed === null) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Authenticating host session...</span>
      </div>
    )
  }

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} />
  }

  return (
    <AdminToastProvider>
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950">
        {/* Sticky Console Header directly below navigation */}
        <AdminTopBar
          activeTab={activeTab}
          onOpenMobile={openMobile}
          dbOk={dbOk}
        />

        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Database Connection Alert */}
          {!dbOk && (
            <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900 rounded-2xl p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 mb-6 shadow-xs">
              <b>Database not connected.</b> Your site is showing demo data and saved products/orders are not being stored.
              <ol className="list-decimal ml-5 mt-2 space-y-1">
                <li>Open <b>https://atlas.mongodb.org</b> and ensure your cluster is not <b>PAUSED</b>.</li>
                <li>Check <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code> for a valid <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">MONGODB_URI</code>.</li>
                <li>Restart your server to reconnect live database storage.</li>
              </ol>
            </div>
          )}

          {/* Suspense-wrapped Tab Content */}
          <Suspense fallback={<TabSkeleton />}>
            {activeTab === 'dashboard' && (
              <AdminDashboard
                goToOrders={() => setActiveTab('orders')}
                goToProducts={() => setActiveTab('products')}
                goToReturns={() => setActiveTab('returns')}
                goToCoupons={() => setActiveTab('coupons')}
              />
            )}
            {activeTab === 'products' && <AdminProducts />}
            {activeTab === 'categories' && <AdminCategories />}
            {activeTab === 'orders' && <AdminOrders />}
            {activeTab === 'returns' && <AdminReturns />}
            {activeTab === 'coupons' && <AdminCoupons />}
            {activeTab === 'broadcast' && <AdminBroadcast />}
            {activeTab === 'settings' && <AdminSettings />}
          </Suspense>
        </div>
      </div>
    </AdminToastProvider>
  )
}
