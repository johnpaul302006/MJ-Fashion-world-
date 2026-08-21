'use client'

import { useEffect, useState } from 'react'
import { inr, shortDate } from '@/lib/format'
import { getStatusMeta } from '@/lib/categories'

function BoxIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
}
function ClockIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function CurrencyIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
}

export default function AdminDashboard({ goToOrders, goToProducts }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => setStats(computeStats(d.orders || [])))
      .catch(() => {})

    function computeStats(orders) {
      const revenueStatuses = ['confirmed', 'shipped', 'delivered']
      return {
        orders,
        totalOrders: orders.length,
        pending: orders.filter((o) => o.status === 'pending').length,
        revenue: orders.filter((o) => revenueStatuses.includes(o.status)).reduce((n, o) => n + o.amount, 0),
      }
    }
  }, [])

  if (!stats) return <p className="text-slate-400 text-sm">Loading...</p>

  const recent = stats.orders.slice(0, 8)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Orders', value: stats.totalOrders, icon: <BoxIcon /> },
          { label: 'Awaiting Payment Verification', value: stats.pending, icon: <ClockIcon />, highlight: stats.pending > 0 },
          { label: 'Revenue (confirmed+)', value: inr(stats.revenue), icon: <CurrencyIcon /> },
        ].map((c) => (
          <button
            key={c.label}
            onClick={goToOrders}
            className={`bg-white dark:bg-slate-900 rounded-xl border p-4 text-left transition hover:shadow-md ${
              c.highlight ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/40' : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <p className="text-slate-500 dark:text-slate-400">{c.icon}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{c.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{c.label}</p>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 dark:text-white">Recent Orders</h2>
          <button onClick={goToOrders} className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            View all →
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">No orders yet. Share your store link with customers!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 pr-3">Order</th>
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o._id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 pr-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{o.orderId}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{shortDate(o.createdAt)}</p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="text-slate-700 dark:text-slate-200">{o.customer.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{o.customer.phone}</p>
                    </td>
                    <td className="py-2.5 pr-3 font-bold text-slate-900 dark:text-white">{inr(o.amount)}</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusMeta(o.status).color}`}>
                        {getStatusMeta(o.status).label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 dark:text-white">Quick Info</h2>
          <button onClick={goToProducts} className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Manage products →
          </button>
        </div>
        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
          <li>When a customer orders, the status is <b>Pending Verification</b>.</li>
          <li>Open your UPI app, check the money received and match the <b>UTR number</b> the customer entered.</li>
          <li>If matched, click <b>Verify Payment</b> on the order. Money received = order confirmed.</li>
          <li>Update status to <b>Shipped / Delivered</b> as you dispatch and hand over.</li>
          <li>After shipping, fill the <b>Delivery / Tracking details</b> on the order — the customer sees them on their Track Order page.</li>
        </ul>
      </div>
    </div>
  )
}