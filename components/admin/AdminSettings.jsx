'use client'

import { useEffect, useState } from 'react'
import { fileToDataUrl } from '@/lib/image-upload'

/* ─── Tag Icon ── */
function TagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  )
}

/* ─── Coupon Management ─────────────────────────── */
function CouponManager() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [pct, setPct] = useState('')
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/coupons')
      const data = await res.json()
      setCoupons(data.coupons || [])
    } catch { setCoupons([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    setMsg('')
    if (!code.trim()) return setMsg('Enter a coupon code')
    const p = Number(pct)
    if (!p || p < 1 || p > 100) return setMsg('Discount must be 1–100%')
    setAdding(true)
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), discountPercent: p }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setCode(''); setPct('')
      setMsg('✓ Coupon created')
      load()
    } catch (err) { setMsg('✗ ' + err.message) }
    setAdding(false)
  }

  async function toggle(id, current) {
    await fetch('/api/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !current }),
    })
    load()
  }

  async function del(id, c) {
    if (!confirm(`Delete coupon ${c}?`)) return
    await fetch('/api/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-4">
      <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <TagIcon /> Coupon / Discount Codes
      </h2>

      {/* Existing coupons */}
      {loading ? (
        <p className="text-xs text-slate-400">Loading coupons...</p>
      ) : coupons.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">No coupons yet. Create your first one below.</p>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c._id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tracking-wider">{c.code}</span>
                <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">{c.discountPercent}% OFF</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggle(c._id, c.isActive)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-600 px-2.5 py-1 rounded-lg hover:border-blue-300 transition-colors"
                >
                  {c.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => del(c._id, c.code)}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 dark:border-red-900 px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new coupon */}
      <form onSubmit={add} className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Create New Coupon</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Code (e.g. SAVE20)"
            maxLength={20}
            className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono tracking-wider uppercase"
          />
          <input
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder="Discount % (e.g. 20)"
            type="number"
            min="1"
            max="100"
            className="w-full sm:w-36 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={adding}
            className="shrink-0 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded-lg"
          >
            {adding ? 'Adding...' : '+ Add Coupon'}
          </button>
        </div>
        {msg && (
          <p className={`mt-2 text-sm font-medium ${msg.startsWith('✓') ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{msg}</p>
        )}
      </form>
    </div>
  )
}

export default function AdminSettings() {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => {
      const s = d.settings || {}
      setForm({
        storeName: s.storeName || '',
        tagline: s.tagline || '',
        announcement: s.announcement || '',
        upiId: s.upiId || '',
        qrImageUrl: s.qrImageUrl || '',
        phone: s.phone || '',
        address: s.address || '',
        deliveryFee: s.deliveryFee ?? '',
        freeDeliveryAbove: s.freeDeliveryAbove ?? '',
        heroImageUrl: s.heroImageUrl || '',
        codEnabled: s.codEnabled !== false,
        offers: s.offers || [],
        offerTitle: '',
        offerText: '',
      })
    }).catch(() => {})
  }, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          deliveryFee: Number(form.deliveryFee) || 0,
          freeDeliveryAbove: Number(form.freeDeliveryAbove) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMsg('✓ Settings saved — the store website updates immediately')
    } catch (err) {
      setMsg('✗ ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!form) return <p className="text-slate-400 text-sm">Loading...</p>

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="max-w-2xl space-y-4">
      {/* ── Store Settings form ── */}
      <form onSubmit={save} className="space-y-4">
        {msg ? <p className={`text-sm font-medium ${msg.startsWith('✓') ? 'text-green-700' : 'text-red-600'}`}>{msg}</p> : null}

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3">
          <h2 className="font-bold text-slate-900 dark:text-white">Store Info</h2>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Store name *
            <input required value={form.storeName} onChange={set('storeName')} className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Tagline (shown on homepage)
            <input value={form.tagline} onChange={set('tagline')} placeholder="e.g. Fashion for everyone" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
          </label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Announcement (yellow strip on top)
            <input value={form.announcement} onChange={set('announcement')} placeholder="e.g. Flat 20% OFF this weekend!" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Phone (shown to customers)
              <input value={form.phone} onChange={set('phone')} placeholder="98765 43210" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
            </label>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Store address
              <input value={form.address} onChange={set('address')} className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3">
          <h2 className="font-bold text-slate-900 dark:text-white">UPI Payment</h2>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Your UPI ID *
            <input required value={form.upiId} onChange={set('upiId')} placeholder="yourname@okaxis or yourname@ybl" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            UPI QR image — <span className="text-amber-700">click &quot;Upload QR&quot; and pick the picture from your PC</span>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('qr-file-input')?.click()}
                className="shrink-0 bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                Upload QR
              </button>
              <input
                id="qr-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  try {
                    const dataUrl = await fileToDataUrl(f)
                    setForm({ ...form, qrImageUrl: dataUrl })
                  } catch (err) {
                    setMsg('✗ ' + err.message)
                  }
                  e.target.value = ''
                }}
              />
            </div>
            <span className="mt-1.5 block text-[11px] text-slate-400 dark:text-slate-500">or paste an image link below</span>
            <input value={form.qrImageUrl} onChange={set('qrImageUrl')} placeholder="https://.../qr.jpg" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
          </label>
          {form.qrImageUrl ? (
            <div className="flex items-center gap-3">
              <img src={form.qrImageUrl} alt="QR preview" className="w-24 h-24 object-contain border border-slate-200 dark:border-slate-700 rounded-lg" />
              <p className="text-xs text-slate-500 dark:text-slate-400">This QR is shown to customers at checkout.</p>
            </div>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2">
              How to get your QR: open Google Pay / PhonePe → Profile → Payment methods → your UPI QR → save/share it, then use the Upload QR button above.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3">
          <h2 className="font-bold text-slate-900 dark:text-white">Delivery</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Delivery charge (₹)
              <input value={form.deliveryFee} onChange={set('deliveryFee')} type="number" min="0" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
            </label>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Free delivery above (₹) — 0 disables
              <input value={form.freeDeliveryAbove} onChange={set('freeDeliveryAbove')} type="number" min="0" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={Boolean(form.codEnabled)} onChange={(e) => setForm({ ...form, codEnabled: e.target.checked })} />
            <b>Accept Cash on Delivery (COD)</b> — customers can choose COD at checkout
          </label>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3">
          <h2 className="font-bold text-slate-900 dark:text-white">Offers (shown to all logged-in customers)</h2>
          {form.offers.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No offers yet. Add your first offer below — customers will see it as a yellow bar + notification after login.</p>
          ) : (
            <ul className="space-y-1.5">
              {form.offers.map((o, i) => (
                <li key={i} className="flex items-center justify-between gap-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                  <span><b>{o.title}</b>{o.text ? ` — ${o.text}` : ''}</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, offers: form.offers.filter((_, j) => j !== i) })}
                    className="text-red-600 dark:text-red-400 font-bold hover:underline text-xs"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={form.offerTitle} onChange={(e) => setForm({ ...form, offerTitle: e.target.value })} placeholder="New offer title (e.g. Flat 30% OFF)" className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={form.offerText} onChange={(e) => setForm({ ...form, offerText: e.target.value })} placeholder="Details (optional)" className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
            <button
              type="button"
              onClick={() => {
                if (!form.offerTitle.trim()) return
                setForm({
                  ...form,
                  offers: [...form.offers, { title: form.offerTitle.trim(), text: form.offerText.trim() }],
                  offerTitle: '',
                  offerText: '',
                })
              }}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
            >
              + Add
            </button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Save Settings applies all changes including offers.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">Homepage</h2>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Hero/banner image URL (optional)
            <input value={form.heroImageUrl} onChange={set('heroImageUrl')} placeholder="https://.../banner.jpg" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
          </label>
        </div>

        <button disabled={saving} className="bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-xl text-sm">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* ── Coupon Management (separate section, outside the settings form) ── */}
      <CouponManager />
    </div>
  )
}