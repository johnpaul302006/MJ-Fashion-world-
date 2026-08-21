import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/data'
import { CATEGORY_LABEL } from '@/lib/categories'
import ProductBuyBox from '@/components/ProductBuyBox'
import ProductImage from '@/components/ProductImage'
import { inr, discountPct } from '@/lib/format'

export default async function ProductPage({ params }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const pct = discountPct(product.price, product.mrp)
  const catLabel = CATEGORY_LABEL[product.category] || product.category

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0f0f]">

      {/* ── Breadcrumb ───────────────────── */}
      <div className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-brand transition-colors">Shop</Link>
            <span>/</span>
            <Link href={`/shop?category=${product.category}`} className="hover:text-brand transition-colors">
              {catLabel}
            </Link>
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ── Main Product Layout ──────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-10">

          {/* LEFT — Image */}
          <div className="space-y-3">
            <div className="relative bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222] overflow-hidden rounded-sm"
              style={{ aspectRatio: '3/4' }}>
              {product.image ? (
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm">
                  No image available
                </div>
              )}
              {pct > 0 && (
                <div className="absolute top-4 left-4 bg-brand text-white text-xs font-black px-3 py-1 tracking-wider">
                  {pct}% OFF
                </div>
              )}
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-500 tracking-widest uppercase border border-gray-400 px-4 py-2">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Info + Buy Box */}
          <div className="flex flex-col">

            {/* Category pill */}
            <Link
              href={`/shop?category=${product.category}`}
              className="inline-flex w-fit text-[10px] font-black uppercase tracking-[0.15em] text-brand border border-brand/30 bg-brand/5 px-3 py-1 mb-3 hover:bg-brand/10 transition-colors"
            >
              {catLabel}
            </Link>

            {/* Name */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-3">
              {product.name}
            </h1>

            {/* Price block */}
            <div className="flex items-baseline gap-3 flex-wrap mb-1">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {inr(product.price)}
              </span>
              {product.mrp > product.price ? (
                <>
                  <span className="text-lg text-gray-400 line-through font-medium">{inr(product.mrp)}</span>
                  <span className="text-sm font-black text-green-600 bg-green-50 dark:bg-green-950 px-2 py-0.5">
                    {pct}% OFF
                  </span>
                </>
              ) : null}
            </div>
            <p className="text-xs text-gray-400 mb-4">
              MRP inclusive of all taxes &nbsp;·&nbsp;{' '}
              {product.stock > 0 ? (
                product.stock <= 5
                  ? <span className="text-amber-600 font-semibold">Only {product.stock} left!</span>
                  : <span className="text-green-600 font-semibold">In Stock</span>
              ) : (
                <span className="text-red-500 font-semibold">Out of Stock</span>
              )}
            </p>

            <div className="h-px bg-gray-100 dark:bg-[#222] mb-4" />

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Color
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((col) => (
                    <span
                      key={col}
                      className="text-sm px-3 py-1 border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 font-medium"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Buy box (size + qty + CTA) */}
            <ProductBuyBox product={product} />

            <div className="h-px bg-gray-100 dark:bg-[#222] my-5" />

            {/* Delivery info */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="shrink-0 text-gray-400 dark:text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </span>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Fast Dispatch</span>
                  <span className="text-gray-400"> — within 24 hours of payment</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="shrink-0 text-gray-400 dark:text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                </span>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Easy Returns</span>
                  <span className="text-gray-400"> — 7-day exchange policy</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="shrink-0 text-gray-400 dark:text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                </span>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">UPI Payment</span>
                  <span className="text-gray-400"> — scan QR, enter UTR, done</span>
                </div>
              </div>
            </div>

            {/* UPI instructions callout */}
            <div className="mt-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <p className="font-bold mb-1 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                How to pay via UPI
              </p>
              Add to Bag → Checkout → Pay to our QR via any UPI app → Enter the 12-digit{' '}
              <b>Transaction ID (UTR)</b> → We verify and dispatch within 24 hours.
            </div>
          </div>
        </div>

        {/* ── Product Description ─────────── */}
        {product.description && (
          <div className="mt-10 bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm p-6">
            <h2 className="text-base font-black uppercase tracking-widest text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-100 dark:border-[#222]">
              Product Details
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* ── Quick links ─────────────────── */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/shop?category=${product.category}`}
            className="text-sm text-brand hover:underline font-semibold"
          >
            ← More {catLabel}
          </Link>
          <Link
            href="/shop"
            className="text-sm text-gray-500 hover:text-brand hover:underline font-semibold"
          >
            View all products
          </Link>
        </div>
      </div>
    </div>
  )
}