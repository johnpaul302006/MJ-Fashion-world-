'use client'

import { useEffect, useState, useMemo, useTransition } from 'react'
import { CATEGORIES, SIZES } from '@/lib/categories'
import { inr } from '@/lib/format'
import { processAdminImage } from '@/lib/image-upload'
import { fallbackImg } from '@/lib/img-fallback'
import { imgUrl, isNonImageLink } from '@/lib/img-url'
import { useAdminToast } from './AdminToast'
import AdminConfirmModal from './AdminConfirmModal'

const EMPTY = {
  name: '',
  brand: '',
  category: 'men',
  price: '',
  mrp: '',
  stock: '10',
  sizes: ['M', 'L', 'XL'],
  colors: '',
  image: '',
  images: '',
  tags: '',
  description: '',
  featured: false,
  isNewArrival: false,
}

export default function AdminProducts() {
  const { showSuccess, showError, showWarning } = useAdminToast()
  const [products, setProducts] = useState(null)
  const [categories, setCategories] = useState(CATEGORIES)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageCompressionInfo, setImageCompressionInfo] = useState(null)
  const [, startTransition] = useTransition()

  function load() {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
  }

  useEffect(() => {
    load()
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.categories) && d.categories.length > 0) {
          setCategories(d.categories)
        }
      })
      .catch(() => {})
  }, [])

  function openAdd() {
    setImageCompressionInfo(null)
    setForm({
      ...EMPTY,
      category: categories[0]?.slug || 'men',
    })
    setModal('add')
  }

  function openEdit(p) {
    setImageCompressionInfo(null)
    setForm({
      name: p.name,
      brand: p.brand || '',
      category: p.category,
      price: p.price,
      mrp: p.mrp,
      stock: p.stock,
      sizes: p.sizes || [],
      colors: (p.colors || []).join(', '),
      image: p.image || '',
      images: Array.isArray(p.images) ? p.images.join(', ') : p.images || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : p.tags || '',
      description: p.description || '',
      featured: Boolean(p.featured),
      isNewArrival: Boolean(p.isNewArrival),
    })
    setModal(p._id)
  }

  async function handleImageFile(file) {
    if (!file) return
    try {
      const processed = await processAdminImage(file, { maxWidth: 1000, quality: 0.82 })
      setForm((prev) => ({ ...prev, image: processed.dataUrl }))
      setImageCompressionInfo({
        originalKb: processed.originalKb,
        compressedKb: processed.compressedKb,
        savingsPercent: processed.savingsPercent,
      })
      showSuccess(`Image optimized: ${processed.savingsPercent}% smaller (${processed.compressedKb} KB)`)
    } catch (err) {
      showError(err.message || 'Failed to process image')
    }
  }

  async function save(e) {
    e.preventDefault()
    if (isNonImageLink(form.image)) {
      showError('That is a social media link, not an image. Please upload a photo or use a direct image URL.')
      return
    }
    setSaving(true)
    try {
      const extraImages = form.images
        ? form.images.split(',').map((img) => img.trim()).filter(Boolean)
        : []
      const allImages = form.image
        ? [form.image, ...extraImages.filter((img) => img !== form.image)]
        : extraImages

      const payload = {
        ...form,
        brand: form.brand.trim(),
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
        colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        images: allImages,
        featured: Boolean(form.featured),
        isNewArrival: Boolean(form.isNewArrival),
      }
      const res = await fetch(`/api/products${modal === 'add' ? '' : `/${modal}`}`, {
        method: modal === 'add' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      showSuccess(modal === 'add' ? 'Product created successfully!' : 'Product updated successfully!')
      setModal(null)
      load()
    } catch (err) {
      showError(err.message || 'Error saving product')
    } finally {
      setSaving(false)
    }
  }

  async function patch(id, fields) {
    try {
      // Optimistic update
      setProducts((prev) =>
        prev ? prev.map((p) => (p._id === id ? { ...p, ...fields } : p)) : prev
      )
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) throw new Error('Update failed')
      showSuccess('Quick update saved')
    } catch (err) {
      showError('Failed to update: ' + err.message)
      load()
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/products/${target._id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete product')

      // Optimistic instant removal from list
      setProducts((prev) => (prev ? prev.filter((p) => String(p._id) !== String(target._id)) : []))
      showSuccess(`Deleted "${target.name}"`)
      setDeleteTarget(null)
      load()
    } catch (err) {
      showError(err.message || 'Delete error')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredProducts = useMemo(() => {
    if (!products) return []
    let list = products

    if (filter !== 'all') {
      list = list.filter((p) => p.category === filter)
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          (p.tags && Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
      )
    }

    return list
  }, [products, filter, search])

  const toggleSize = (size) => {
    setForm((prev) => {
      const current = prev.sizes || []
      const exists = current.includes(size)
      return {
        ...prev,
        sizes: exists ? current.filter((s) => s !== size) : [...current, size],
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Filter Categories & Search Bar & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              filter === 'all'
                ? 'bg-brand text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({products?.length || 0})
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setFilter(c.slug)}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                filter === c.slug
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search & Add Product */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => startTransition(() => setSearch(e.target.value))}
              placeholder="Search products, brands..."
              className="w-full text-xs pl-8 pr-7 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-brand focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-800 dark:text-slate-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="shrink-0 inline-flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition"
          >
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Product List Table / Empty State */}
      {!products ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 animate-pulse">
          Loading catalog...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-12 text-center text-slate-500 dark:text-slate-400 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">No products found</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Try clearing your search query.' : 'Click "+ Add Product" to publish an item to your store.'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-3 text-xs font-semibold text-brand hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px] text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-3 w-44">Price (₹) & Discount</th>
                  <th className="py-3 px-3 w-48">Quick Adjust</th>
                  <th className="py-3 px-3 w-24">Stock</th>
                  <th className="py-3 px-3 w-32">Featured</th>
                  <th className="py-3 px-3 w-36">New Arrival</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((p) => {
                  const pct = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0
                  const isLowStock = Number(p.stock) <= 3

                  return (
                    <tr
                      key={p._id}
                      className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition align-top"
                    >
                      {/* Product Name, Image & Category */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700">
                            {p.image ? (
                              <img
                                src={imgUrl(p.image)}
                                alt=""
                                onError={fallbackImg}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                              <span className="font-semibold text-brand">{p.category}</span>
                              {p.brand ? ` · ${p.brand}` : ''}
                              {p.sizes?.length ? ` · [${p.sizes.join(', ')}]` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Selling Price & MRP */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-400">₹</span>
                          <input
                            type="number"
                            key={`${p._id}-price-${p.price}`}
                            defaultValue={p.price}
                            onBlur={(e) => {
                              const v = Number(e.target.value)
                              if (v >= 0 && v !== p.price) patch(p._id, { price: v })
                            }}
                            className="w-24 text-xs font-bold border border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white rounded-lg px-2 py-1 outline-none focus:border-brand"
                          />
                        </div>
                        {pct > 0 ? (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                            {pct}% OFF (MRP {inr(p.mrp)})
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 mt-1">MRP {inr(p.mrp)}</p>
                        )}
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="py-3.5 px-3">
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            ['−10%', (x) => Math.round(x * 0.9)],
                            ['−5%', (x) => Math.round(x * 0.95)],
                            ['−₹20', (x) => x - 20],
                          ].map(([lbl, fn]) => (
                            <button
                              key={lbl}
                              type="button"
                              onClick={() => patch(p._id, { price: Math.max(0, fn(p.price)) })}
                              className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-md py-0.5 hover:bg-rose-100 dark:hover:bg-rose-900/70 transition"
                            >
                              {lbl}
                            </button>
                          ))}
                          {[
                            ['+₹20', (x) => x + 20],
                            ['+5%', (x) => Math.round(x * 1.05)],
                            ['+10%', (x) => Math.round(x * 1.1)],
                          ].map(([lbl, fn]) => (
                            <button
                              key={lbl}
                              type="button"
                              onClick={() => patch(p._id, { price: fn(p.price) })}
                              className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-md py-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 transition"
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Stock Level with Low Stock Badge */}
                      <td className="py-3.5 px-3">
                        <input
                          type="number"
                          key={`${p._id}-stock-${p.stock}`}
                          defaultValue={p.stock}
                          onBlur={(e) => {
                            const v = Number(e.target.value)
                            if (v >= 0 && v !== p.stock) patch(p._id, { stock: v })
                          }}
                          className={`w-16 text-xs font-bold border rounded-lg px-2 py-1 outline-none ${
                            isLowStock
                              ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                              : 'border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white'
                          }`}
                        />
                        {isLowStock && (
                          <span className="block text-[9px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                            {Number(p.stock) === 0 ? 'Out of stock' : 'Low stock'}
                          </span>
                        )}
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => patch(p._id, { featured: !p.featured })}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full transition ${
                            p.featured
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800'
                          }`}
                        >
                          {p.featured ? '★ Featured' : 'Standard'}
                        </button>
                      </td>

                      {/* New Arrival Toggle */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => patch(p._id, { isNewArrival: !p.isNewArrival })}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full transition ${
                            p.isNewArrival
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800'
                          }`}
                        >
                          {p.isNewArrival ? '✦ New Arrival' : 'Standard'}
                        </button>
                      </td>

                      {/* Edit / Delete Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="text-xs font-bold text-brand hover:underline mr-3 px-2 py-1 rounded-lg hover:bg-brand/10 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                        >
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

      {/* Product Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <form
            onSubmit={save}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl p-6 my-8 space-y-4 border border-slate-200 dark:border-slate-800"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {modal === 'add' ? 'Add New Product' : 'Edit Product'}
                </h2>
                <p className="text-xs text-slate-500">
                  {modal === 'add' ? 'Publish a new item to your online catalog' : `Updating SKU: ${modal}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* General Info */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Pure Cotton Oversized Tee"
                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Brand
                  </label>
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. MJ Originals"
                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-brand"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    type="number"
                    min="0"
                    placeholder="10"
                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 499"
                    type="number"
                    min="0"
                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-brand font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    MRP / Cross-out Price (₹)
                  </label>
                  <input
                    value={form.mrp}
                    onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                    placeholder="e.g. 999"
                    type="number"
                    min="0"
                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Sizes Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SIZES.map((s) => {
                    const isSelected = form.sizes?.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                          isSelected
                            ? 'bg-brand text-white border-brand shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Colors and Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Colors (comma separated)
                  </label>
                  <input
                    value={form.colors}
                    onChange={(e) => setForm({ ...form, colors: e.target.value })}
                    placeholder="e.g. Navy Blue, White, Black"
                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Search Tags
                  </label>
                  <input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="e.g. summer, trending, casual"
                    className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Primary Image Upload Dropzone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Primary Product Photo *
                  </label>
                  {imageCompressionInfo && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Optimized: {imageCompressionInfo.savingsPercent}% saved ({imageCompressionInfo.compressedKb} KB)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => document.getElementById('admin-product-file')?.click()}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Upload Image</span>
                  </button>

                  <input
                    id="admin-product-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageFile(file)
                      e.target.value = ''
                    }}
                  />

                  <input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="or paste image URL (https://...)"
                    className="flex-1 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:border-brand"
                  />
                </div>

                {form.image && (
                  <div className="mt-2 relative w-20 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <img
                      src={imgUrl(form.image)}
                      alt="Preview"
                      onError={fallbackImg}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: '' })}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center hover:bg-black"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Secondary Images */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Image URLs (comma separated for hover preview & gallery)
                </label>
                <input
                  value={form.images}
                  onChange={(e) => setForm({ ...form, images: e.target.value })}
                  placeholder="https://...img2.jpg, https://...img3.jpg"
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-brand"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Product Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Fabric type, fit guidance, styling notes..."
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-brand"
                />
              </div>

              {/* Checkboxes: Featured & New Arrival */}
              <div className="flex items-center gap-6 py-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-brand focus:ring-brand accent-brand"
                  />
                  <span>Featured in Hero Showcase</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isNewArrival}
                    onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                    className="w-4 h-4 rounded accent-rose-600"
                  />
                  <span>Mark as New Arrival ✦</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-brand hover:bg-brand-dark text-white shadow-xs transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : modal === 'add' ? 'Publish Product' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Delete Product Dialog */}
      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This item will no longer appear on your storefront.`}
        confirmLabel="Delete Product"
        cancelLabel="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
