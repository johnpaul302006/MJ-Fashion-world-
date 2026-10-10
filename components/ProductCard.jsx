'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { inr, discountPct } from '@/lib/format'
import { addToCart } from '@/lib/cart-client'
import { isInWishlist, toggleWishlist as toggleWishlistAction } from '@/lib/wishlist-client'
import { HostDeleteButton } from '@/components/HostProductActions'
import { RatingBadge } from '@/components/ProductReviews'
import { fallbackImg } from '@/lib/img-fallback'
import { imgUrl } from '@/lib/img-url'
import QuickViewModal from '@/components/QuickViewModal'

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  )
}

function BagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

export default function ProductCard({ product }) {
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [heartPulsing, setHeartPulsing] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const toastTimer = useRef(null)
  const imgRef = useRef(null)

  const pct = discountPct(product.price, product.mrp)
  const size = product.sizes?.[0] || 'Free Size'
  const outOfStock = product.stock === 0

  const primaryImg = product.image || (Array.isArray(product.images) ? product.images[0] : '')
  const secondaryImg = Array.isArray(product.images) && product.images.length > 1
    ? product.images[1]
    : null

  useEffect(() => {
    const t = setTimeout(() => setWishlisted(isInWishlist(product._id)), 0)
    const update = () => setWishlisted(isInWishlist(product._id))
    window.addEventListener('wishlist-updated', update)
    return () => {
      clearTimeout(t)
      window.removeEventListener('wishlist-updated', update)
    }
  }, [product._id])

  function addQuick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    addToCart(product, size, 1)
    setAdded(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setAdded(false), 1600)
  }

  function handleToggleWishlist(e) {
    e.preventDefault()
    e.stopPropagation()
    setHeartPulsing(true)
    setTimeout(() => setHeartPulsing(false), 250)
    const next = toggleWishlistAction(product)
    setWishlisted(next)
  }

  function openQuickView(e) {
    e.preventDefault()
    e.stopPropagation()
    setQuickViewOpen(true)
  }

  return (
    <>
      <div
        className="product-card group relative bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-100 dark:border-neutral-800/80 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:border-gray-200 dark:hover:border-neutral-700 active:scale-[0.97] touch-manipulation"
      >
        {/* ── Image Container (overflow-hidden for 1.06 zoom & crossfade) ── */}
        <Link
          href={`/product/${product._id}`}
          className="block relative overflow-hidden bg-gray-50 dark:bg-[#141414]"
          style={{ aspectRatio: '3/4' }}
        >
          <HostDeleteButton product={product} />

          {/* Primary image with zoom */}
          {primaryImg ? (
            <div ref={imgRef} className="w-full h-full relative overflow-hidden">
              <img
                src={imgUrl(primaryImg)}
                alt={product.name}
                loading="lazy"
                onError={fallbackImg}
                className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] will-change-transform ${
                  secondaryImg ? 'transition-opacity duration-500 group-hover:opacity-0' : ''
                }`}
              />

              {/* Secondary image for hover crossfade if available */}
              {secondaryImg && (
                <img
                  src={imgUrl(secondaryImg)}
                  alt={`${product.name} view 2`}
                  loading="lazy"
                  onError={fallbackImg}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.06] will-change-transform"
                />
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm">
              No image
            </div>
          )}

          {/* Rating badge */}
          <RatingBadge productId={product._id} />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {pct > 0 && (
              <span className="bg-[#cc0000] text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm tracking-wide">
                {pct}% OFF
              </span>
            )}
            {(product.isNewArrival || product.featured) && (
              <span className="bg-[#111] dark:bg-black text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm tracking-wider uppercase border border-white/20">
                NEW
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/75 dark:bg-black/75 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider uppercase border border-gray-400 dark:border-gray-600 px-3 py-1 rounded bg-white/80 dark:bg-black/80 shadow-sm">
                Out of Stock
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            onMouseDown={(e) => e.stopPropagation()}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 z-20 cursor-pointer ${
              wishlisted
                ? 'bg-[#cc0000] text-white scale-105'
                : 'bg-white/95 dark:bg-[#222]/95 text-gray-600 dark:text-gray-300 hover:text-[#cc0000] dark:hover:text-[#cc0000] hover:scale-105'
            } ${heartPulsing ? 'scale-125' : ''}`}
            title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <HeartIcon filled={wishlisted} />
          </button>

          {/* Desktop Hover Action Bar: Quick View & Quick Add */}
          {!outOfStock && (
            <div
              className={`hidden sm:flex absolute bottom-0 left-0 right-0 z-20 p-2 gap-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-300 ease-out ${
                added
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
              }`}
            >
              <button
                type="button"
                onClick={openQuickView}
                className="flex-1 py-2 px-2.5 rounded-lg bg-white/95 hover:bg-white text-gray-900 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                title="Quick View"
              >
                <EyeIcon />
                <span>Quick View</span>
              </button>
              <button
                type="button"
                onClick={addQuick}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                  added
                    ? 'bg-emerald-600 text-white w-full'
                    : 'bg-[#cc0000] hover:bg-[#b30000] text-white'
                }`}
                title="Add to Bag"
              >
                <BagIcon />
                <span>{added ? '✓ Added' : 'Add'}</span>
              </button>
            </div>
          )}
        </Link>

        {/* ── Info Section ────────────────────────────── */}
        <div className="p-3 sm:p-3.5 flex flex-col justify-between">
          <div>
            {/* Category / Brand */}
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 truncate">
              {product.brand || product.category || 'Fashion'}
            </p>

            {/* Name */}
            <Link href={`/product/${product._id}`} className="block">
              <h3 className="text-xs sm:text-sm text-gray-800 dark:text-gray-100 font-medium line-clamp-2 leading-snug min-h-[2.4rem] hover:text-[#cc0000] dark:hover:text-[#cc0000] transition-colors">
                {product.name}
              </h3>
            </Link>

            {/* Price Row */}
            <div className="mt-2 flex items-baseline gap-2 flex-wrap">
              <span className="font-black text-gray-900 dark:text-white text-sm sm:text-base">
                {inr(product.price)}
              </span>
              {product.mrp > product.price ? (
                <>
                  <span className="text-xs text-gray-400 line-through">
                    {inr(product.mrp)}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ({pct}% off)
                  </span>
                </>
              ) : null}
            </div>
          </div>

          {/* Touch Devices Quick Add — always visible on mobile */}
          <div className="mt-2.5 sm:hidden">
            <button
              onClick={addQuick}
              disabled={outOfStock}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border active:scale-95 ${
                added
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : outOfStock
                  ? 'bg-gray-100 border-gray-200 text-gray-400 dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-neutral-900 border-[#cc0000] text-[#cc0000] hover:bg-[#cc0000] hover:text-white'
              }`}
            >
              <BagIcon />
              <span>{added ? '✓ Added' : outOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewOpen && (
        <QuickViewModal
          product={product}
          isOpen={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
          triggerImgRef={imgRef}
        />
      )}
    </>
  )
}