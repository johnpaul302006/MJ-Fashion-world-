'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { inr, discountPct } from '@/lib/format'
import { addToCart } from '@/lib/cart-client'
import { getWishlist, removeFromWishlist } from '@/lib/wishlist-client'
import { fallbackImg } from '@/lib/img-fallback'
import { imgUrl } from '@/lib/img-url'
import { RatingBadge } from '@/components/ProductReviews'

function HeartOutlineIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
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

export default function WishlistPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [addedIds, setAddedIds] = useState({})
  const [selectedSizes, setSelectedSizes] = useState({})

  useEffect(() => {
    const t = setTimeout(() => {
      setItems(getWishlist())
      setLoading(false)
    }, 0)

    function handleUpdate(e) {
      if (e?.detail) setItems(e.detail)
      else setItems(getWishlist())
    }

    window.addEventListener('wishlist-updated', handleUpdate)
    return () => {
      clearTimeout(t)
      window.removeEventListener('wishlist-updated', handleUpdate)
    }
  }, [])

  function handleRemove(id) {
    const updated = removeFromWishlist(id)
    setItems(updated || [])
  }

  function handleAddToCart(item) {
    const chosenSize = selectedSizes[item._id] || item.sizes?.[0] || 'Free Size'
    addToCart(item, chosenSize, 1)
    setAddedIds((prev) => ({ ...prev, [item._id]: true }))
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item._id]: false }))
    }, 1800)
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0f0f] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-5">
          <Link href="/" className="hover:text-brand transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-200 font-medium">My Wishlist</span>
        </nav>

        {/* Page Title */}
        <div className="flex items-baseline justify-between border-b border-gray-200 dark:border-[#222] pb-4 mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-wider">
              My Wishlist
            </h1>
            {!loading && (
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                ({items.length} {items.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </div>
          {items.length > 0 && (
            <Link
              href="/shop"
              className="text-xs font-bold uppercase tracking-wider text-brand hover:underline"
            >
              + Add More Items
            </Link>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white dark:bg-[#1a1a1a] rounded-sm p-3 border border-gray-100 dark:border-[#2a2a2a] space-y-3">
                <div className="shimmer aspect-[3/4] rounded-sm" />
                <div className="shimmer h-4 w-3/4 rounded-sm" />
                <div className="shimmer h-4 w-1/2 rounded-sm" />
                <div className="shimmer h-9 w-full rounded-sm" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-[#161616] border border-gray-100 dark:border-[#2a2a2a] rounded-sm p-12 sm:p-16 text-center max-w-lg mx-auto shadow-xs my-8">
            <div className="flex justify-center text-gray-300 dark:text-gray-600 mb-4">
              <HeartOutlineIcon />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed max-w-sm mx-auto">
              Save items you love and find them here later. Tap the heart icon on any product to save it to your wishlist.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3.5 text-xs tracking-widest uppercase transition-colors shadow-md hover:shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          /* Wishlist Items Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {items.map((item) => {
              const pct = discountPct(item.price, item.mrp)
              const outOfStock = item.stock === 0
              const isAdded = addedIds[item._id]
              const currentSize = selectedSizes[item._id] || item.sizes?.[0] || 'Free Size'

              return (
                <div
                  key={item._id}
                  className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#262626] rounded-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200 group relative"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item._id)}
                    className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-[#222]/95 text-brand shadow-sm flex items-center justify-center hover:bg-brand hover:text-white transition-all duration-150"
                    title="Remove from Wishlist"
                    aria-label="Remove from Wishlist"
                  >
                    <TrashIcon />
                  </button>

                  {/* Product Image Link */}
                  <Link
                    href={`/product/${item._id}`}
                    className="block relative overflow-hidden bg-gray-50 dark:bg-[#222]"
                    style={{ aspectRatio: '3/4' }}
                  >
                    {item.image ? (
                      <img
                        src={imgUrl(item.image)}
                        alt={item.name}
                        loading="lazy"
                        onError={fallbackImg}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 text-xs">
                        No image
                      </div>
                    )}

                    {pct > 0 && (
                      <span className="absolute top-2 left-2 bg-brand text-white text-[10px] font-black px-2 py-0.5 tracking-wide z-10">
                        {pct}% OFF
                      </span>
                    )}

                    {outOfStock && (
                      <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center z-10">
                        <span className="text-xs font-bold text-gray-500 uppercase border border-gray-300 px-3 py-1">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    <RatingBadge productId={item._id} />
                  </Link>

                  {/* Product Details */}
                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    {item.category && (
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 truncate">
                        {item.category}
                      </p>
                    )}

                    <Link href={`/product/${item._id}`} className="block flex-1 mb-2">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug hover:text-brand transition-colors">
                        {item.name}
                      </h3>
                    </Link>

                    {/* Price row */}
                    <div className="flex items-baseline gap-2 mb-3 flex-wrap">
                      <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                        {inr(item.price)}
                      </span>
                      {item.mrp > item.price ? (
                        <>
                          <span className="text-xs text-gray-400 line-through">
                            {inr(item.mrp)}
                          </span>
                          <span className="text-xs font-bold text-green-600">
                            ({pct}% off)
                          </span>
                        </>
                      ) : null}
                    </div>

                    {/* Available Sizes selector (if applicable) */}
                    {item.sizes?.length > 1 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                          <span>Size: {currentSize}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.sizes.map((s) => (
                            <button
                              key={s}
                              onClick={() => setSelectedSizes((prev) => ({ ...prev, [item._id]: s }))}
                              className={`text-[11px] font-bold px-2 py-0.5 border rounded-xs transition-colors ${
                                currentSize === s
                                  ? 'bg-[#111] dark:bg-white text-white dark:text-[#111] border-[#111] dark:border-white'
                                  : 'border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-gray-400'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-1.5 mt-auto pt-2 border-t border-gray-100 dark:border-[#262626]">
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={outOfStock}
                        className={`w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                          isAdded
                            ? 'bg-green-600 text-white'
                            : outOfStock
                            ? 'bg-gray-100 text-gray-400 dark:bg-[#222] cursor-not-allowed'
                            : 'bg-brand hover:bg-brand-dark text-white shadow-xs'
                        }`}
                      >
                        <BagIcon />
                        {isAdded ? '✓ Added to Bag' : outOfStock ? 'Out of Stock' : 'Add to Bag'}
                      </button>

                      <button
                        onClick={() => handleRemove(item._id)}
                        className="w-full text-center py-1.5 text-[11px] font-semibold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-1"
                      >
                        <TrashIcon />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
