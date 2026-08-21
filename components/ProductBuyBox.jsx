'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/lib/cart-client'

function BagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

export default function ProductBuyBox({ product }) {
  const router = useRouter()
  const [size, setSize] = useState(product.sizes?.[0] || 'Free Size')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const outOfStock = product.stock === 0

  function add() {
    addToCart(product, size, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  function buyNow() {
    addToCart(product, size, qty)
    router.push('/checkout')
  }

  return (
    <div className="space-y-5">

      {/* Size selector */}
      {product.sizes?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Select Size
            </p>
            {product.sizes.length > 1 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {product.sizes.length} available
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`min-w-[46px] h-10 px-3 text-sm font-bold border-2 transition-all duration-150 ${
                  size === s
                    ? 'border-[#111] dark:border-white bg-[#111] dark:bg-white text-white dark:text-[#111]'
                    : 'border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2.5">
          Quantity
        </p>
        <div className="flex items-center gap-0">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-10 h-10 border-2 border-gray-200 dark:border-[#333] font-bold text-gray-700 dark:text-gray-300 hover:border-brand hover:text-brand transition-colors text-lg"
          >
            −
          </button>
          <span className="w-12 text-center font-black text-gray-900 dark:text-white border-y-2 border-gray-200 dark:border-[#333] h-10 flex items-center justify-center text-sm">
            {qty}
          </span>
          <button
            onClick={() => setQty(Math.min(product.stock || 10, qty + 1))}
            className="w-10 h-10 border-2 border-gray-200 dark:border-[#333] font-bold text-gray-700 dark:text-gray-300 hover:border-brand hover:text-brand transition-colors text-lg"
          >
            +
          </button>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="ml-3 text-xs text-amber-600 dark:text-amber-400 font-semibold">
              Only {product.stock} left!
            </span>
          )}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-2.5 pt-1">
        <button
          onClick={add}
          disabled={outOfStock}
          className={`w-full flex items-center justify-center gap-2 py-3.5 text-sm font-black tracking-widest uppercase border-2 transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 ${
            added
              ? 'bg-green-600 border-green-600 text-white'
              : outOfStock
              ? 'bg-gray-100 border-gray-200 text-gray-400 dark:bg-[#1a1a1a] dark:border-[#333] dark:text-gray-600 cursor-not-allowed'
              : 'bg-white dark:bg-transparent border-[#111] dark:border-white text-[#111] dark:text-white hover:bg-[#111] dark:hover:bg-white hover:text-white dark:hover:text-[#111]'
          }`}
        >
          <BagIcon />
          {added ? '✓ Added to Bag' : outOfStock ? 'Out of Stock' : 'Add to Bag'}
        </button>

        <button
          onClick={buyNow}
          disabled={outOfStock}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-black tracking-widest uppercase bg-brand hover:bg-brand-dark text-white disabled:bg-gray-200 dark:disabled:bg-gray-700 transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          <BoltIcon />
          {outOfStock ? 'Out of Stock' : 'Buy Now · UPI'}
        </button>
      </div>
    </div>
  )
}