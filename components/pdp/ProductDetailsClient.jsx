'use client'

import { useState, useCallback } from 'react'
import ProductGallery from './ProductGallery'
import ProductInfo from './ProductInfo'
import MobileStickyBar from './MobileStickyBar'
import SimilarProducts from './SimilarProducts'

export default function ProductDetailsClient({
  product,
  similarProducts = [],
  initialCoupons = [],
}) {
  const [selectedSize, setSelectedSize] = useState(
    product.sizes?.length === 1 ? product.sizes[0] : ''
  )
  const [selectedColor, setSelectedColor] = useState(
    product.colors?.[0] || ''
  )
  const [sizeError, setSizeError] = useState(false)

  const handleRequireSize = useCallback(() => {
    setSizeError(true)
    const el = document.getElementById('size-selector-block')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const discountPercent = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0

  return (
    <div className="w-full pb-20 md:pb-12">
      {/* ── Flipkart 2-Column Responsive Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column (5 of 12 cols on desktop) - Sticky Gallery & Primary Dual Actions */}
        <div className="md:col-span-5 lg:col-span-5">
          <ProductGallery
            product={product}
            selectedSize={selectedSize}
            quantity={1}
            onRequireSize={handleRequireSize}
            discountPercent={discountPercent}
          />
        </div>

        {/* Right Column (7 of 12 cols on desktop) - Scrollable Information Hierarchy */}
        <div className="md:col-span-7 lg:col-span-7">
          <ProductInfo
            product={product}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            sizeError={sizeError}
            setSizeError={setSizeError}
            initialCoupons={initialCoupons}
          />
        </div>
      </div>

      {/* ── Similar Products Carousel ── */}
      <SimilarProducts products={similarProducts} />

      {/* ── Mobile Sticky Bottom Action Bar ── */}
      <MobileStickyBar
        product={product}
        selectedSize={selectedSize}
        quantity={1}
        onRequireSize={handleRequireSize}
      />
    </div>
  )
}
