'use client'

import { useState, useEffect, useRef, useTransition, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AnimatedProductGrid from '@/components/AnimatedProductGrid'
import { filterAndRankProducts } from '@/lib/smart-search'
import { CATEGORIES } from '@/lib/categories'

export default function ShopContent({
  initialProducts = [],
  activeCategory = null,
  initialQuery = '',
  onSale = false,
  isNewArrivals = false,
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [activeQuery, setActiveQuery] = useState(initialQuery)
  const [, startTransition] = useTransition()
  const debounceRef = useRef(null)

  // Derived filtered & ranked products using Smart Search engine
  const products = useMemo(() => {
    const trimmed = activeQuery.trim()
    if (!trimmed) return initialProducts
    return filterAndRankProducts(initialProducts, trimmed)
  }, [initialProducts, activeQuery])

  // Debounced search handling (250ms)
  const handleSearchChange = (val) => {
    setSearchTerm(val)
    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const trimmed = val.trim()
      setActiveQuery(trimmed)

      // Update URL query parameter smoothly without scrolling
      const params = new URLSearchParams(searchParams.toString())
      if (trimmed) {
        params.set('q', trimmed)
      } else {
        params.delete('q')
      }

      startTransition(() => {
        router.replace(`/shop?${params.toString()}`, { scroll: false })
      })
    }, 250)
  }

  const handleClear = () => {
    setSearchTerm('')
    setActiveQuery('')
    clearTimeout(debounceRef.current)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.replace(`/shop?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  return (
    <div className="space-y-6">
      {/* ── Interactive Smart Search Bar ─────────────────────── */}
      <div className="relative max-w-xl">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-gray-400 pointer-events-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search clothes, oversized tees, hoodies, sneakers..."
            className="w-full h-12 pl-11 pr-10 rounded-xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-neutral-800 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#cc0000] focus:ring-1 focus:ring-[#cc0000] shadow-sm transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3.5 p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Chips Bar ─────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <Link
          href="/shop"
          className={`inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-lg border transition shrink-0 ${
            !activeCategory && !onSale && !searchTerm && !isNewArrivals
              ? 'bg-[#cc0000] text-white border-[#cc0000] shadow-md shadow-[#cc0000]/20'
              : 'bg-white dark:bg-[#161616] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-800 hover:border-gray-400'
          }`}
        >
          All
        </Link>

        <Link
          href="/new-arrivals"
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition shrink-0 ${
            isNewArrivals
              ? 'bg-[#cc0000] text-white border-[#cc0000] shadow-md shadow-[#cc0000]/20'
              : 'bg-white dark:bg-[#161616] text-[#cc0000] border-[#cc0000]/30 hover:border-[#cc0000]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#cc0000] animate-pulse" />
          <span>New Arrivals</span>
        </Link>

        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/shop?category=${c.slug}${onSale ? '&onSale=1' : ''}`}
            className={`inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-lg border transition shrink-0 ${
              activeCategory === c.slug
                ? 'bg-[#cc0000] text-white border-[#cc0000] shadow-md shadow-[#cc0000]/20'
                : 'bg-white dark:bg-[#161616] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-800 hover:border-gray-400'
            }`}
          >
            {c.label}
          </Link>
        ))}

        <Link
          href={`/shop${activeCategory ? `?category=${activeCategory}&` : '?'}onSale=1`}
          className={`inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-lg border transition shrink-0 ${
            onSale
              ? 'bg-[#cc0000] text-white border-[#cc0000] shadow-md shadow-[#cc0000]/20'
              : 'bg-white dark:bg-[#161616] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-800 hover:border-gray-400'
          }`}
        >
          Sale
        </Link>
      </div>

      {/* ── Live Results Header ──────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div>
          {searchTerm.trim() ? (
            <p>
              Showing <span className="font-bold text-gray-900 dark:text-white">{products.length}</span> relevant result{products.length !== 1 ? 's' : ''} for &ldquo;<span className="text-[#cc0000] font-semibold">{searchTerm}</span>&rdquo;
            </p>
          ) : (
            <p>
              Showing <span className="font-bold text-gray-900 dark:text-white">{products.length}</span> styles
            </p>
          )}
        </div>
      </div>

      {/* ── Animated Product Grid ────────────────────────────── */}
      <AnimatedProductGrid
        products={products}
        emptyTitle={searchTerm ? `No matches for "${searchTerm}"` : 'No products found'}
        emptySubtitle={
          searchTerm
            ? 'We only display exact and relevant items matching your query. Try searching for "tee", "hoodie", "black", or choose a category.'
            : 'Try selecting another category or check back soon.'
        }
      />
    </div>
  )
}
