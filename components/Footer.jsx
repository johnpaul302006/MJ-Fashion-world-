import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'

function LocationIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5a19.79 19.79 0 01-3-8.59A2 2 0 012.18 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 8.1a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15v1.92z"/>
    </svg>
  )
}

export default function Footer({ storeName, address, phone }) {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#111] dark:bg-black text-gray-400 mt-16 border-t border-[#222]">

      {/* ── Main footer grid ─────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">

        {/* Brand / About */}
        <div className="col-span-2 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand flex items-center justify-center shrink-0">
              <span className="text-white font-black text-sm leading-none">MJ</span>
            </div>
            <span className="font-black text-white text-base tracking-tight">
              {storeName || 'MJ FASHION'}
            </span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-3 max-w-xs">
            Your one-stop fashion destination for Boys, Girls, Children, Men &amp; Women.
          </p>
          {address && (
            <p className="text-gray-600 text-xs mb-1 flex items-center gap-1.5"><LocationIcon />{address}</p>
          )}
          {phone && (
            <p className="text-gray-600 text-xs flex items-center gap-1.5"><PhoneIcon />{phone}</p>
          )}
          <div className="mt-4 flex gap-2">
            <span className="bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold px-2 py-1 tracking-wider">UPI PAYMENT</span>
            <span className="bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold px-2 py-1 tracking-wider">SECURE</span>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h3 className="text-white font-black text-xs uppercase tracking-[0.15em] mb-4">Shop</h3>
          <ul className="space-y-2.5">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/shop?category=${c.slug}`}
                  className="text-gray-500 hover:text-white transition-colors text-sm"
                >
                  {c.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop?onSale=1" className="text-brand hover:text-red-400 transition-colors text-sm font-semibold">
                Sale
              </Link>
            </li>
            <li>
              <Link href="/shop" className="text-gray-500 hover:text-white transition-colors text-sm">
                All Products
              </Link>
            </li>
          </ul>
        </div>

        {/* Help */}
        <div>
          <h3 className="text-white font-black text-xs uppercase tracking-[0.15em] mb-4">Help</h3>
          <ul className="space-y-2.5">
            <li>
              <Link href="/orders" className="text-gray-500 hover:text-white transition-colors text-sm">
                Track Your Order
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="text-gray-500 hover:text-white transition-colors text-sm">
                How to Pay (UPI)
              </Link>
            </li>
            <li>
              <Link href="/orders" className="text-gray-500 hover:text-white transition-colors text-sm">
                Returns &amp; Exchange
              </Link>
            </li>
            {phone && (
              <li>
                <a href={`tel:${phone}`} className="text-gray-500 hover:text-white transition-colors text-sm">
                  Contact Us
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h3 className="text-white font-black text-xs uppercase tracking-[0.15em] mb-4">Policies</h3>
          <ul className="space-y-2.5">
            <li>
              <span className="text-gray-600 text-sm">Privacy Policy</span>
            </li>
            <li>
              <span className="text-gray-600 text-sm">Terms of Service</span>
            </li>
            <li>
              <span className="text-gray-600 text-sm">Shipping Policy</span>
            </li>
            <li>
              <span className="text-gray-600 text-sm">Return Policy</span>
            </li>
          </ul>

          {/* Payment badges */}
          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2">We Accept</p>
            <div className="flex gap-2 flex-wrap">
              {['GPay', 'PhonePe', 'Paytm', 'COD'].map((p) => (
                <span key={p} className="bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold px-2 py-0.5">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────── */}
      <div className="border-t border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <p>© {year} S John Paul. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:text-gray-400 transition-colors">Seller Login</Link>
            <span className="text-gray-700">·</span>
            <span>Fashion for everyone</span>
          </div>
        </div>
      </div>
    </footer>
  )
}