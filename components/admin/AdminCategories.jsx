'use client'

import { useState, useEffect, useCallback } from 'react'
import { processAdminImage } from '@/lib/image-upload'
import { useAdminToast } from './AdminToast'

export default function AdminCategories() {
  const { showSuccess, showError, showWarning } = useAdminToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [modalType, setModalType] = useState(null) // 'add' | 'edit' | 'delete'
  const [selectedCat, setSelectedCat] = useState(null)
  const [form, setForm] = useState({
    name: '',
    image: '',
    sub: 'Collection',
    order: 0,
  })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteWarning, setDeleteWarning] = useState(null)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load categories')
      setCategories(data.categories || [])
    } catch (err) {
      showError(err.message || 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    let cancelled = false
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          if (Array.isArray(data.categories)) {
            setCategories(data.categories)
          }
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          showError(err.message || 'Failed to load categories')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [showError])

  const openAdd = () => {
    setForm({
      name: '',
      image: '',
      sub: 'Collection',
      order: categories.length + 1,
    })
    setFormError('')
    setModalType('add')
  }

  const openEdit = (cat) => {
    setSelectedCat(cat)
    setForm({
      name: cat.label,
      image: cat.image,
      sub: cat.sub || 'Collection',
      order: cat.order ?? 0,
    })
    setFormError('')
    setModalType('edit')
  }

  const openDelete = (cat) => {
    setSelectedCat(cat)
    setDeleteWarning(null)
    setModalType('delete')
  }

  const handleImageFile = async (file) => {
    if (!file) return
    try {
      const processed = await processAdminImage(file, { maxWidth: 900, quality: 0.82 })
      setForm((prev) => ({ ...prev, image: processed.dataUrl }))
      showSuccess(`Image processed (${processed.compressedKb} KB)`)
    } catch (err) {
      setFormError('Failed to read image file: ' + err.message)
      showError('Image processing error')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) return setFormError('Category name is required')
    if (!form.image.trim()) return setFormError('Category image is required')

    setSaving(true)
    try {
      const url = modalType === 'add' ? '/api/categories' : `/api/categories/${selectedCat._id || selectedCat.slug}`
      const method = modalType === 'add' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save category')

      showSuccess(modalType === 'add' ? 'Category created successfully!' : 'Category updated successfully!')
      setModalType(null)
      fetchCategories()
    } catch (err) {
      setFormError(err.message)
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (confirm = false) => {
    if (!selectedCat) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/categories/${selectedCat._id || selectedCat.slug}${confirm ? '?confirm=true' : ''}`,
        { method: 'DELETE' }
      )
      const data = await res.json()

      if (res.status === 409 && data.requiresConfirmation) {
        setDeleteWarning({
          count: data.productCount,
          message: data.error,
        })
        setSaving(false)
        return
      }

      if (!res.ok) throw new Error(data.error || 'Failed to delete category')

      showSuccess(
        `Category "${selectedCat.label}" deleted.` +
          (data.reassignedProducts > 0 ? ` (${data.reassignedProducts} products preserved under "All")` : '')
      )
      setModalType(null)
      setSelectedCat(null)
      setDeleteWarning(null)
      fetchCategories()
    } catch (err) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
            Store Customization
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            Category Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Control the categories shown in the customer navigation and homepage gallery. Newly added categories
            instantly appear across the storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-xs uppercase tracking-wider transition shadow-xs flex items-center gap-1.5"
        >
          <span>+</span> Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 animate-pulse">
          <p className="text-xs font-semibold">Loading categories…</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No categories found</p>
          <p className="text-xs text-slate-400 mt-1">Create your first category above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat._id || cat.slug}
              className="group relative bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              {/* Image Banner */}
              <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/20">
                  Slug: {cat.slug}
                </div>
                <div className="absolute top-3 right-3 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  Order #{cat.order ?? 0}
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    {cat.sub || 'Collection'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">{cat.label}</h3>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs mt-auto">
                <span className="text-slate-400 font-mono text-[11px]">
                  ID: {String(cat._id || cat.slug).slice(-6)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-bold transition"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(cat)}
                    className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {modalType === 'add' ? 'Add New Category' : `Edit Category: ${selectedCat?.label}`}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                ⚠ {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category Name * <span className="font-normal text-slate-400">(e.g. Streetwear, Hoodies)</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter unique category name"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category Image URL *
              </label>
              <input
                type="text"
                required
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="Paste image URL (https://...)"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs outline-none focus:border-brand mb-2"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('cat-image-file')?.click()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                >
                  Upload Image File
                </button>
                <input
                  id="cat-image-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleImageFile(f)
                    e.target.value = ''
                  }}
                  className="hidden"
                />
              </div>

              {/* Image Preview */}
              {form.image && (
                <div className="mt-3 relative aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
                  <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-2 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                    Image Preview
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline / Subtitle <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.sub}
                  onChange={(e) => setForm({ ...form, sub: e.target.value })}
                  placeholder="e.g. Trendy Fits"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Display Order <span className="font-normal text-slate-400">(number)</span>
                </label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-10 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : modalType === 'add' ? 'Create Category' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalType === 'delete' && selectedCat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete &ldquo;{selectedCat.label}&rdquo;?
            </h3>

            {deleteWarning ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                <p className="font-bold">⚠ Safety Confirmation Required</p>
                <p>
                  This category contains <b>{deleteWarning.count} product(s)</b>. Deleting it will safely reassign
                  all its products to &ldquo;All Products&rdquo; so no customer links or purchases are broken.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete this category from your store?
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleDelete(Boolean(deleteWarning))}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
              >
                {saving ? 'Deleting…' : deleteWarning ? 'Confirm & Reassign' : 'Delete Category'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalType(null)
                  setDeleteWarning(null)
                }}
                className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
