'use client'

import { useState } from 'react'
import Link from 'next/link'

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'New Autumn/Winter Collection is Live!',
    body: 'Discover fresh oversized hoodies, graphic tees, and streetwear cargos.',
    time: '2 hours ago',
    type: 'promo',
    unread: true,
    link: '/shop',
  },
  {
    id: 2,
    title: 'SuperCoin Bonus Credited',
    body: '50 bonus SuperCoins have been added to your rewards account for being a member.',
    time: 'Yesterday',
    type: 'reward',
    unread: true,
    link: '/rewards',
  },
  {
    id: 3,
    title: 'Order Tracking is Now Faster',
    body: 'You can now track any order instantly using your 10-digit mobile number.',
    time: '3 days ago',
    type: 'system',
    unread: false,
    link: '/track-order',
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <div className="min-h-[80vh] px-4 py-8 sm:py-12 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6 font-mono">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <span className="text-white">Notifications</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#cc0000]/10 border border-[#cc0000]/20 text-[#cc0000] mb-3">
            <span>🔔</span> Activity Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
            Notifications & Updates
          </h1>
          <p className="text-sm text-neutral-400">
            Stay informed on your orders, exclusive sales, and rewards.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={markAllRead}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
            >
              Mark all as read
            </button>
            <button
              onClick={clearAll}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-[#161616] border border-neutral-800 rounded-3xl p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl">
            🔕
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No notifications right now</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-6">
            You&apos;re completely caught up! We&apos;ll notify you here when there are updates on your orders or price drops.
          </p>
          <Link
            href="/shop"
            className="px-6 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold transition inline-block"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-[#161616] border rounded-2xl p-5 transition flex items-start gap-4 ${
                n.unread ? 'border-[#cc0000]/40 bg-[#161616]' : 'border-neutral-800 opacity-80'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-lg shrink-0">
                {n.type === 'reward' ? '🪙' : n.type === 'promo' ? '🔥' : '📦'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white truncate">{n.title}</h4>
                  <span className="text-[11px] text-neutral-500 font-mono shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed mb-3">{n.body}</p>

                {n.link && (
                  <Link
                    href={n.link}
                    className="text-xs text-[#cc0000] hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <span>View Details</span>
                    <span>→</span>
                  </Link>
                )}
              </div>

              {n.unread && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#cc0000] shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
