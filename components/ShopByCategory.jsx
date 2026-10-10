'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const DEFAULT_CATEGORIES = [
  {
    slug: 'boys',
    label: 'Boys',
    sub: 'Trendy Fits',
    image: 'https://images.pexels.com/photos/15459807/pexels-photo-15459807.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'girls',
    label: 'Girls',
    sub: 'New Collection',
    image: 'https://images.pexels.com/photos/19214177/pexels-photo-19214177.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'children',
    label: 'Children',
    sub: 'Fun & Colorful',
    image: 'https://images.pexels.com/photos/33776741/pexels-photo-33776741.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'men',
    label: 'Men',
    sub: 'Classic Styles',
    image: 'https://images.pexels.com/photos/35312945/pexels-photo-35312945.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    slug: 'women',
    label: 'Women',
    sub: 'Latest Trends',
    image: 'https://images.pexels.com/photos/9767828/pexels-photo-9767828.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
]

export default function ShopByCategory({ initialCategories = [] }) {
  const [categories, setCategories] = useState(
    initialCategories.length > 0 ? initialCategories : DEFAULT_CATEGORIES
  )
  const [activeHover, setActiveHover] = useState(null)
  const sectionRef = useRef(null)
  const panelsRef = useRef(null)

  // Fetch dynamic categories from DB so new categories appear automatically
  useEffect(() => {
    let mounted = true
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (mounted && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories)
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  // GSAP ScrollTrigger staggered clip-path reveal wipe on scroll
  useEffect(() => {
    if (!panelsRef.current) return
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const panels = panelsRef.current.querySelectorAll('.category-panel')
      if (panels.length > 0) {
        gsap.fromTo(
          panels,
          {
            clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
            opacity: 0.5,
          },
          {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: panelsRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [categories])

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#cc0000]/10 text-[#cc0000] border border-[#cc0000]/20 mb-2">
            <span>✨</span> Curated Collections
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Shop by Category
          </h2>
        </div>
        <Link
          href="/shop"
          className="text-xs sm:text-sm font-bold text-[#cc0000] hover:underline flex items-center gap-1"
        >
          <span>Explore All Collections</span>
          <span>→</span>
        </Link>
      </div>

      {/* ── Desktop: Accordion Expanding Panels (flex-grow ~0.7s expo.out) ── */}
      <div
        ref={panelsRef}
        className="hidden md:flex h-[490px] w-full gap-3 overflow-hidden select-none"
      >
        {categories.map((cat, idx) => {
          const isHovered = activeHover === idx
          return (
            <Link
              key={cat.slug || idx}
              href={`/shop?category=${cat.slug}`}
              onMouseEnter={() => setActiveHover(idx)}
              onMouseLeave={() => setActiveHover(null)}
              onFocus={() => setActiveHover(idx)}
              onBlur={() => setActiveHover(null)}
              className={`category-panel group relative rounded-2xl overflow-hidden cursor-pointer transition-[flex] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none focus-visible:ring-4 focus-visible:ring-[#cc0000]/50 shadow-lg ${
                isHovered ? 'flex-[2.6]' : 'flex-1'
              }`}
            >
              {/* Image with subtle hover zoom and parallax */}
              <div className="absolute inset-0 bg-neutral-900 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.label}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out will-change-transform ${
                    isHovered ? 'scale-110' : 'scale-100 group-hover:scale-105'
                  }`}
                />
                {/* Gradient overlays for contrast */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 ${
                    isHovered ? 'opacity-80' : 'opacity-65'
                  }`}
                />
              </div>

              {/* Masked text reveal & category metadata */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10 pointer-events-none">
                <div className="overflow-hidden mb-1">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#cc0000] font-bold">
                    {cat.sub || 'Collection'}
                  </p>
                </div>

                {/* Masked Line Reveal for Category Title */}
                <div className="overflow-hidden">
                  <h3
                    className={`font-black tracking-tight leading-none transition-transform duration-500 ease-out ${
                      isHovered ? 'text-3xl lg:text-4xl translate-y-0' : 'text-2xl lg:text-3xl'
                    }`}
                  >
                    {cat.label}
                  </h3>
                </div>

                {/* Animated "Shop Now" chip */}
                <div
                  className={`mt-4 transition-all duration-300 ease-out flex items-center ${
                    isHovered
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-3 pointer-events-none'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-extrabold uppercase tracking-wider shadow-xl">
                    <span>Shop Now</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Mobile & Tablet: Horizontal Scroll-Snap Carousel ── */}
      <div className="md:hidden flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory py-2 -mx-4 px-4">
        {categories.map((cat, idx) => (
          <Link
            key={cat.slug || idx}
            href={`/shop?category=${cat.slug}`}
            className="snap-center shrink-0 w-[72vw] max-w-[280px] aspect-[3/4] relative rounded-2xl overflow-hidden shadow-xl active:scale-[0.97] transition-transform"
          >
            <div className="absolute inset-0 bg-neutral-900">
              <img
                src={cat.image}
                alt={cat.label}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#cc0000] font-bold mb-1">
                {cat.sub || 'Collection'}
              </p>
              <h3 className="text-2xl font-black">{cat.label}</h3>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/90">
                <span>Shop Collection</span>
                <span>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
