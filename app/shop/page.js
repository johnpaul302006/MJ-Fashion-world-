import { getProducts } from '@/lib/data'
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/categories'
import SortDropdown from '@/components/SortDropdown'
import { HostAddButton } from '@/components/HostProductActions'
import ShopContent from '@/components/ShopContent'
import Link from 'next/link'

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
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Explore our premium streetwear, oversized essentials, and signature silhouettes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HostAddButton category={category} />
            <SortDropdown />
          </div>
        </div>

        {/* Interactive Shop Content with Live Smart Search & Animated GSAP Flip Grid */}
        <ShopContent
          initialProducts={products}
          activeCategory={category}
          initialQuery={q || ''}
          onSale={onSale === '1' || onSale === 'true'}
        />
      </div>
    </div>
  )
}