'use client'

import { useState } from 'react'
import Link from 'next/link'
import { inr, discountPct } from '@/lib/format'
import { CATEGORY_LABEL } from '@/lib/categories'
import ProductOffers from './ProductOffers'
import DeliveryEstimator from './DeliveryEstimator'
import ProductSpecifications from './ProductSpecifications'
import ProductReviewsSection from './ProductReviewsSection'
import SizeChartModal from './SizeChartModal'

function StarSolid({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

export default function ProductInfo({
  product,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  sizeError,
  setSizeError,
  initialCoupons = [],
}) {
  const [sizeChartOpen, setSizeChartOpen] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  const pct = discountPct(product.price, product.mrp)
  const catLabel = CATEGORY_LABEL[product.category] || product.category || 'Apparel'
  const outOfStock = product.stock === 0

  const highlights = Array.isArray(product.highlights) && product.highlights.length > 0
    ? product.highlights
    : [
        '100% Genuine Quality Guaranteed',
        'Comfortable & Breathable All-Day Fit',
        'Colorfast Pre-Shrunk Fabric',
        '7-Day Doorstep Exchange Policy',
      ]

  const description = String(product.description || '').trim()
  const isDescLong = description.length > 220
  const displayedDesc = !isDescLong || descExpanded
    ? description
    : `${description.slice(0, 220)}…`

  return (
    <div className="flex flex-col space-y-4">
      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/" className="hover:text-brand transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-brand transition-colors">Shop</Link>
        <span>/</span>
        <Link href={`/shop?category=${product.category}`} className="hover:text-brand transition-colors">
          {catLabel}
        </Link>
        <span>/</span>
        <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[220px]">
          {product.name}
        </span>
      </nav>

      {/* ── Brand Name ── */}
      {product.brand && (
        <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
          {product.brand}
        </span>
      )}

      {/* ── Product Name (ONLY ELEMENT > 16px) ── */}
      <h1 className="text-[20px] sm:text-[24px] lg:text-[26px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
        {product.name}
      </h1>

      {/* ── Compact Rating Badge Chip ── */}
      <div className="flex items-center gap-2.5 pt-0.5">
        <div className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[12px] font-bold px-2 py-0.5 rounded shadow-xs">
          <span>4.2</span>
          <StarSolid size={10} />
        </div>
        <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
          128 Ratings &amp; 32 Reviews
        </span>
        {product.isNewArrival && (
          <>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
              New Arrival
            </span>
          </>
        )}
      </div>

      {/* ── Strict Price Block (16px bold) ── */}
      <div className="pt-1">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          {/* Selling Price - strictly 16px bold */}
          <span className="text-[16px] font-bold text-gray-900 dark:text-white">
            {inr(product.price)}
          </span>

          {/* Struck MRP - 13px */}
          {product.mrp > product.price && (
            <span className="text-[13px] line-through text-gray-400 dark:text-gray-500 font-medium">
              {inr(product.mrp)}
            </span>
          )}

          {/* Discount % - 13px bold */}
          {pct > 0 && (
            <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
              {pct}% OFF
            </span>
          )}
        </div>

        {/* Taxes & Stock Availability */}
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
          <span>Inclusive of all taxes</span>
          <span className="mx-1.5">·</span>
          {outOfStock ? (
            <span className="text-red-600 dark:text-red-400 font-semibold">Out of Stock</span>
          ) : product.stock <= 5 ? (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              Hurry, only {product.stock} left in stock!
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">In Stock</span>
          )}
        </p>
      </div>

      {/* ── Available Offers (Real-time coupons + bank offer) ── */}
      <ProductOffers initialCoupons={initialCoupons} />

      {/* ── Size Selector Block ── */}
      {product.sizes?.length > 0 && (
        <div id="size-selector-block" className="py-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-gray-900 dark:text-white">
                Select Size:
              </span>
              {selectedSize && (
                <span className="text-[14px] font-bold text-brand">
                  {selectedSize}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSizeChartOpen(true)}
              className="text-[13px] font-semibold text-brand hover:underline flex items-center gap-1"
            >
              <span>Size Chart</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          </div>

          {/* Size Pill Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {product.sizes.map((s) => {
              const isSelected = selectedSize === s
              const isOutOfStock = outOfStock

              return (
                <button
                  key={s}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => {
                    setSelectedSize(s)
                    if (sizeError) setSizeError(false)
                  }}
                  className={`min-w-[48px] h-10 px-3.5 text-[14px] font-bold rounded-sm border transition-all duration-150 flex items-center justify-center ${
                    isSelected
                      ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                      : isOutOfStock
                      ? 'pdp-slash border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-[#1a1a1a] cursor-not-allowed'
                      : 'border-gray-300 dark:border-[#333] text-gray-800 dark:text-gray-200 hover:border-gray-900 dark:hover:border-white bg-white dark:bg-[#161616]'
                  }`}
                  aria-label={`Select size ${s}`}
                >
                  {s}
                </button>
              )
            })}
          </div>

          {/* Inline Validation Alert if user clicked Add to Cart without picking size */}
          {sizeError && (
            <div className="flex items-center gap-1.5 p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-[13px] font-medium rounded-sm animate-shake">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Please select a size to add this item to your bag.</span>
            </div>
          )}
        </div>
      )}

      {/* ── Color Swatches (if product has colors) ── */}
      {product.colors?.length > 0 && (
        <div className="py-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-gray-900 dark:text-white">
              Color:
            </span>
            <span className="text-[14px] font-medium text-gray-600 dark:text-gray-300">
              {selectedColor || product.colors[0]}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => {
              const active = (selectedColor || product.colors[0]) === color
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`px-3 py-1.5 text-[13px] font-semibold rounded-sm border transition-all ${
                    active
                      ? 'border-brand text-brand bg-brand/5 ring-1 ring-brand/30'
                      : 'border-gray-300 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:border-gray-500 bg-white dark:bg-[#161616]'
                  }`}
                >
                  {color}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Delivery Pincode Checker ── */}
      <DeliveryEstimator />

      {/* ── Highlights Bullet List ── */}
      <div className="py-3 border-b border-gray-100 dark:border-[#222] space-y-2.5">
        <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">
          Product Highlights
        </h3>
        <ul className="space-y-2">
          {highlights.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[14px] text-gray-700 dark:text-gray-300">
              <CheckCircleIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Collapsible Description ── */}
      {description && (
        <div className="py-3 border-b border-gray-100 dark:border-[#222] space-y-2">
          <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">
            Product Description
          </h3>
          <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap max-w-[70ch]">
            {displayedDesc}
          </p>
          {isDescLong && (
            <button
              type="button"
              onClick={() => setDescExpanded((prev) => !prev)}
              className="text-[13px] font-semibold text-brand hover:underline inline-block mt-1"
            >
              {descExpanded ? 'Read Less' : 'Read More'}
            </button>
          )}
        </div>
      )}

      {/* ── Grouped Specifications Accordion ── */}
      <ProductSpecifications specifications={product.specifications} />

      {/* ── Ratings & Customer Reviews Breakdown ── */}
      <ProductReviewsSection productId={product._id} />

      {/* ── Size Chart Modal ── */}
      <SizeChartModal
        isOpen={sizeChartOpen}
        onClose={() => setSizeChartOpen(false)}
        category={product.category}
      />
    </div>
  )
}
