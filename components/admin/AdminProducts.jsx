'use client'

import { useEffect, useState } from 'react'
import { CATEGORIES, SIZES } from '@/lib/categories'
import { inr } from '@/lib/format'
import { fileToDataUrl } from '@/lib/image-upload'
import { fallbackImg } from '@/lib/img-fallback'
import { imgUrl, isNonImageLink } from '@/lib/img-url'

const EMPTY = {
  name: '',
  category: 'men',
  price: '',
  mrp: '',
  stock: '10',
  sizes: ['M', 'L', 'XL'],
  colors: '',
  image: '',
  description: '',
  featured: false,
}

export default function AdminProducts() {
  const [products, setProducts] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('all')

  function load() {
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products || [])).catch(() => setProducts([]))
  }

  useEffect(() => {
    load()
  }, [])

  function openAdd() {
    setForm(EMPTY)
    setModal('add')
  }

  function openEdit(p) {
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      mrp: p.mrp,
      stock: p.stock,
      sizes: p.sizes || [],
      colors: (p.colors || []).join(', '),
      image: p.image || '',
      description: p.description || '',
      featured: p.featured,
    })
    setModal(p._id)
  }

  async function save(e) {
    e.preventDefault()
    if (isNonImageLink(form.image)) {
      setMsg('✗ That is a social media page link, not an image. Use the "Upload photo" button instead.')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
        colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
        featured: Boolean(form.featured),
      }
      const res = await fetch(`/api/products${modal === 'add' ? '' : `/${modal}`}`, {
        method: modal === 'add' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMsg('✓ Saved successfully')
      setModal(null)
      load()
    } catch (err) {
      setMsg('✗ ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function patch(id, fields) {
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    load()
  }

  async function del(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    await fetch(`/api/products/${p._id}`, { method: 'DELETE' })
    load()
  }

  const shown = filter === 'all' ? products || [] : (products || []).filter((p) => p.category === filter)

  return (
    <div className="space-y-4">
      {msg ? <p className={`text-sm font-medium ${msg.startsWith('✓') ? 'text-green-700' : 'text-red-600'}`}>{msg}</p> : null}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5 overflow-x-auto">
          <button onClick={() => setFilter('all')} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${filter === 'all' ? 'bg-brand text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
            All ({products?.length || 0})
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.slug} onClick={() => setFilter(c.slug)} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${filter === c.slug ? 'bg-brand text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {c.label}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="bg-brand hover:bg-brand-dark text-white text-sm font-bold px-4 py-2.5 rounded-lg">
          + Add Product
        </button>
      </div>

      {!products ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : shown.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
          <div className="flex justify-center mb-3">
            <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
          <p className="font-semibold">No products here yet</p>
          <p className="text-sm mt-1">Click &quot;+ Add Product&quot; to add your first item.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 w-40">Price (₹) & Discount</th>
                  <th className="py-2.5 px-3 w-44">Price Adjust</th>
                  <th className="py-2.5 px-3">Stock</th>
                  <th className="py-2.5 px-3">Featured</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => {
                  const pct = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0
                  return (
                    <tr key={p._id} className="border-t border-slate-100 dark:border-slate-800 align-top">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={imgUrl(p.image)} alt="" onError={fallbackImg} className="w-12 h-14 object-cover rounded-lg" />
                          ) : (
                            <div className="w-12 h-14 rounded-lg bg-slate-100 dark:bg-slate-800" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100 max-w-56">{p.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{p.category} · sizes: {(p.sizes || []).join(', ') || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            key={`${p._id}-price-${p.price}`}
                            defaultValue={p.price}
                            onBlur={(e) => {
                              const v = Number(e.target.value)
                              if (v >= 0 && v !== p.price) patch(p._id, { price: v })
                            }}
                            className="w-24 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                        {pct > 0 ? (
                          <p className="text-xs text-green-700 dark:text-green-400 font-semibold mt-1">{pct}% OFF (MRP {inr(p.mrp)})</p>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">MRP {inr(p.mrp)}</p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            ['−10%', (x) => Math.round(x * 0.9)],
                            ['−5%', (x) => Math.round(x * 0.95)],
                            ['−₹20', (x) => x - 20],
                          ].map(([label, fn]) => (
                            <button
                              key={label}
                              onClick={() => patch(p._id, { price: Math.max(0, fn(p.price)) })}
                              className="text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 rounded-md py-1 hover:bg-red-100"
                            >
                              {label}
                            </button>
                          ))}
                          {[
                            ['+₹20', (x) => x + 20],
                            ['+5%', (x) => Math.round(x * 1.05)],
                            ['+10%', (x) => Math.round(x * 1.1)],
                          ].map(([label, fn]) => (
                            <button
                              key={label}
                              onClick={() => patch(p._id, { price: fn(p.price) })}
                              className="text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 rounded-md py-1 hover:bg-green-100"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          key={`${p._id}-stock-${p.stock}`}
                          defaultValue={p.stock}
                          onBlur={(e) => {
                            const v = Number(e.target.value)
                            if (v >= 0 && v !== p.stock) patch(p._id, { stock: v })
                          }}
                          className="w-16 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => patch(p._id, { featured: !p.featured })}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-full ${p.featured ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                        >
                          {p.featured ? '★ Featured' : 'Not featured'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button onClick={() => openEdit(p)} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mr-3">
                          Edit
                        </button>
                        <button onClick={() => del(p)} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={save} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-5 my-8 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">{modal === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
              <button type="button" onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl">✕</button>
            </div>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name * (e.g. Cotton T-Shirt Blue)" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none">
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
              <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Stock qty *" type="number" min="0" className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Selling Price (₹) *
                <input required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 399" type="number" min="0" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
              </label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                MRP / Original Price (₹)
                <input value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} placeholder="e.g. 899" type="number" min="0" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Sizes
                <select
                  multiple
                  value={form.sizes}
                  onChange={(e) => setForm({ ...form, sizes: Array.from(e.target.selectedOptions, (o) => o.value) })}
                  className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none h-20"
                >
                  {SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Colors (comma separated)
                <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="e.g. Blue, Black" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
              </label>
            </div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Product photo — <span className="text-amber-700">EASIEST: click &quot;Upload photo&quot; and pick the picture from your PC</span>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('product-file-input')?.click()}
                  className="shrink-0 bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <svg className="inline-block mr-1 -mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload photo
                </button>
                <input
                  id="product-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    try {
                      const dataUrl = await fileToDataUrl(f)
                      setForm({ ...form, image: dataUrl })
                      setMsg('✓ Photo loaded — press the big Save button below')
                    } catch (err) {
                      setMsg('✗ ' + err.message)
                    }
                    e.target.value = ''
                  }}
                />
              </div>
              <span className="mt-1.5 block text-[11px] text-slate-400 dark:text-slate-500">or paste an image link below — <b>JPG, PNG, WebP and Google Images / Google Photos links are supported</b> (images are fetched automatically so they display everywhere).</span>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://...jpg" className="mt-1 w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
              {isNonImageLink(form.image) && (
                <span className="mt-1.5 block text-[11px] font-semibold text-red-600 dark:text-red-400">
                  ⚠ That is a social media page link (Instagram/Facebook etc.), not an image. Click &quot;Upload photo&quot; and pick the picture from your PC instead.
                </span>
              )}
            </label>
            {form.image ? (
              <img src={imgUrl(form.image)} alt="Preview" onError={fallbackImg} className="max-h-40 rounded-xl border border-slate-200 dark:border-slate-700" />
            ) : null}
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (fabric, fit, care...)" rows={2} className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm outline-none" />
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Show in &quot;New Arrivals&quot; on homepage
            </label>
            <button disabled={saving} className="w-full bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-sm">
              {saving ? 'Saving...' : modal === 'add' ? 'Add Product' : 'Save Changes'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}