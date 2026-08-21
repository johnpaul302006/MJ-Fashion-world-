'use client'

import { useEffect, useState } from 'react'

export default function AdminBroadcast() {
  const [announcements, setAnnouncements] = useState(null)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setAnnouncements(d.settings?.announcements || []))
      .catch(() => setAnnouncements([]))
  }, [])

  async function save(next) {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcements: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error === 'database_not_configured' ? 'Connect MongoDB first (see GUIDE.md)' : data.error || 'Save failed')
      setAnnouncements(data.settings?.announcements || next)
    } catch (err) {
      setMsg('✗ ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  async function send(active) {
    if (!title.trim()) return setMsg('✗ Give the announcement a title')
    const next = [
      {
        id: 'ann-' + Date.now(),
        title: title.trim(),
        text: text.trim(),
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        active,
      },
      ...announcements,
    ]
    setTitle('')
    setText('')
    setMsg(active ? '✓ Broadcast sent — customers will see the notification on their next visit' : '✓ Saved as draft')
    await save(next)
  }

  if (announcements === null) return <p className="text-slate-400 text-sm">Loading...</p>

  const liveCount = announcements.filter((a) => a.active).length

  return (
    <div className="max-w-2xl space-y-4">
      {msg ? (
        <p className={`text-sm font-medium rounded-lg px-3 py-2 border ${msg.startsWith('✓') ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40' : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40'}`}>
          {msg}
        </p>
      ) : null}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Broadcast</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every customer sees live broadcasts as a notification toast + blue bar on their store screen.
            </p>
          </div>
          <span className="shrink-0 text-xs font-bold text-brand dark:text-amber-300 bg-brand-faint dark:bg-brand-deep border border-brand/30 dark:border-brand rounded-full px-2.5 py-1">
            {liveCount} live
          </span>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title * (e.g. Festive Sale is LIVE)"
          className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message (optional, e.g. Flat 30% OFF on all dresses till Sunday)"
          rows="3"
          className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => send(true)}
            disabled={busy}
            className="flex-1 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white text-sm font-bold py-2.5 rounded-lg"
          >
            {busy ? 'Sending...' : 'Send to all customers'}
          </button>
          <button
            onClick={() => send(false)}
            disabled={busy}
            className="sm:flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-blue-400 text-slate-700 dark:text-slate-200 text-sm font-semibold py-2.5 rounded-lg"
          >
            Save as draft
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3">
        <h2 className="font-bold text-slate-900 dark:text-white">Sent Announcements</h2>
        {announcements.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">No announcements yet. Compose your first broadcast above.</p>
        ) : (
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 flex-wrap text-sm font-bold text-slate-900 dark:text-white">
                    {a.title}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.active ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600'}`}>
                      {a.active ? '● LIVE' : '○ DRAFT'}
                    </span>
                  </p>
                  {a.text ? <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">{a.text}</p> : null}
                  {a.date ? <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Sent {a.date}</p> : null}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      const next = announcements.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x))
                      setMsg(a.active ? '✓ Broadcast paused — customers will no longer see it' : '✓ Broadcast re-published')
                      save(next)
                    }}
                    disabled={busy}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 px-2 py-1 rounded-md"
                  >
                    {a.active ? 'Pause' : 'Publish'}
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm(`Delete "${a.title}"?`)) return
                      const next = announcements.filter((x) => x.id !== a.id)
                      setMsg('✓ Announcement deleted')
                      save(next)
                    }}
                    disabled={busy}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950 px-2 py-1 rounded-md"
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
  )
}
