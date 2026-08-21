'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'

export default function OffersBar() {
  const { offers, hosting, refresh } = useAuth()
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      return localStorage.getItem('offers_hidden') !== '1'
    } catch {
      return true
    }
  })
  const [newToast, setNewToast] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const seenRef = useRef(null)

  useEffect(() => {
    if (!offers || offers.length === 0) return
    try {
      seenRef.current = Number(localStorage.getItem('seen_offers') || '0')
    } catch {}
    if (offers.length > seenRef.current) {
      try {
        localStorage.removeItem('offers_hidden')
      } catch {}
      const showToast = setTimeout(() => setNewToast(true), 0)
      const hideToast = setTimeout(() => setNewToast(false), 6000)
      return () => {
        clearTimeout(showToast)
        clearTimeout(hideToast)
      }
    }
  }, [offers])

  async function saveOffers(next) {
    setBusy(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offers: next }),
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

  if (!offers || offers.length === 0) {
    if (!hosting) return null
    return (
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm px-4 py-1.5 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700">
        <span>No coupons yet — add your first coupon for customers!</span>
        <button onClick={() => setAddOpen(true)} className="font-bold hover:underline">＋ Add Coupon</button>
        {addOpen ? (
          <AddForm
            busy={busy}
            title={title}
            setTitle={setTitle}
            text={text}
            setText={setText}
            onCancel={() => setAddOpen(false)}
            onSubmit={() => {
              if (!title.trim()) return alert('Give the offer a title')
              const next = [...(offers || []), { title: title.trim(), text: text.trim() }]
              setTitle('')
              setText('')
              setAddOpen(false)
              saveOffers(next)
            }}
          />
        ) : null}
      </div>
    )
  }

  return (
    <>
      {newToast ? (
        <div className="fixed top-20 right-4 z-50 bg-slate-950 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl max-w-xs">
          New coupon added! Check the coupon bar at the top.
          <button onClick={() => setNewToast(false)} className="ml-2 font-bold">✕</button>
        </div>
      ) : null}
      {show ? (
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm px-4 py-1.5 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-400 dark:text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </span>
            {offers.map((o, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <b>{o.title}</b>
                {o.text ? <span className="hidden sm:inline">— {o.text}</span> : null}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hosting ? (
              <>
                <button onClick={() => { setAddOpen(!addOpen); if (!addOpen) try { localStorage.setItem('seen_offers', String(offers.length)) } catch {} }} className="font-bold hover:underline">
                  ＋ Add
                </button>
                <button
                  onClick={() => {
                    saveOffers(offers.slice(0, -1))
                  }}
                  className="font-bold hover:underline"
                  title="Remove last coupon"
                >
                  Remove
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShow(false)
                  try {
                    localStorage.setItem('offers_hidden', '1')
                    localStorage.setItem('seen_offers', String(offers.length))
                  } catch {}
                }}
                className="font-bold hover:underline"
              >
                Hide
              </button>
            )}
            {addOpen ? (
              <AddForm
                busy={busy}
                title={title}
                setTitle={setTitle}
                text={text}
                setText={setText}
                onCancel={() => setAddOpen(false)}
                onSubmit={() => {
                  if (!title.trim()) return alert('Give the offer a title')
                  saveOffers([...(offers || []), { title: title.trim(), text: text.trim() }])
                  setTitle('')
                  setText('')
                  setAddOpen(false)
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}

function AddForm({ busy, title, setTitle, text, setText, onCancel, onSubmit }) {
  return (
    <div className="fixed inset-x-4 top-24 z-50 mx-auto max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
      <p className="font-bold text-slate-900 dark:text-white text-sm">New Offer</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Offer title * (e.g. Flat 30% OFF)"
        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none"
      />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Details (optional, e.g. on all dresses)"
        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none"
      />
      <div className="flex gap-2">
        <button onClick={onSubmit} disabled={busy} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-lg">
          {busy ? 'Saving...' : 'Add Offer'}
        </button>
        <button onClick={onCancel} className="px-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
          Cancel
        </button>
      </div>
    </div>
  )
}