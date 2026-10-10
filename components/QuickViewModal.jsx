'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { inr, discountPct } from '@/lib/format'
import { addToCart } from '@/lib/cart-client'
import { imgUrl } from '@/lib/img-url'
import { fallbackImg } from '@/lib/img-fallback'

gsap.registerPlugin(Flip)

export default function QuickViewModal({ product, isOpen, onClose, triggerImgRef }) {
  const [selectedImg, setSelectedImg] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const modalRef = useRef(null)
  const modalImgRef = useRef(null)
  const backdropRef = useRef(null)
  const contentRef = useRef(null)

  const images = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : product?.image
    ? [product.image]
    : []

  const sizes = Array.isArray(product?.sizes) && product.sizes.length > 0
    ? product.sizes
    : ['Free Size']

  const colors = Array.isArray(product?.colors) && product.colors.length > 0
    ? product.colors
    : []

  const pct = product ? discountPct(product.price, product.mrp) : 0
  const outOfStock = product?.stock === 0

  useEffect(() => {
    if (product) {
      const firstImg = (Array.isArray(product.images) && product.images[0]) || product.image || ''
      const firstSize = (Array.isArray(product.sizes) && product.sizes[0]) || 'Free Size'
      const firstColor = (Array.isArray(product.colors) && product.colors[0]) || ''
      const timer = setTimeout(() => {
        setSelectedImg(firstImg)
        setSelectedSize(firstSize)
        setSelectedColor(firstColor)
        setQty(1)
        setAdded(false)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [product])

  // GSAP Flip Shared Element Transition & Modal Animation
  useEffect(() => {
    if (!isOpen || !product) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    // Flip transition from card image to modal hero image
    const ctx = gsap.context(() => {
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.35, ease: 'power2.out' }
        )
      }

      if (triggerImgRef?.current && modalImgRef.current) {
        try {
          const state = Flip.getState([triggerImgRef.current, modalImgRef.current])
          Flip.fit(modalImgRef.current, triggerImgRef.current, {
            scale: true,
            absolute: true,
          })
          Flip.from(state, {
            duration: 0.5,
            ease: 'power3.out',
            clearProps: 'all',
          })
        } catch {
          // Graceful fallback
          if (contentRef.current) {
            gsap.fromTo(
              contentRef.current,
              { opacity: 0, scale: 0.95, y: 15 },
              { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power3.out' }
            )
          }
        }
      } else if (contentRef.current) {
        gsap.fromTo(
          contentRef.current,
          { opacity: 0, scale: 0.95, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power3.out' }
        )
      }
    }, modalRef)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      ctx.revert()
    }
  }, [isOpen, product, triggerImgRef, onClose])

  if (!isOpen || !product) return null

  function handleAdd() {
    if (outOfStock) return
    addToCart(product, selectedSize, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={contentRef}
        className="relative bg-white dark:bg-[#161616] border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto z-10 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition text-lg z-20 cursor-pointer"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Left Column: Image Gallery */}
        <div className="flex flex-col gap-3">
          <div
            ref={modalImgRef}
            className="aspect-[3/4] relative rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800"
          >
            <img
              src={imgUrl(selectedImg || product.image)}
              alt={product.name}
              onError={fallbackImg}
              className="w-full h-full object-cover transition duration-300"
            />
            {pct > 0 && (
              <span className="absolute top-3 left-3 bg-[#cc0000] text-white text-[11px] font-black px-2.5 py-1 rounded tracking-wide shadow-md">
                {pct}% OFF
              </span>
            )}
            {(product.isNewArrival || product.featured) && (
              <span className="absolute top-3 right-3 bg-black/80 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase border border-white/20">
                NEW
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImg(img)}
                  className={`relative w-14 h-18 rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                    selectedImg === img ? 'border-[#cc0000]' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Details */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold tracking-widest text-[#cc0000] uppercase font-mono">
                {product.brand || product.category || 'Fashion'}
              </span>
              {product.isNewArrival && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                  ✦ New Arrival
                </span>
              )}
            </div>

            <h2 id="quick-view-title" className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h2>

            {/* Price Row */}
            <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {inr(product.price)}
              </span>
              {product.mrp > product.price && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    {inr(product.mrp)}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Save {inr(product.mrp - product.price)} ({pct}% OFF)
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <p className="mt-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        selectedSize === s
                          ? 'bg-[#cc0000] text-white border-[#cc0000]'
                          : 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-neutral-700 hover:border-gray-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Color: <span className="font-normal capitalize">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1 text-xs rounded-full border transition cursor-pointer capitalize ${
                        selectedColor === c
                          ? 'border-[#cc0000] bg-[#cc0000]/10 text-[#cc0000] font-bold'
                          : 'border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Quantity:
              </span>
              <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800 transition font-bold"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-bold text-gray-900 dark:text-white">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800 transition font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleAdd}
              disabled={outOfStock}
              className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                added
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : outOfStock
                  ? 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed'
                  : 'bg-[#cc0000] hover:bg-[#b30000] text-white shadow-[#cc0000]/25'
              }`}
            >
              {added ? '✓ Added to Bag' : outOfStock ? 'Out of Stock' : 'Add to Bag'}
            </button>

            <Link
              href={`/product/${product._id}`}
              onClick={onClose}
              className="block text-center text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition py-1 font-semibold underline"
            >
              View Full Product Specifications →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
