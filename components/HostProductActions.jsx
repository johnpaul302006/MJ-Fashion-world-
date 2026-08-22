'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { CATEGORIES } from '@/lib/categories'
import { isNonImageLink } from '@/lib/img-url'

const EMPTY = { name: '', price: '', mrp: '', stock: '10', image: '' }

export function HostAddButton({ category }) {
  const { hosting } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY, category: category || 'men' })
  const [busy, setBusy] = useState(false)

  if (!hosting) return null

  async function submit(e) {
    e.preventDefault()
    if (isNonImageLink(form.image)) {
      alert('That is a social media page link (Instagram/Facebook etc.), not an image. Please save the photo to your PC and upload it from the Admin panel instead.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          price: Number(form.price),
          mrp: Number(form.mrp) || Number(form.price),
          stock: Number(form.stock) >= 0 ? Number(form.stock) : 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error === 'database_not_configured' ? 'Connect MongoDB first (see GUIDE.md)' : data.error || 'Failed')
      setOpen(false)
      setForm({ ...EMPTY, category: category || 'men' })
      router.refresh()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg ml-2"
      >
        ＋ Add Product
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Add Product</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 text-xl">✕</button>
            </div>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name *" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
            {category ? (
              <p className="text-xs font-semibold text-slate-500">Section: {CATEGORIES.find((c) => c.slug === category)?.label || category}</p>
            ) : (
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none">
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            )}
            <div className="grid grid-cols-3 gap-2">
              <input required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price ₹" type="number" min="0" className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
              <input value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} placeholder="MRP" type="number" min="0" className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
              <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Stock" type="number" min="0" className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Image URL (JPG / PNG / Google link)" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
            {isNonImageLink(form.image) && (
              <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                ⚠ Instagram/social media links won&apos;t display as images. Save the photo to your PC and upload it from the Admin panel instead.
              </p>
            )}
            <button disabled={busy} className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-2.5 rounded-lg text-sm">
              {busy ? 'Adding...' : 'Add Product'}
            </button>
          </form>
        </div>
      ) : null}
    </>
  )
}

export function HostDeleteButton({ product }) {
  const { hosting } = useAuth()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  if (!hosting || !product._id) return null

  async function del() {
    if (!confirm(`Remove "${product.name}" from the store?`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/products/${product._id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error === 'database_not_configured' ? 'Connect MongoDB first (see GUIDE.md)' : data.error || 'Failed')
      router.refresh()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={del}
      disabled={busy}
      title="Remove product (host only)"
      className="absolute top-2 right-2 z-10 bg-white/95 dark:bg-slate-800 text-red-600 hover:bg-red-600 hover:text-white text-xs font-bold w-7 h-7 rounded-full shadow border border-red-200 dark:border-red-900"
    >
      {busy ? '…' : '✕'}
    </button>
  )
}