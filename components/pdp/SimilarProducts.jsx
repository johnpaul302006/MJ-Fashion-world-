'use client'

import { useRef } from 'react'
import ProductCard from '@/components/ProductCard'

export default function SimilarProducts({ products = [] }) {
  const scrollRef = useRef(null)

  if (!products || products.length === 0) return null

  function scroll(direction) {
    if (!scrollRef.current) return
    const offset = direction === 'left' ? -320 : 320
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <section className="mt-12 pt-8 border-t border-gray-200 dark:border-[#222]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
            Similar Products You Might Like
          </h2>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            Customers who viewed this item also explored
          </p>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-[#333] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
            aria-label="Previous products"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-[#333] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
            aria-label="Next products"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-3"
      >
        {products.map((item) => (
          <div
            key={item._id}
            className="w-[200px] sm:w-[240px] shrink-0"
          >
            <ProductCard product={item} />
          </div>
        ))}
      </div>
    </section>
  )
}
