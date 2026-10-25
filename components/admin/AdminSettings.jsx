'use client'

import { useEffect, useState } from 'react'
import { processAdminImage } from '@/lib/image-upload'
import { useAdminToast } from './AdminToast'
import AdminConfirmModal from './AdminConfirmModal'

/* ─── Tag Icon ── */
function TagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

/* ─── Quick Coupon Manager Subcomponent ─── */
function CouponManager() {
  const { showSuccess, showError } = useAdminToast()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [pct, setPct] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function reload() {
    setLoading(true)
    try {
      const res = await fetch('/api/coupons')
      const data = await res.json()
      setCoupons(data.coupons || [])
    } catch {
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetch('/api/coupons')
      .then((r) => r.json())
      .then((data) => {
        if (active) setCoupons(data.coupons || [])
      })
      .catch(() => {
        if (active) setCoupons([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function add(e) {
    e.preventDefault()
    if (!code.trim()) return showError('Enter a coupon code')
    const p = Number(pct)
    if (!p || p < 1 || p > 100) return showError('Discount must be 1–100%')
    setAdding(true)
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), discountPercent: p }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setCode('')
      setPct('')
      showSuccess(`Coupon ${data.coupon?.code || 'code'} created`)
      reload()
    } catch (err) {
      showError(err.message || 'Error creating coupon')
    } finally {
      setAdding(false)
    }
  }

  async function toggle(id, current) {
    try {
      await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current }),
      })
      showSuccess(current ? 'Coupon deactivated' : 'Coupon activated')
      reload()
    } catch (err) {
      showError('Failed to update status: ' + err.message)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await fetch('/api/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget._id }),
      })
      showSuccess(`Coupon "${deleteTarget.code}" deleted`)
      setDeleteTarget(null)
      reload()
    } catch (err) {
      showError('Error deleting: ' + err.message)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-4 shadow-xs">
      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <TagIcon /> Quick Coupon Management
      </h2>

      {/* Existing coupons */}
      {loading ? (
        <p className="text-xs text-slate-400">Loading coupons...</p>
      ) : coupons.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">No coupons yet. Create your first one below.</p>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div
              key={c._id}
              className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-wider">
                  {c.code}
                </span>
                <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {c.discountPercent}% OFF
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggle(c._id, c.isActive)}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand border border-slate-200 dark:border-slate-600 px-2.5 py-1 rounded-lg transition"
                >
                  {c.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 border border-rose-200 dark:border-rose-900 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
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
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Create Quick Coupon</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Code (e.g. FLASH30)"
            maxLength={20}
            className="flex-1 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-brand font-mono tracking-wider uppercase"
          />
          <input
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder="Discount % (e.g. 30)"
            type="number"
            min="1"
            max="100"
            className="w-full sm:w-36 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={adding}
            className="shrink-0 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
          >
            {adding ? 'Adding...' : '+ Add Coupon'}
          </button>
        </div>
      </form>

      {/* Confirm Delete Dialog */}
      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Coupon"
        message={`Delete coupon "${deleteTarget?.code}"?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default function AdminSettings() {
  const { showSuccess, showError } = useAdminToast()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general') // 'general' | 'payments' | 'delivery' | 'offers' | 'coupons'

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
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
      })
      .catch(() => {})
  }, [])

  async function handleQRUpload(file) {
    if (!file) return
    try {
      const processed = await processAdminImage(file, { maxWidth: 600, quality: 0.85 })
      setForm((prev) => ({ ...prev, qrImageUrl: processed.dataUrl }))
      showSuccess(`QR uploaded and optimized (${processed.compressedKb} KB)`)
    } catch (err) {
      showError(err.message || 'QR upload error')
    }
  }

  async function save(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (!form.storeName?.trim()) {
      showError('Store name is required')
      setActiveTab('general')
      return
    }
    if (!form.upiId?.trim()) {
      showError('UPI ID is required')
      setActiveTab('payments')
      return
    }
    setSaving(true)
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
      showSuccess('Settings saved — storefront updated immediately!')
    } catch (err) {
      showError(err.message || 'Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs animate-pulse font-semibold">
        Loading store settings...
      </div>
    )
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      {/* Settings Navigation Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {[
          { id: 'general', label: 'Store Info & Branding' },
          { id: 'payments', label: 'UPI & Payments' },
          { id: 'delivery', label: 'Shipping & Delivery' },
          { id: 'offers', label: 'Promotions & Hero' },
          { id: 'coupons', label: 'Quick Coupons' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-xl transition ${
              activeTab === t.id
                ? 'bg-brand text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Settings Content */}
      <div className="space-y-5">
        {/* Tab 1: General & Store Info */}
        {activeTab === 'general' && (
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Store Identity</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Basic brand name and contact details</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Store Name *
                </label>
                <input
                  required
                  value={form.storeName}
                  onChange={set('storeName')}
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline (shown on storefront)
                </label>
                <input
                  value={form.tagline}
                  onChange={set('tagline')}
                  placeholder="e.g. Premium Fashion & Streetwear"
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-brand"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Top Announcement Strip
                </label>
                <input
                  value={form.announcement}
                  onChange={set('announcement')}
                  placeholder="e.g. Free delivery on orders above ₹999 · COD available"
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Support Phone / WhatsApp
                </label>
                <input
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+91 98765 43210"
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Store / Warehouse Address
                </label>
                <input
                  value={form.address}
                  onChange={set('address')}
                  placeholder="e.g. 12, Fashion Street, Bangalore"
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  GSTIN / Tax ID (Optional — prints on invoices)
                </label>
                <input
                  value={form.gstin || ''}
                  onChange={set('gstin')}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payments & UPI */}
        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">UPI &amp; QR Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customers scan this QR code or pay to this UPI ID during checkout.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your UPI ID *
              </label>
              <input
                required
                value={form.upiId}
                onChange={set('upiId')}
                placeholder="yourname@okaxis or yourname@ybl"
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-brand font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                UPI QR Image
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => document.getElementById('admin-qr-file')?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700"
                >
                  Upload QR Image
                </button>
                <input
                  id="admin-qr-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleQRUpload(f)
                    e.target.value = ''
                  }}
                />
                <input
                  value={form.qrImageUrl}
                  onChange={set('qrImageUrl')}
                  placeholder="or paste direct image URL (https://...)"
                  className="flex-1 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2 outline-none focus:border-brand"
                />
              </div>

              {form.qrImageUrl ? (
                <div className="mt-3 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <img
                    src={form.qrImageUrl}
                    alt="QR preview"
                    className="w-24 h-24 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
                  />
                  <div className="text-xs text-slate-500">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Active QR Code</p>
                    <p className="mt-0.5">Rendered on customer checkout payment modal.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
                  Tip: Open Google Pay or PhonePe → Profile → Your QR → Share/Download, then click Upload QR Image.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Shipping & Delivery */}
        {activeTab === 'delivery' && (
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Shipping &amp; Delivery Rules</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure delivery charges and payment options</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Delivery Fee (₹)
                </label>
                <input
                  value={form.deliveryFee}
                  onChange={set('deliveryFee')}
                  type="number"
                  min="0"
                  placeholder="40"
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-brand font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Free Delivery Threshold (₹) — 0 disables
                </label>
                <input
                  value={form.freeDeliveryAbove}
                  onChange={set('freeDeliveryAbove')}
                  type="number"
                  min="0"
                  placeholder="999"
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-brand font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.codEnabled)}
                  onChange={(e) => setForm({ ...form, codEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-brand accent-brand"
                />
                <span>Enable Cash on Delivery (COD) at checkout</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 4: Offers & Banner */}
        {activeTab === 'offers' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Promotional Offers</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Displayed as banner cards and notification chips for signed-in customers.
                </p>
              </div>

              {form.offers.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No offers added yet.</p>
              ) : (
                <ul className="space-y-2">
                  {form.offers.map((o, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200"
                    >
                      <span>
                        <b>{o.title}</b>
                        {o.text ? ` — ${o.text}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            offers: form.offers.filter((_, j) => j !== i),
                          })
                        }
                        className="text-rose-600 dark:text-rose-400 font-bold hover:underline text-xs"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  value={form.offerTitle}
                  onChange={(e) => setForm({ ...form, offerTitle: e.target.value })}
                  placeholder="Offer Title (e.g. Weekend Flash Sale)"
                  className="flex-1 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-brand"
                />
                <input
                  value={form.offerText}
                  onChange={(e) => setForm({ ...form, offerText: e.target.value })}
                  placeholder="Details (e.g. Flat ₹200 off on order above ₹1499)"
                  className="flex-1 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!form.offerTitle.trim()) return
                    setForm({
                      ...form,
                      offers: [
                        ...form.offers,
                        { title: form.offerTitle.trim(), text: form.offerText.trim() },
                      ],
                      offerTitle: '',
                      offerText: '',
                    })
                  }}
                  className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  + Add Offer
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Homepage Hero Banner</h2>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hero Image URL (optional)
              </label>
              <input
                value={form.heroImageUrl}
                onChange={set('heroImageUrl')}
                placeholder="https://.../banner.jpg"
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-brand"
              />
            </div>
          </div>
        )}

        {/* Tab 5: Coupons Sub-manager */}
        {activeTab === 'coupons' && <CouponManager />}

        {/* Sticky Save Bar (hidden when on quick coupons tab) */}
        {activeTab !== 'coupons' && (
          <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Changes apply in real time across the entire store.
            </p>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
