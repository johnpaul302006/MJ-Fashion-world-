'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { inr, discountPct } from '@/lib/format'
import { addToCart } from '@/lib/cart-client'

export default function ScrollSphereGallery({
  items = [],
  type = 'product', // 'product' | 'category'
  title = '',
  subtitle = '',
  badge = '',
  emptyTitle = 'No items in this collection',
  emptySubtitle = 'Explore our other collections or check back soon for fresh arrivals.',
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animProgress, setAnimProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReduced, setPrefersReduced] = useState(false)
  const [addedId, setAddedId] = useState(null)
  const containerRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startProgressRef = useRef(0)
  const rafRef = useRef(null)
  const targetIndexRef = useRef(0)

  // Detect mobile & prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateSize = () => {
      setIsMobile(window.innerWidth < 768)
      setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Keep target within valid bounds
  const itemCount = items.length
  const clampIndex = useCallback(
    (idx) => Math.max(0, Math.min(itemCount - 1, idx)),
    [itemCount]
  )

  // Spring lerp loop towards target index
  useEffect(() => {
    if (prefersReduced || itemCount === 0) return

    let current = animProgress
    const loop = () => {
      const target = targetIndexRef.current
      const diff = target - current
      if (Math.abs(diff) > 0.001) {
        current += diff * 0.14 // Smooth lerp
        setAnimProgress(current)
      } else {
        current = target
        setAnimProgress(target)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [animProgress, prefersReduced, itemCount])

  const goTo = (idx) => {
    const clamped = clampIndex(idx)
    targetIndexRef.current = clamped
    setCurrentIndex(clamped)
  }

  const goNext = () => goTo(currentIndex + 1)
  const goPrev = () => goTo(currentIndex - 1)

  // Mouse wheel scroll within gallery
  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (Math.abs(e.deltaX) > 15) {
        if (e.deltaX > 0) goNext()
        else goPrev()
      }
    } else {
      // Horizontal swipe on trackpad
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) goNext()
        else goPrev()
      }
    }
  }

  // Pointer drag events for mouse & touch
  const handlePointerDown = (e) => {
    isDraggingRef.current = true
    startXRef.current = e.clientX || e.touches?.[0]?.clientX || 0
    startProgressRef.current = targetIndexRef.current
  }

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return
    const currentX = e.clientX || e.touches?.[0]?.clientX || 0
    const deltaX = currentX - startXRef.current
    const sensitivity = isMobile ? 180 : 260
    const newTarget = clampIndex(startProgressRef.current - deltaX / sensitivity)
    targetIndexRef.current = newTarget
    setCurrentIndex(Math.round(newTarget))
  }

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    const rounded = Math.round(targetIndexRef.current)
    goTo(rounded)
  }

  const handleAddToCart = (e, product) => {
    e.preventDefault()
    e.stopPropagation()
    const size = product.sizes?.[0] || 'Free Size'
    addToCart(product, size, 1)
    setAddedId(product._id)
    setTimeout(() => setAddedId(null), 1800)
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="py-16 text-center bg-white dark:bg-[#141414] rounded-2xl border border-gray-100 dark:border-neutral-800 p-10 max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-2xl">
          ✦
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{emptyTitle}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">{emptySubtitle}</p>
        <Link
          href="/shop"
          className="inline-block px-6 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-bold uppercase tracking-wider transition"
        >
          Browse All Styles
        </Link>
      </div>
    )
  }

  // Prefers Reduced Motion Fallback (simple flat clean grid)
  if (prefersReduced) {
    return (
      <div className="space-y-6">
        {title && (
          <div className="text-center max-w-xl mx-auto">
            {badge && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#cc0000]/10 text-[#cc0000] mb-2">
                {badge}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, idx) => {
            if (type === 'category') {
              return (
                <Link
                  key={item.slug || idx}
                  href={`/shop?category=${item.slug}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-neutral-900 border border-neutral-800"
                >
                  <img src={item.image} alt={item.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end text-white">
                    <p className="text-[10px] font-mono uppercase text-[#cc0000] font-bold">{item.sub}</p>
                    <h3 className="text-xl font-black">{item.label}</h3>
                  </div>
                </Link>
              )
            }
            return (
              <div
                key={item._id || idx}
                className="bg-white dark:bg-[#161616] rounded-xl overflow-hidden border border-gray-100 dark:border-neutral-800 p-3 space-y-2"
              >
                <img src={item.image} alt={item.name} className="w-full aspect-[3/4] object-cover rounded-lg" />
                <h4 className="font-bold text-xs truncate">{item.name}</h4>
                <p className="font-bold text-xs text-[#cc0000]">{inr(item.price)}</p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Dynamic Sphere calculation constants
  const radius = isMobile ? 420 : 680
  const angleStep = isMobile ? 24 : 20
  const maxVisibleOffset = isMobile ? 3 : 4

  return (
    <div className="relative select-none overflow-hidden py-8 sm:py-12">
      {/* Header if provided */}
      {title && (
        <div className="flex items-end justify-between max-w-7xl mx-auto px-4 sm:px-6 mb-6 sm:mb-10">
          <div>
            {badge && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#cc0000]/10 text-[#cc0000] border border-[#cc0000]/20 mb-2">
                <span>✦</span> {badge}
              </div>
            )}
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {type === 'category' ? (
            <Link
              href="/shop"
              className="text-xs sm:text-sm font-bold text-[#cc0000] hover:underline flex items-center gap-1"
            >
              <span>Explore All</span>
              <span>→</span>
            </Link>
          ) : (
            <div className="text-xs text-neutral-400 font-mono hidden sm:block">
              {currentIndex + 1} / {items.length}
            </div>
          )}
        </div>
      )}

      {/* 3D Sphere Stage */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-[470px] sm:h-[530px] flex items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y"
        style={{
          perspective: isMobile ? '900px' : '1300px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {items.map((item, idx) => {
            const delta = idx - animProgress
            const absDelta = Math.abs(delta)

            // Cull distant cards beyond sphere viewing horizon
            if (absDelta > maxVisibleOffset) return null

            // Spherical trigonometric positioning along curved cylinder
            const angleRad = (delta * angleStep * Math.PI) / 180
            const x = Math.sin(angleRad) * radius
            const z = (Math.cos(angleRad) - 1) * radius - absDelta * 55
            const rotateY = -delta * angleStep
            const scale = Math.max(0.68, 1 - absDelta * 0.12)
            const opacity = Math.max(0.18, 1 - absDelta * 0.28)
            const zIndex = Math.round(100 - absDelta * 10)
            const isCenter = Math.round(animProgress) === idx

            // Product calculations
            const pct = type === 'product' && item.mrp ? discountPct(item.price, item.mrp) : 0
            const isAdded = type === 'product' && addedId === item._id

            return (
              <div
                key={item._id || item.slug || idx}
                onClick={() => {
                  if (!isCenter) goTo(idx)
                }}
                className={`absolute will-change-transform rounded-2xl transition-shadow duration-300 ${
                  isCenter
                    ? 'shadow-2xl ring-1 ring-white/10 dark:ring-neutral-700'
                    : 'shadow-lg hover:brightness-110 cursor-pointer'
                }`}
                style={{
                  width: isMobile ? '250px' : '300px',
                  height: isMobile ? '380px' : '450px',
                  transform: `translate3d(${x}px, 0px, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* ── CARD CONTENT: CATEGORY ── */}
                {type === 'category' ? (
                  <Link
                    href={`/shop?category=${item.slug}`}
                    className="relative w-full h-full block rounded-2xl overflow-hidden bg-neutral-900 group"
                  >
                    <img
                      src={item.image}
                      alt={item.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-white pointer-events-none">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-[#cc0000] font-bold mb-1">
                        {item.sub || 'Collection'}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{item.label}</h3>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="px-4 py-2 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wider shadow-lg">
                          Shop Now →
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  /* ── CARD CONTENT: PRODUCT ── */
                  <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white dark:bg-[#161616] border border-gray-100 dark:border-neutral-800 flex flex-col group">
                    {/* Image Frame */}
                    <Link
                      href={`/product/${item._id}`}
                      className="relative block w-full h-[66%] overflow-hidden bg-neutral-900"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out will-change-transform"
                      />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                        {item.isNewArrival && (
                          <span className="bg-[#cc0000] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
                            ✦ NEW
                          </span>
                        )}
                        {pct > 0 && (
                          <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                            −{pct}%
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Metadata & Actions */}
                    <div className="p-4 flex flex-col justify-between flex-1 bg-white dark:bg-[#161616]">
                      <div>
                        <Link href={`/product/${item._id}`} className="block">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-1 hover:text-[#cc0000] transition-colors">
                            {item.name}
                          </h4>
                        </Link>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                          Size: {item.sizes?.[0] || 'Standard'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-neutral-800/80">
                        <div>
                          <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white font-mono">
                            {inr(item.price)}
                          </span>
                          {item.mrp && item.mrp > item.price && (
                            <span className="text-[11px] text-gray-400 line-through ml-2 font-mono">
                              {inr(item.mrp)}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#cc0000] hover:bg-[#b30000] text-white active:scale-95'
                          }`}
                        >
                          {isAdded ? 'Added ✓' : '+ Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sphere Controls & Pagination Indicators */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#161616] text-gray-700 dark:text-gray-300 hover:border-[#cc0000] hover:text-[#cc0000] transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          title="Previous"
        >
          ←
        </button>

        <div className="flex items-center gap-1.5">
          {items.map((_, dotIdx) => {
            const isActive = dotIdx === currentIndex
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={() => goTo(dotIdx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'w-6 bg-[#cc0000]'
                    : 'w-2 bg-gray-300 dark:bg-neutral-700 hover:bg-gray-400'
                }`}
                title={`Go to item ${dotIdx + 1}`}
              />
            )
          })}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={currentIndex === items.length - 1}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#161616] text-gray-700 dark:text-gray-300 hover:border-[#cc0000] hover:text-[#cc0000] transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          title="Next"
        >
          →
        </button>
      </div>
    </div>
  )
}
