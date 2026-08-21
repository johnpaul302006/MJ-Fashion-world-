'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'

export default function AnnouncementBar() {
  const { announcements, announcement, hosting, refresh } = useAuth()
  const [stripHidden, setStripHidden] = useState(false)
  const [toast, setToast] = useState(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const toastTimer = useRef(null)

  const live = (announcements || []).filter((a) => a.active)

  useEffect(() => {
    try {
      const seen = JSON.parse(localStorage.getItem('seen_announcements') || '[]')
      const unseen = live.filter((a) => !seen.includes(a.id))
      if (unseen.length === 0) return
      if (hosting) {
        localStorage.setItem('seen_announcements', JSON.stringify([...seen, ...unseen.map((a) => a.id)]))
        return
      }
      const a = unseen[unseen.length - 1]
      clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(a), 800)
    } catch {}
  }, [live, hosting])

  function dismissToast() {
    setToast(null)
    try {
      const seen = JSON.parse(localStorage.getItem('seen_announcements') || '[]')
      const ids = live.map((a) => a.id)
      localStorage.setItem('seen_announcements', JSON.stringify([...new Set([...seen, ...ids])]))
    } catch {}
  }

  async function saveAnnouncements(next) {
    setBusy(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcements: next }),
      })
      if (!res.ok) throw new Error('Could not save')
      await refresh()
      router.refresh()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {toast ? (
        <div className="fixed top-20 right-4 z-50 max-w-xs bg-slate-950 text-white text-sm rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-black px-4 py-2 font-bold flex items-center justify-between text-xs">
            <span>NEW ANNOUNCEMENT</span>
            <button onClick={dismissToast} className="font-bold">✕</button>
          </div>
          <div className="px-4 py-3">
            <p className="font-bold">{toast.title}</p>
            {toast.text ? <p className="mt-1 text-slate-300">{toast.text}</p> : null}
          </div>
        </div>
      ) : null}

      {announcement && !stripHidden ? (
        <div className="bg-slate-950 text-white text-xs sm:text-sm px-4 py-1.5 flex items-center justify-between gap-3">
          <span className="flex-1 text-center">{announcement}</span>
          <button
            onClick={() => {
              setStripHidden(true)
              try {
                localStorage.setItem('announcement_strip_hidden', '1')
              } catch {}
            }}
            className="font-bold shrink-0"
            title="Hide"
          >
            ✕
          </button>
        </div>
      ) : null}

      {hosting ? (
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm px-4 py-1.5 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center gap-2">
            <b>Announcements:</b>
            {live.length === 0 ? ' none yet' : live.map((a, i) => <span key={a.id}>{a.title}{i < live.length - 1 ? ',' : ''}</span>)}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setComposeOpen(!composeOpen)} className="font-bold hover:underline">
              ＋ New Announcement
            </button>
            {live.length > 0 ? (
              <button
                onClick={() => {
                  if (!confirm('Remove the latest announcement?')) return
                  const next = announcements.filter((a) => a.id !== live[live.length - 1].id)
                  saveAnnouncements(next)
                }}
                className="font-bold hover:underline"
                title="Remove latest announcement"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {composeOpen ? (
        <div className="fixed inset-x-4 top-24 z-50 mx-auto max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className="font-bold text-slate-900 dark:text-white text-sm">New Announcement (sent to all customers)</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title * (e.g. Festive Sale Live)"
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message (optional, e.g. 30% off everything till Sunday)"
            rows="3"
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!title.trim()) return alert('Give the announcement a title')
                const next = [
                  ...announcements,
                  {
                    id: 'ann-' + Date.now(),
                    title: title.trim(),
                    text: text.trim(),
                    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                    active: true,
                  },
                ]
                setTitle('')
                setText('')
                setComposeOpen(false)
                saveAnnouncements(next)
              }}
              disabled={busy}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-lg"
            >
              {busy ? 'Sending...' : 'Send to all customers'}
            </button>
            <button onClick={() => setComposeOpen(false)} className="px-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
