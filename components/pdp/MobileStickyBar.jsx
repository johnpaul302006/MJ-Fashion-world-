'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/lib/cart-client'

function BagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export default function MobileStickyBar({
  product,
  selectedSize,
  quantity = 1,
  onRequireSize,
}) {
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const outOfStock = product.stock === 0

  function handleAddToCart() {
    if (outOfStock) return
    if (!selectedSize && product.sizes?.length > 0) {
      if (onRequireSize) onRequireSize()
      return
    }
    addToCart(product, selectedSize || product.sizes?.[0] || 'Free Size', quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  function handleBuyNow() {
    if (outOfStock) return
    if (!selectedSize && product.sizes?.length > 0) {
      if (onRequireSize) onRequireSize()
      return
    }
    addToCart(product, selectedSize || product.sizes?.[0] || 'Free Size', quantity)
    router.push('/checkout')
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#222] p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-2xl flex items-center gap-2">
      {/* Add to Bag (50%) */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={outOfStock}
        className={`flex-1 h-12 flex items-center justify-center gap-1.5 px-2 text-[14px] font-bold tracking-wider uppercase rounded-sm border transition-all ${
          added
            ? 'bg-emerald-600 text-white border-emerald-600'
            : outOfStock
            ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-600 border-gray-200 dark:border-[#2a2a2a] cursor-not-allowed'
            : 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-900 dark:border-gray-200'
        }`}
      >
        <BagIcon />
        <span>{added ? 'Added' : outOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
      </button>

      {/* Buy Now (50%) */}
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={outOfStock}
        className={`flex-1 h-12 flex items-center justify-center gap-1.5 px-2 text-[14px] font-bold tracking-wider uppercase text-white rounded-sm shadow-md transition-all ${
          outOfStock
            ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
            : 'bg-brand hover:bg-brand-dark active:scale-[0.99]'
        }`}
      >
        <BoltIcon />
        <span>{outOfStock ? 'Out of Stock' : 'Buy Now'}</span>
      </button>
    </div>
  )
}
