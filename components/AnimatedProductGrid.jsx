'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import ProductCard from '@/components/ProductCard'

gsap.registerPlugin(ScrollTrigger, Flip)

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-100 dark:border-neutral-800/80 animate-pulse">
      <div className="aspect-[3/4] bg-gray-200 dark:bg-neutral-800 relative">
        <div className="absolute top-2.5 left-2.5 w-12 h-4 bg-gray-300 dark:bg-neutral-700 rounded" />
      </div>
      <div className="p-3.5 space-y-2.5">
        <div className="w-16 h-2.5 bg-gray-200 dark:bg-neutral-700 rounded" />
        <div className="w-full h-3.5 bg-gray-200 dark:bg-neutral-700 rounded" />
        <div className="w-3/4 h-3.5 bg-gray-200 dark:bg-neutral-700 rounded" />
        <div className="w-20 h-4 bg-gray-300 dark:bg-neutral-700 rounded mt-2" />
      </div>
    </div>
  )
}

export default function AnimatedProductGrid({
  products = [],
  loading = false,
  emptyTitle = 'No products found',
  emptySubtitle = 'Try selecting another category or refining your search.',
  error = null,
  onRetry = null,
}) {
  const gridRef = useRef(null)
  const prevProductsRef = useRef(products)
  const isInitial = useRef(true)

  // GSAP Flip animation when products list reorders or filters
  useEffect(() => {
    if (loading || !gridRef.current) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      prevProductsRef.current = products
      return
    }

    if (isInitial.current) {
      isInitial.current = false
      // Staggered reveal for initial load using ScrollTrigger
      const ctx = gsap.context(() => {
        const cards = gridRef.current?.querySelectorAll('.product-card')
        if (cards && cards.length > 0) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 32, scale: 0.97 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.65,
              stagger: 0.07,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: gridRef.current,
                start: 'top 85%',
                once: true,
              },
            }
          )
        }
      }, gridRef)

      prevProductsRef.current = products
      return () => ctx.revert()
    }

    // On subsequent filter/search updates: Smooth GSAP Flip transition
    const cards = gridRef.current.querySelectorAll('.product-card')
    if (cards.length > 0) {
      const state = Flip.getState(cards)
      prevProductsRef.current = products

      requestAnimationFrame(() => {
        Flip.from(state, {
          duration: 0.55,
          ease: 'power3.inOut',
          stagger: 0.04,
          onEnter: (elements) =>
            gsap.fromTo(
              elements,
              { opacity: 0, scale: 0.9 },
              { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }
            ),
          onLeave: (elements) =>
            gsap.to(elements, {
              opacity: 0,
              scale: 0.9,
              duration: 0.35,
              ease: 'power2.in',
            }),
        })
      })
    } else {
      prevProductsRef.current = products
    }
  }, [products, loading])

  // Loading State with Skeletons
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white dark:bg-[#161616] border border-red-200 dark:border-red-900/40 rounded-2xl p-12 text-center my-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center text-xl">
          ⚠
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
          Unable to load products
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-xl bg-[#cc0000] text-white text-xs font-bold transition hover:bg-[#b30000] cursor-pointer"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  // Empty State
  if (!products || products.length === 0) {
    return (
      <div className="bg-white dark:bg-[#161616] border border-gray-100 dark:border-neutral-800 rounded-2xl p-12 sm:p-16 text-center my-6 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-3xl">
          🔍
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg sm:text-xl mb-1.5">
          {emptyTitle}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          {emptySubtitle}
        </p>

        {/* Category suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
          <Link
            href="/shop"
            className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:opacity-90 transition"
          >
            All Products
          </Link>
          <Link
            href="/new-arrivals"
            className="px-4 py-2 rounded-xl bg-[#cc0000] text-white text-xs font-bold hover:bg-[#b30000] transition"
          >
            ✦ New Arrivals
          </Link>
          <Link
            href="/shop?category=men"
            className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:border-gray-400 transition"
          >
            Men
          </Link>
          <Link
            href="/shop?category=women"
            className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:border-gray-400 transition"
          >
            Women
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
    >
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  )
}
