'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/lib/cart-client'
import { isInWishlist, toggleWishlist as toggleWishlistAction } from '@/lib/wishlist-client'
import { imgUrl } from '@/lib/img-url'
import { fallbackImg } from '@/lib/img-fallback'

function BagIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#cc0000' : 'none'} stroke={filled ? '#cc0000' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

function ZoomInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

export default function ProductGallery({
  product,
  selectedSize,
  quantity = 1,
  onRequireSize,
  discountPercent = 0,
}) {
  const router = useRouter()
  const rawImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.image ? [product.image] : [])
  const images = rawImages.length > 0 ? rawImages : ['/placeholder.jpg']

  const [activeIndex, setActiveIndex] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

  const imageContainerRef = useRef(null)

  // Wishlist state sync
  useEffect(() => {
    const t = setTimeout(() => setWishlisted(isInWishlist(product._id)), 0)
    const update = () => setWishlisted(isInWishlist(product._id))
    window.addEventListener('wishlist-updated', update)
    return () => {
      clearTimeout(t)
      window.removeEventListener('wishlist-updated', update)
    }
  }, [product._id])

  // Mouse hover zoom calculation
  const handleMouseMove = useCallback((e) => {
    if (!imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    })
  }, [])

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return
    function onKeyDown(e) {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowRight') setActiveIndex((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setActiveIndex((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen, images.length])

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

  function handleToggleWishlist() {
    const next = toggleWishlistAction(product)
    setWishlisted(next)
  }

  const activeSrc = imgUrl(images[activeIndex] || images[0])

  return (
    <div className="w-full">
      {/* ── Sticky Container on Desktop ── */}
      <div className="md:sticky md:top-24 space-y-4">
        <div className="flex flex-col-reverse md:flex-row gap-3">

          {/* ── Vertical Thumbnail Strip (Desktop) / Horizontal (Mobile) ── */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar py-1 md:py-0 md:w-16 shrink-0 max-h-[480px]">
              {images.map((img, idx) => {
                const isSelected = idx === activeIndex
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`relative w-14 h-18 md:w-16 md:h-20 shrink-0 border-2 rounded-sm overflow-hidden bg-white dark:bg-[#1a1a1a] transition-all duration-150 ${
                      isSelected
                        ? 'border-brand shadow-sm ring-1 ring-brand/30'
                        : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-400 opacity-75 hover:opacity-100'
                    }`}
                    aria-label={`View product image ${idx + 1}`}
                  >
                    <img
                      src={imgUrl(img)}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      onError={fallbackImg}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Main Hero Image Viewport ── */}
          <div className="relative flex-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-sm overflow-hidden select-none">
            <div
              ref={imageContainerRef}
              className="relative w-full aspect-[3/4] cursor-crosshair overflow-hidden flex items-center justify-center"
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setLightboxOpen(true)}
              title="Click to view full screen"
            >
              {/* Base Image */}
              <img
                src={activeSrc}
                alt={product.name}
                onError={fallbackImg}
                className={`w-full h-full object-cover object-center transition-opacity duration-200 ${
                  isZooming ? 'opacity-0 md:opacity-0' : 'opacity-100'
                }`}
                loading="eager"
              />

              {/* Magnified Hover View (Desktop 2.2x Lens Zoom) */}
              {isZooming && (
                <div
                  className="hidden md:block absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url("${activeSrc}")`,
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundSize: '220%',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              )}

              {/* Mobile Image Fallback if Zoom is active */}
              {isZooming && (
                <img
                  src={activeSrc}
                  alt={product.name}
                  onError={fallbackImg}
                  className="md:hidden w-full h-full object-cover object-center"
                />
              )}

              {/* Floating Wishlist Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleWishlist()
                }}
                className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border ${
                  wishlisted
                    ? 'bg-red-50 dark:bg-red-950/60 border-brand text-brand scale-105'
                    : 'bg-white/90 dark:bg-[#111]/90 border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-300 hover:text-brand hover:scale-105'
                }`}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <HeartIcon filled={wishlisted} />
              </button>

              {/* Discount Chip */}
              {discountPercent > 0 && (
                <div className="absolute top-3 left-3 bg-brand text-white text-[12px] font-black px-2.5 py-1 tracking-wider uppercase shadow-sm">
                  {discountPercent}% OFF
                </div>
              )}

              {/* Out of Stock Overlay */}
              {outOfStock && (
                <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <span className="text-[14px] font-bold text-gray-800 dark:text-gray-200 tracking-wider uppercase border-2 border-gray-500 px-4 py-2 bg-white/90 dark:bg-[#111]/90">
                    Out of Stock
                  </span>
                </div>
              )}

              {/* Hover Zoom Helper Hint */}
              <div className="hidden md:flex absolute bottom-3 right-3 items-center gap-1.5 bg-black/60 text-white text-[11px] font-medium px-2 py-1 rounded backdrop-blur-sm pointer-events-none opacity-75">
                <ZoomInIcon />
                <span>Hover to zoom · Click to expand</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Flipkart-Signature Dual CTA Row (Directly below Image) ── */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Add to Bag */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`w-full h-12 flex items-center justify-center gap-2 px-3 text-[14px] font-bold tracking-wider uppercase transition-all duration-150 rounded-sm border ${
              added
                ? 'bg-emerald-600 text-white border-emerald-600'
                : outOfStock
                ? 'bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#222] border-gray-900 dark:border-gray-200 text-gray-900 dark:text-white shadow-sm'
            }`}
          >
            <BagIcon />
            <span>{added ? 'Added to Bag' : outOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
          </button>

          {/* Buy Now */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={outOfStock}
            className={`w-full h-12 flex items-center justify-center gap-2 px-3 text-[14px] font-bold tracking-wider uppercase text-white transition-all duration-150 rounded-sm shadow-md hover:shadow-lg ${
              outOfStock
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-brand hover:bg-brand-dark active:scale-[0.99]'
            }`}
          >
            <BoltIcon />
            <span>{outOfStock ? 'Out of Stock' : 'Buy Now'}</span>
          </button>
        </div>
      </div>

      {/* ── Fullscreen Lightbox Modal ── */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Control Bar */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white mb-3 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[14px] font-semibold text-gray-300">
              {activeIndex + 1} of {images.length} · {product.name}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors text-[14px] font-bold flex items-center gap-1.5"
              aria-label="Close fullscreen view"
            >
              <span>Close</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Central Main View with Previous / Next Buttons */}
          <div
            className="relative max-w-4xl max-h-[80vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveIndex((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                aria-label="Previous image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            <img
              src={activeSrc}
              alt={product.name}
              onError={fallbackImg}
              className="max-h-[78vh] max-w-full object-contain rounded-sm shadow-2xl"
            />

            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveIndex((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                aria-label="Next image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {images.length > 1 && (
            <div
              className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar max-w-xl py-1 px-2"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`w-12 h-14 shrink-0 rounded-sm overflow-hidden border-2 transition-all ${
                    idx === activeIndex ? 'border-brand scale-105 ring-2 ring-brand/40' : 'border-gray-600 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl(img)} alt="" onError={fallbackImg} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
