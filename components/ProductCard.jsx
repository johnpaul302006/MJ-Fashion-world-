'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { inr, discountPct } from '@/lib/format'
import { addToCart } from '@/lib/cart-client'
import { HostDeleteButton } from '@/components/HostProductActions'
import { fallbackImg } from '@/lib/img-fallback'
import { imgUrl } from '@/lib/img-url'

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

export default function ProductCard({ product }) {
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const toastTimer = useRef(null)

  const pct = discountPct(product.price, product.mrp)
  const size = product.sizes?.[0] || 'Free Size'
  const outOfStock = product.stock === 0

  function addQuick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    addToCart(product, size, 1)
    setAdded(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setAdded(false), 1600)
  }

  function toggleWishlist(e) {
    e.preventDefault()
    e.stopPropagation()
    setWishlisted((w) => !w)
  }

  return (
    <div className="product-card group bg-white dark:bg-[#1a1a1a]">
      {/* ── Image ───────────────────────────── */}
      <Link href={`/product/${product._id}`} className="block card-img" style={{ aspectRatio: '3/4' }}>
        <HostDeleteButton product={product} />

        {product.image ? (
          <img
            src={imgUrl(product.image)}
            alt={product.name}
            loading="lazy"
            onError={fallbackImg}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm bg-gray-50 dark:bg-[#222]">
            No image
          </div>
        )}

        {/* Badges */}
        {pct > 0 && (
          <span className="absolute top-2 left-2 bg-brand text-white text-[10px] font-black px-2 py-0.5 tracking-wide z-10">
            {pct}% OFF
          </span>
        )}
        {!pct && product.featured && (
          <span className="absolute top-2 left-2 bg-[#111] text-white text-[10px] font-black px-2 py-0.5 tracking-wide z-10">
            NEW
          </span>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center z-10">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase border border-gray-300 dark:border-gray-600 px-3 py-1">
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist btn */}
        <button
          onClick={toggleWishlist}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 z-10 ${
            wishlisted
              ? 'bg-brand text-white'
              : 'bg-white/90 dark:bg-[#222]/90 text-gray-400 hover:text-brand dark:hover:text-brand'
          }`}
          title="Wishlist"
        >
          <HeartIcon filled={wishlisted} />
        </button>

        {/* Quick-add hover overlay */}
        {!outOfStock && (
          <button
            onClick={addQuick}
            className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-200 z-10 ${
              added
                ? 'bg-green-600 text-white translate-y-0 opacity-100'
                : 'bg-[#111]/90 text-white translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
            }`}
          >
            <BagIcon />
            {added ? '✓ Added to Bag' : 'Quick Add'}
          </button>
        )}
      </Link>

      {/* ── Info ────────────────────────────── */}
      <div className="p-2.5 sm:p-3">
        {/* Brand */}
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 truncate">
          {product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : 'Fashion'}
        </p>

        {/* Name */}
        <Link href={`/product/${product._id}`} className="block">
          <p className="text-sm text-gray-800 dark:text-gray-100 font-medium line-clamp-2 leading-snug min-h-[2.5rem] hover:text-brand transition-colors">
            {product.name}
          </p>
        </Link>

        {/* Price row */}
        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
          <span className="font-black text-gray-900 dark:text-white text-sm">
            {inr(product.price)}
          </span>
          {product.mrp > product.price ? (
            <>
              <span className="text-xs text-gray-400 line-through">{inr(product.mrp)}</span>
              <span className="text-xs font-bold text-green-600">({pct}% off)</span>
            </>
          ) : null}
        </div>

        {/* Add to Bag btn — always visible on mobile */}
        <button
          onClick={addQuick}
          disabled={outOfStock}
          className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold tracking-wider uppercase border transition-all duration-200 sm:hidden ${
            added
              ? 'bg-green-600 border-green-600 text-white'
              : outOfStock
              ? 'bg-gray-100 border-gray-200 text-gray-400 dark:bg-[#222] dark:border-[#333] dark:text-gray-600'
              : 'bg-white border-brand text-brand hover:bg-brand hover:text-white dark:bg-[#1a1a1a]'
          }`}
        >
          <BagIcon />
          {added ? '✓ Added' : outOfStock ? 'Out of Stock' : 'Add to Bag'}
        </button>
      </div>
    </div>
  )
}