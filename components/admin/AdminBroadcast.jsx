'use client'

import { useEffect, useState } from 'react'
import { useAdminToast } from './AdminToast'
import AdminConfirmModal from './AdminConfirmModal'

export default function AdminBroadcast() {
  const { showSuccess, showError } = useAdminToast()
  const [announcements, setAnnouncements] = useState(null)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setAnnouncements(d.settings?.announcements || []))
      .catch(() => setAnnouncements([]))
  }, [])

  async function save(next) {
    setBusy(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcements: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data.error === 'database_not_configured'
            ? 'Connect MongoDB first'
            : data.error || 'Save failed'
        )
      }
      setAnnouncements(data.settings?.announcements || next)
      return true
    } catch (err) {
      showError(err.message || 'Error saving announcement')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function send(active) {
    if (!title.trim()) {
      showError('Please give the announcement a title')
      return
    }
    const next = [
      {
        id: 'ann-' + Date.now(),
        title: title.trim(),
        text: text.trim(),
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        active,
      },
      ...(announcements || []),
    ]
    const ok = await save(next)
    if (ok) {
      showSuccess(
        active
          ? 'Broadcast live! Customers will see this notification immediately.'
          : 'Announcement saved as draft.'
      )
      setTitle('')
      setText('')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const next = announcements.filter((x) => x.id !== deleteTarget.id)
    const ok = await save(next)
    if (ok) {
      showSuccess(`Deleted "${deleteTarget.title}"`)
      setDeleteTarget(null)
    }
    setIsDeleting(false)
  }

  if (announcements === null) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs animate-pulse font-semibold">
        Loading broadcasts...
      </div>
    )
  }

  const liveCount = announcements.filter((a) => a.active).length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left (2 cols): Composer + Sent list */}
      <div className="lg:col-span-2 space-y-5">
        {/* Composer Card */}
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Storewide Broadcast
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every visitor sees live broadcasts on their storefront screen as a banner &amp; notification toast.
              </p>
            </div>
            <span className="shrink-0 text-xs font-bold text-brand bg-brand/10 border border-brand/20 rounded-full px-3 py-1">
              {liveCount} live
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Announcement Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. FLASH SALE: Flat 30% OFF on all Summer Drops"
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Message (optional)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Use code FLASH30 at checkout. Free shipping on all prepaid orders."
                rows="3"
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-brand resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => send(true)}
              disabled={busy}
              className="flex-1 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition"
            >
              {busy ? 'Broadcasting...' : 'Broadcast to All Customers (Live)'}
            </button>
            <button
              type="button"
              onClick={() => send(false)}
              disabled={busy}
              className="sm:w-36 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold py-2.5 rounded-xl transition"
            >
              Save as Draft
            </button>
          </div>
        </div>

        {/* Sent Announcements List */}
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Announcement History</h2>
          {announcements.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No announcements published yet. Send your first broadcast above.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {announcements.map((a) => (
                <li key={a.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 flex-wrap text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {a.title}
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          a.active
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {a.active ? '● LIVE' : '○ DRAFT'}
                      </span>
                    </p>
                    {a.text && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                        {a.text}
                      </p>
                    )}
                    {a.date && (
                      <p className="text-[10px] text-slate-400 mt-1">Date: {a.date}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        const next = announcements.map((x) =>
                          x.id === a.id ? { ...x, active: !x.active } : x
                        )
                        const ok = await save(next)
                        if (ok) {
                          showSuccess(a.active ? 'Broadcast paused' : 'Broadcast is now LIVE')
                        }
                      }}
                      disabled={busy}
                      className="text-xs font-bold text-brand hover:underline px-2 py-1 rounded-lg hover:bg-brand/10 transition"
                    >
                      {a.active ? 'Pause' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(a)}
                      disabled={busy}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right (1 col): Live Storefront Preview Simulator */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Customer View Simulator
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Preview of how the top announcement bar renders on customer screens:
          </p>

          <div className="rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm">
            {/* Mock browser header */}
            <div className="h-6 bg-slate-200 dark:bg-slate-800 px-2 flex items-center gap-1.5 border-b border-slate-300 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[9px] text-slate-500 ml-2 font-mono truncate">
                mjfashionworld.com
              </span>
            </div>

            {/* Announcement Bar Banner Preview */}
            <div className="bg-brand text-white px-3 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
              <span className="text-amber-300">✦</span>
              <span className="truncate">
                {title.trim() || 'New Seasonal Drops & Offers are Live!'}
              </span>
              <span className="text-amber-300">✦</span>
            </div>

            {/* Simulated content */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 text-center">
              <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded mx-auto mb-2" />
              <div className="w-24 h-2 bg-slate-100 dark:bg-slate-900 rounded mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Announcement Dialog */}
      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Announcement"
        message={`Are you sure you want to delete broadcast "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
