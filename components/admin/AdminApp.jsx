'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminDashboard from '@/components/admin/AdminDashboard'
import AdminProducts from '@/components/admin/AdminProducts'
import AdminOrders from '@/components/admin/AdminOrders'
import AdminSettings from '@/components/admin/AdminSettings'
import AdminBroadcast from '@/components/admin/AdminBroadcast'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'broadcast', label: 'Broadcast' },
  { id: 'settings', label: 'Settings' },
]

export default function AdminApp() {
  const [authed, setAuthed] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [dbOk, setDbOk] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth').then((r) => r.json()).then((d) => setAuthed(Boolean(d.ok))).catch(() => setAuthed(false))
    fetch('/api/health').then((r) => r.json()).then((d) => setDbOk(Boolean(d.db))).catch(() => {})
  }, [])

  if (authed === null) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-400">Loading...</div>
  }

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Seller / Admin Panel</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage products, verify payments & track orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-brand font-semibold text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg">
            View Store ↗
          </Link>
          <Link href="/orders" className="text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-brand font-semibold text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg">
            Track Page
          </Link>
          <button
            onClick={async () => {
              await fetch('/api/auth', { method: 'DELETE' })
              await fetch('/api/login', { method: 'DELETE' })
              router.push('/')
            }}
            className="text-sm bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950 font-semibold text-red-600 dark:text-red-400 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {!dbOk ? (
        <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900 rounded-xl p-4 text-sm text-amber-900 dark:text-amber-200 mb-5">
          <b>Database not connected.</b> Your site is showing demo data and your saved products/orders are not being stored.{' '}
          <br />
          <b>How to fix (5 min):</b>
          <ol className="list-decimal ml-5 mt-1 space-y-0.5">
            <li>Open <b>https://atlas.mongodb.org</b> with the account that made this database and log in.</li>
            <li>Go to <b>Database → Clusters</b>. If your cluster shows <b>PAUSED</b>, click <b>Resume</b>. If it is gone, click <b>Create</b> to make a new FREE cluster.</li>
            <li>Open <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code> and paste the fresh connection string into <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">MONGODB_URI</code> (remember <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">/the-store</code> before the ?).</li>
            <li>Restart <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">npm run dev</code> — this warning disappears and everything saves.</li>
          </ol>
        </div>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto mb-5 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 text-sm font-semibold px-4 py-2 rounded-lg transition ${
              tab === t.id ? 'bg-brand text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' ? <AdminDashboard goToOrders={() => setTab('orders')} goToProducts={() => setTab('products')} /> : null}
      {tab === 'products' ? <AdminProducts /> : null}
      {tab === 'orders' ? <AdminOrders /> : null}
      {tab === 'broadcast' ? <AdminBroadcast /> : null}
      {tab === 'settings' ? <AdminSettings /> : null}
    </div>
  )
}