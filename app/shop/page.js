import { getProducts } from '@/lib/data'
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/categories'
import ProductCard from '@/components/ProductCard'
import SortDropdown from '@/components/SortDropdown'
import { HostAddButton } from '@/components/HostProductActions'
import Link from 'next/link'

/* ── Filter chip component ────────────────────── */
function FilterChip({ href, active, children }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-sm border transition-all duration-150 whitespace-nowrap ${
        active
          ? 'bg-[#111] dark:bg-white text-white dark:text-[#111] border-[#111] dark:border-white'
          : 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#333] hover:border-gray-400 dark:hover:border-gray-500'
      }`}
    >
      {children}
    </Link>
  )
}

export default async function ShopPage({ searchParams }) {
  const { category, q, size, sort, onSale } = await searchParams

  const products = await getProducts({
    category,
    q,
    size: size === 'all' ? undefined : size,
    sort,
    onSale: onSale === '1' || onSale === 'true',
  })

  const activeCategory = CATEGORIES.find((c) => c.slug === category)?.label || null
  const title = onSale
    ? 'Sale'
    : activeCategory
    ? activeCategory
    : q
    ? `Search: "${q}"`
    : 'All Products'

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    ...(activeCategory ? [{ label: activeCategory, href: `/shop?category=${category}` }] : []),
    ...(onSale ? [{ label: 'Sale', href: '/shop?onSale=1' }] : []),
    ...(q ? [{ label: `"${q}"`, href: `/shop?q=${encodeURIComponent(q)}` }] : []),
  ]

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0f0f]">

      {/* ── Breadcrumb ───────────────────── */}
      <div className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            {breadcrumbs.map((b, i) => (
              <span key={b.href} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={b.href} className="hover:text-brand transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-gray-700 dark:text-gray-200 font-medium">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── SIDEBAR FILTERS ──────────────── */}
          <aside className="lg:w-60 shrink-0">
            <div className="lg:sticky lg:top-[130px] space-y-4">

              {/* Category filter */}
              <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-[#222]">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 dark:text-gray-200">
                    Category
                  </h3>
                </div>
                <div className="p-3 space-y-0.5">
                  <Link
                    href={onSale ? '/shop?onSale=1' : '/shop'}
                    className={`block px-3 py-2 text-sm rounded-sm transition-colors ${
                      !category ? 'bg-[#111] dark:bg-white text-white dark:text-[#111] font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    All Categories
                  </Link>
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/shop?category=${c.slug}${onSale ? '&onSale=1' : ''}`}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-sm transition-colors ${
                        category === c.slug
                          ? 'bg-[#111] dark:bg-white text-white dark:text-[#111] font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                      }`}
                    >
                      <span>{c.emoji}</span>
                      <span>{c.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sale filter */}
              <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-[#222]">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 dark:text-gray-200">
                    Offers
                  </h3>
                </div>
                <div className="p-3">
                  <Link
                    href={`/shop?${category ? `category=${category}&` : ''}onSale=1`}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-sm transition-colors ${
                      onSale
                        ? 'bg-brand/10 text-brand font-semibold border border-brand/30'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    On Sale Only
                  </Link>
                </div>
              </div>

            </div>
          </aside>

          {/* ── PRODUCT GRID ─────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{title}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {products.length} product{products.length !== 1 ? 's' : ''}
                  {CATEGORY_LABEL[category] ? ` in ${CATEGORY_LABEL[category]}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <HostAddButton category={category} />
                <SortDropdown />
              </div>
            </div>

            {/* Active filters strip */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <FilterChip href="/shop" active={!category && !onSale && !q}>All</FilterChip>
              {CATEGORIES.map((c) => (
                <FilterChip
                  key={c.slug}
                  href={`/shop?category=${c.slug}${onSale ? '&onSale=1' : ''}`}
                  active={category === c.slug}
                >
                  {c.label}
                </FilterChip>
              ))}
              <FilterChip href={`/shop${category ? `?category=${category}&` : '?'}onSale=1`} active={!!onSale}>
                Sale
              </FilterChip>
            </div>

            {/* Grid or empty */}
            {products.length === 0 ? (
              <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm p-16 text-center">
                <div className="flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                </div>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-1">No products found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Try a different category or search term.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-[#111] dark:bg-white text-white dark:text-[#111] font-bold px-6 py-2.5 text-sm tracking-wider uppercase hover:opacity-80 transition-opacity"
                >
                  View All Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}