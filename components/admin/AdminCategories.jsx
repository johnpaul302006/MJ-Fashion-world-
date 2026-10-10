'use client'

import { useState, useEffect, useCallback } from 'react'
import { fileToDataUrl } from '@/lib/image-upload'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

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
          setError(err.message || 'Failed to load categories')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

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

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await fileToDataUrl(file)
      setForm((prev) => ({ ...prev, image: url }))
    } catch {
      setFormError('Failed to read image file')
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

      setSuccess(modalType === 'add' ? 'Category created successfully!' : 'Category updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
      setModalType(null)
      fetchCategories()
    } catch (err) {
      setFormError(err.message)
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

      setSuccess(
        `Category "${selectedCat.label}" deleted.` +
          (data.reassignedProducts > 0 ? ` (${data.reassignedProducts} products preserved under "All")` : '')
      )
      setTimeout(() => setSuccess(''), 4000)
      setModalType(null)
      setSelectedCat(null)
      setDeleteWarning(null)
      fetchCategories()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <span className="text-xs font-bold text-[#cc0000] uppercase tracking-wider">Store Customization</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">Shop by Category Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Control the categories displayed on the customer home page and shop filter. Newly added categories
            instantly appear in the dynamic curved sphere gallery and product dropdowns.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <span>+</span> Add Category
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <span>✓</span> {success}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Categories Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-7 h-7 border-2 border-[#cc0000] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading categories…</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No categories found</p>
          <p className="text-xs text-slate-500 mt-1">Create your first category above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat._id || cat.slug}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              {/* Image Banner */}
              <div className="relative aspect-[16/10] bg-neutral-900 overflow-hidden">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/20">
                  Slug: {cat.slug}
                </div>
                <div className="absolute top-3 right-3 bg-[#cc0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  Order #{cat.order ?? 0}
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#cc0000] font-bold">
                    {cat.sub || 'Collection'}
                  </span>
                  <h3 className="text-lg font-black tracking-tight">{cat.label}</h3>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs mt-auto">
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  ID: {String(cat._id || cat.slug).slice(-6)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-bold transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDelete(cat)}
                    className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {modalType === 'add' ? 'Add New Category' : `Edit Category: ${selectedCat?.label}`}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
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
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs outline-none focus:border-[#cc0000]"
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
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs outline-none focus:border-[#cc0000] mb-2"
              />
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold cursor-pointer">
                  <span>Upload Image File</span>
                  <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                </label>
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
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs outline-none focus:border-[#cc0000]"
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
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs outline-none focus:border-[#cc0000]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-10 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
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
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Deleting…' : deleteWarning ? 'Confirm & Reassign Products' : 'Delete Category'}
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
