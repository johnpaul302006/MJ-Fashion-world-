'use client'

import { useEffect, useState, useMemo } from 'react'
import { inr, shortDate } from '@/lib/format'
import { getStatusMeta } from '@/lib/categories'
import AdminChart from './AdminChart'

export default function AdminDashboard({ goToOrders, goToProducts, goToReturns, goToCoupons }) {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [productsCount, setProductsCount] = useState(0)
  const [pendingReturnsCount, setPendingReturnsCount] = useState(0)
  const [activeCouponsCount, setActiveCouponsCount] = useState(0)

  useEffect(() => {
    let active = true

    async function loadDashboardData() {
      try {
        const [ordersRes, productsRes, returnsRes, couponsRes] = await Promise.allSettled([
          fetch('/api/orders').then((r) => r.json()),
          fetch('/api/products').then((r) => r.json()),
          fetch('/api/returns').then((r) => r.json()),
          fetch('/api/coupons').then((r) => r.json()),
        ])

        if (!active) return

        if (ordersRes.status === 'fulfilled' && ordersRes.value?.orders) {
          setOrders(ordersRes.value.orders)
        }
        if (productsRes.status === 'fulfilled' && productsRes.value?.products) {
          setProductsCount(productsRes.value.products.length)
        }
        if (returnsRes.status === 'fulfilled' && returnsRes.value?.requests) {
          const pend = returnsRes.value.requests.filter((r) => r.status === 'pending').length
          setPendingReturnsCount(pend)
        }
        if (couponsRes.status === 'fulfilled' && couponsRes.value?.coupons) {
          const now = new Date()
          const act = couponsRes.value.coupons.filter(
            (c) => c.active && (!c.validUntil || new Date(c.validUntil) >= now)
          ).length
          setActiveCouponsCount(act)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboardData()
    return () => {
      active = false
    }
  }, [])

  // KPI calculations
  const stats = useMemo(() => {
    const revenueStatuses = ['confirmed', 'shipped', 'delivered']
    const confirmedOrders = orders.filter((o) => revenueStatuses.includes(o.status))
    const totalRev = confirmedOrders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0)
    const pendingOrders = orders.filter((o) => o.status === 'pending').length

    return {
      totalOrders: orders.length,
      pendingOrders,
      totalRevenue: totalRev,
    }
  }, [orders])

  // Chart data: Group orders by date (last 7 days)
  const chartData = useMemo(() => {
    const days = 7
    const result = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
      const dateKey = d.toISOString().slice(0, 10)

      const matchingOrders = orders.filter((o) => {
        if (!o.createdAt) return false
        const orderDate = new Date(o.createdAt).toISOString().slice(0, 10)
        return orderDate === dateKey
      })

      const dayRevenue = matchingOrders
        .filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.status))
        .reduce((sum, o) => sum + (Number(o.amount) || 0), 0)

      result.push({
        label: dayLabel,
        revenue: dayRevenue,
        orders: matchingOrders.length,
      })
    }

    return result
  }, [orders])

  const recent = useMemo(() => orders.slice(0, 7), [orders])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* KPI Skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
        {/* Chart Skeleton */}
        <div className="h-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6" />
        {/* Table Skeleton */}
        <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Revenue */}
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              ₹
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {inr(stats.totalRevenue)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Total Revenue
            </p>
          </div>
        </div>

        {/* 2. Total Orders */}
        <button
          type="button"
          onClick={goToOrders}
          className="text-left bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 transition-all hover:shadow-md hover:border-brand flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
            <span className="text-xs text-slate-400 group-hover:text-brand transition font-medium">
              View →
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.totalOrders}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Total Orders
            </p>
          </div>
        </button>

        {/* 3. Pending Verification */}
        <button
          type="button"
          onClick={goToOrders}
          className={`text-left rounded-2xl border p-4 transition-all hover:shadow-md flex flex-col justify-between group ${
            stats.pendingOrders > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/70'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                stats.pendingOrders > 0
                  ? 'bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            {stats.pendingOrders > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
                Action Req
              </span>
            )}
          </div>
          <div className="mt-2">
            <p
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                stats.pendingOrders > 0 ? 'text-amber-900 dark:text-amber-200' : 'text-slate-900 dark:text-white'
              }`}
            >
              {stats.pendingOrders}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pending Orders
            </p>
          </div>
        </button>

        {/* 4. Products */}
        <button
          type="button"
          onClick={goToProducts}
          className="text-left bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 transition-all hover:shadow-md hover:border-brand flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <span className="text-xs text-slate-400 group-hover:text-brand transition font-medium">
              View →
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {productsCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Catalog Items
            </p>
          </div>
        </button>

        {/* 5. Pending Returns */}
        <button
          type="button"
          onClick={goToReturns}
          className={`text-left rounded-2xl border p-4 transition-all hover:shadow-md flex flex-col justify-between group ${
            pendingReturnsCount > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/70'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                pendingReturnsCount > 0
                  ? 'bg-rose-200/70 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 15v-1a4 4 0 00-4-4H4m0 0l3-3m-3 3l3 3m5 4v1a4 4 0 004 4h8m0 0l-3-3m3 3l-3 3" />
              </svg>
            </span>
            {pendingReturnsCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {pendingReturnsCount} New
              </span>
            )}
          </div>
          <div className="mt-2">
            <p
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                pendingReturnsCount > 0 ? 'text-rose-900 dark:text-rose-200' : 'text-slate-900 dark:text-white'
              }`}
            >
              {pendingReturnsCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Returns & Claims
            </p>
          </div>
        </button>

        {/* 6. Active Coupons */}
        <button
          type="button"
          onClick={goToCoupons}
          className="text-left bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 transition-all hover:shadow-md hover:border-brand flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
              🎟
            </span>
            <span className="text-xs text-slate-400 group-hover:text-brand transition font-medium">
              View →
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeCouponsCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Active Coupons
            </p>
          </div>
        </button>
      </div>

      {/* Sales Trend Chart */}
      <AdminChart data={chartData} />

      {/* Recent Orders + Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Recent Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Orders</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest transactions from your storefront</p>
            </div>
            <button
              type="button"
              onClick={goToOrders}
              className="text-xs text-brand font-bold hover:underline px-2 py-1 rounded-lg hover:bg-brand/10 transition"
            >
              View all orders ({orders.length}) →
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-2">
                📦
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No orders placed yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Once customers checkout on your store, orders will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <th className="pb-3 pr-4">Order ID</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recent.map((o) => {
                    const statusMeta = getStatusMeta(o.status)
                    return (
                      <tr key={o._id} className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 pr-4">
                          <p className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {o.orderId}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {shortDate(o.createdAt)}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                            {o.customer?.name || 'Customer'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {o.customer?.phone || '—'}
                          </p>
                        </td>
                        <td className="py-3 pr-4 font-bold text-xs text-slate-900 dark:text-white">
                          {inr(o.amount)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusMeta.color}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={goToOrders}
                            className="text-xs font-semibold text-slate-500 hover:text-brand hover:underline"
                          >
                            Manage →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right (1 col): Operational Guide & Host Tips */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Order Verification Protocol
            </h3>
            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal ml-4">
              <li>
                Customer places order: Status starts as <b>Pending Verification</b>.
              </li>
              <li>
                Open your UPI app (Google Pay / PhonePe / Paytm) and verify the credited amount and <b>UTR number</b>.
              </li>
              <li>
                Click <b>Verify Payment</b> on the order. Money received = order automatically confirmed.
              </li>
              <li>
                When package is handed over to courier, mark <b>Shipped</b> and attach the tracking link so the customer can track it live.
              </li>
            </ol>
          </div>

          <div className="bg-gradient-to-br from-brand/10 via-amber-500/5 to-transparent rounded-2xl border border-brand/20 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand mb-1">
              Host Console Quick Actions
            </h4>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={goToProducts}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand shadow-xs transition"
              >
                + Add Product
              </button>
              <button
                type="button"
                onClick={goToCoupons}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand shadow-xs transition"
              >
                + New Coupon
              </button>
              <button
                type="button"
                onClick={goToReturns}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand shadow-xs transition"
              >
                Review Returns
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
