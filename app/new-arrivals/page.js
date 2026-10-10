import Link from 'next/link'
import { getProducts } from '@/lib/data'
import AnimatedProductGrid from '@/components/AnimatedProductGrid'
import SortDropdown from '@/components/SortDropdown'
import { HostAddButton } from '@/components/HostProductActions'

export const metadata = {
  title: 'New Arrivals — MJ Fashion World',
  description: 'Explore the latest trending arrivals, seasonal streetwear, and fresh fashion drops.',
}

export default async function NewArrivalsPage({ searchParams }) {
  const { sort } = await searchParams

  const products = await getProducts({
    newArrivals: true,
    sort,
  })

  // If no products flagged as new arrival yet, show recent / featured products
  const fallback = products.length === 0 ? await getProducts({ featured: true, sort }) : []
  const displayProducts = products.length > 0 ? products : fallback

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0f0f]">
      {/* ── Breadcrumb ───────────────────── */}
      <div className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-mono">
            <Link href="/" className="hover:text-[#cc0000] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-[#cc0000] transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-gray-800 dark:text-gray-200 font-semibold">New Arrivals</span>
          </nav>
        </div>
      </div>

      {/* ── Hero Banner ──────────────────── */}
      <div className="bg-[#111] dark:bg-black text-white border-b border-neutral-800 py-10 sm:py-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#cc0000]/20 text-[#cc0000] border border-[#cc0000]/30 mb-3">
            <span>✦</span> Just Landed
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
            New Season Arrivals
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg leading-relaxed">
            Discover the latest weekly drops, oversized hoodies, graphic tees, and seasonal outerwear handpicked for modern street fashion.
          </p>
        </div>
      </div>

      {/* ── Content & Grid ───────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing <span className="font-bold text-gray-900 dark:text-white">{displayProducts.length}</span> fresh styles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HostAddButton />
            <SortDropdown />
          </div>
        </div>

        <AnimatedProductGrid
          products={displayProducts}
          emptyTitle="No New Arrivals Found"
          emptySubtitle="Check back soon! New streetwear drops are released every week."
        />
      </div>
    </div>
  )
}
