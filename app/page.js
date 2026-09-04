import Link from 'next/link'
import { getSettings, getProducts } from '@/lib/data'
import { CATEGORIES } from '@/lib/categories'
import ProductCard from '@/components/ProductCard'
import ProductImage from '@/components/ProductImage'
import { HostAddButton } from '@/components/HostProductActions'
import { imgUrl } from '@/lib/img-url'
import { inr, discountPct } from '@/lib/format'

/* ── Category images (direct Pexels links — no proxy needed) ── */
const CAT_IMAGE = {
  boys:     {
    img: 'https://images.pexels.com/photos/15459807/pexels-photo-15459807.jpeg?auto=compress&cs=tinysrgb&w=480',
    label: 'BOYS',
    sub: 'Trendy Fits',
  },
  girls:    {
    img: 'https://images.pexels.com/photos/19214177/pexels-photo-19214177.jpeg?auto=compress&cs=tinysrgb&w=480',
    label: 'GIRLS',
    sub: 'New Collection',
  },
  children: {
    img: 'https://images.pexels.com/photos/33776741/pexels-photo-33776741.jpeg?auto=compress&cs=tinysrgb&w=480',
    label: 'CHILDREN',
    sub: 'Fun & Colorful',
  },
  men:      {
    img: 'https://images.pexels.com/photos/35312945/pexels-photo-35312945.jpeg?auto=compress&cs=tinysrgb&w=480',
    label: 'MEN',
    sub: 'Classic Styles',
  },
  women:    {
    img: 'https://images.pexels.com/photos/9767828/pexels-photo-9767828.jpeg?auto=compress&cs=tinysrgb&w=480',
    label: 'WOMEN',
    sub: 'Latest Trends',
  },
}


export default async function Home() {
  const settings = await getSettings()
  const featured = await getProducts({ featured: true, limit: 8 })
  const sale = (await getProducts({ onSale: true, limit: 8 })).filter(
    (p) => discountPct(p.price, p.mrp) >= 15
  )

  return (
    <div className="bg-[#f8f8f8] dark:bg-[#0f0f0f]">

      {/* ══════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#111] dark:bg-black">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 grid md:grid-cols-2 gap-8 items-center min-h-[340px]">
          {/* Text side */}
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 bg-brand/20 border border-brand/40 text-brand px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-5">
              ✦ New Season Arrivals
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              {settings.tagline || (
                <>
                  Fashion for<br />
                  <span className="text-brand">Everyone</span>
                </>
              )}
            </h1>
            <p className="mt-4 text-gray-400 max-w-md text-base leading-relaxed">
              Shop the latest styles for Boys, Girls, Children, Men & Women.
              Easy UPI payment · Fast delivery · 7-day returns.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3.5 text-sm tracking-wider uppercase transition-all duration-200 shadow-lg hover:shadow-brand/30 hover:-translate-y-0.5"
              >
                Shop Now
              </Link>
              <Link
                href="/shop?onSale=1"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3.5 text-sm tracking-wider uppercase border border-white/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                View Sale
              </Link>
            </div>
          </div>

          {/* Right side — hero image or product preview */}
          {settings.heroImageUrl ? (
            <div className="hidden md:block overflow-hidden rounded-sm shadow-2xl max-h-80 fade-up anim-delay-1">
              <img
                src={imgUrl(settings.heroImageUrl)}
                alt="Store banner"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="hidden md:grid grid-cols-2 gap-3 fade-up anim-delay-1">
              {featured.slice(0, 4).map((p) => (
                <Link
                  key={p._id}
                  href={`/product/${p._id}`}
                  className="group relative overflow-hidden rounded-sm bg-white/5 border border-white/10 hover:border-brand/50 transition-all duration-200"
                >
                  {p.image ? (
                    <div className="aspect-[3/4] overflow-hidden">
                      <ProductImage
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/4] bg-white/5 flex items-center justify-center text-gray-600 text-xs">No image</div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-gray-400 truncate">{p.name.slice(0, 28)}</p>
                    <p className="text-sm font-bold text-white">{inr(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Bottom wave separator */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#f8f8f8] dark:bg-[#0f0f0f]"
          style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}
        />
      </section>

      {/* ══════════════════════════════════════════════
          TRUST BADGES
      ══════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-[#222]">
            {[
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
                title: 'Easy UPI Payment', text: 'Pay via any UPI app. Enter transaction ID — done!'
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
                title: 'Fast Delivery', text: 'We dispatch within 24 hours of payment confirmation.'
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
                title: 'Easy Returns', text: `Exchange within 7 days. Call us at ${settings.phone || 'our number'}.`
              },
            ].map((f) => (
              <div key={f.title} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-8 py-5">
                <span className="shrink-0 text-gray-400 dark:text-gray-500">{f.icon}</span>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{f.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SHOP BY CATEGORY
      ══════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand mb-1">Browse</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Shop by Category</h2>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-brand hover:underline">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORIES.map((c) => {
            const cat = CAT_IMAGE[c.slug] || { img: '', label: c.label.toUpperCase(), sub: 'Shop Now' }
            return (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                className="group relative overflow-hidden rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ aspectRatio: '3/4' }}
              >
                {/* Fashion image */}
                <div className="absolute inset-0 bg-gray-200 dark:bg-[#222]">
                  {cat.img && (
                    <img
                      src={cat.img}
                      alt={cat.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  )}
                </div>
                {/* Gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                  <p className="font-black text-white text-sm tracking-wider drop-shadow-sm">{cat.label}</p>
                  <p className="text-[10px] text-white/75 mt-0.5 drop-shadow-sm">{cat.sub}</p>
                  <div className="mt-2 inline-block bg-white text-[10px] font-bold text-gray-900 px-3 py-1 tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm">
                    SHOP NOW
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

      </section>

      {/* ══════════════════════════════════════════════
          NEW ARRIVALS
      ══════════════════════════════════════════════ */}
      {featured.length > 0 ? (
        <section className="py-10 bg-white dark:bg-[#111]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand mb-1">Just In</p>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">New Arrivals</h2>
              </div>
              <div className="flex items-center gap-3">
                <HostAddButton />
                <Link href="/shop" className="text-sm font-semibold text-brand hover:underline">
                  View All →
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {featured.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ══════════════════════════════════════════════
          PROMOTIONAL BANNER — SALE
      ══════════════════════════════════════════════ */}
      <section className="my-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Link
            href="/shop?onSale=1"
            className="block relative overflow-hidden rounded-sm group"
            style={{ background: 'linear-gradient(135deg, #cc0000 0%, #800000 50%, #4a0000 100%)' }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="relative px-8 py-10 sm:py-14 text-center">
              <p className="text-white/80 text-xs font-bold tracking-[0.3em] uppercase mb-2">Limited Time Offer</p>
              <h3 className="text-3xl sm:text-5xl font-black text-white mb-2">
                UP TO <span className="text-amber-300">50% OFF</span>
              </h3>
              <p className="text-white/70 mb-6 text-sm">On selected styles. Grab them before they&apos;re gone!</p>
              <div className="inline-flex items-center gap-2 bg-white text-gray-900 font-black px-8 py-3 text-sm tracking-wider uppercase group-hover:-translate-y-0.5 transition-transform duration-200 shadow-lg">
                SHOP THE SALE
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          ON SALE PRODUCTS
      ══════════════════════════════════════════════ */}
      {sale.length > 0 ? (
        <section className="py-10 bg-[#f8f8f8] dark:bg-[#0f0f0f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand mb-1">Best Deals</p>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                  On Sale
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <HostAddButton />
                <Link href="/shop?onSale=1" className="text-sm font-semibold text-brand hover:underline">
                  View All →
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {sale.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

    </div>
  )
}