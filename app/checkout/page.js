'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getCart, saveCart, updateQty, removeItem } from '@/lib/cart-client'
import { inr } from '@/lib/format'
import { fallbackImg } from '@/lib/img-fallback'
import { imgUrl } from '@/lib/img-url'

/* ─── SVG Icons ─────────────────────────────────── */
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
function TagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  )
}

const inputCls = "w-full border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] dark:text-white rounded-sm px-3 py-2.5 text-sm outline-none focus:border-brand transition-colors placeholder-gray-400"

/* ─── Coupon Section Component ───────────────────── */
function CouponSection({ cartTotal, onApply, onRemove, applied }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  async function apply(e) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return setError('Please enter a coupon code')
    if (applied?.code === trimmed) return setError('This coupon is already applied')
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, cartTotal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid coupon')
      onApply(data)
      setCode('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function remove() {
    setCode('')
    setError('')
    onRemove()
    inputRef.current?.focus()
  }

  if (applied) {
    return (
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 rounded-sm px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckIcon />
          <div>
            <p className="text-sm font-bold">Coupon <span className="font-mono tracking-wider">{applied.code}</span> applied</p>
            <p className="text-xs mt-0.5 text-green-600 dark:text-green-500">{applied.discountPercent}% off — you save {inr(applied.discountAmount)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={remove}
          className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline shrink-0"
        >
          Remove
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 dark:border-[#222] flex items-center gap-2">
        <TagIcon />
        <h2 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider">Apply Coupon</h2>
      </div>
      <form onSubmit={apply} className="p-4 sm:p-5">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
            placeholder="Enter coupon code"
            className={`${inputCls} font-mono tracking-wider uppercase flex-1`}
            maxLength={30}
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 bg-[#111] dark:bg-white text-white dark:text-[#111] font-bold px-5 py-2.5 text-sm tracking-wide hover:opacity-80 disabled:opacity-50 transition-opacity rounded-sm"
          >
            {loading ? '...' : 'Apply'}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
        )}
      </form>
    </div>
  )
}

export default function CheckoutPage() {
  const [items, setItems] = useState([])
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', pincode: '' })
  const [utr, setUtr] = useState('')
  const [method, setMethod] = useState('upi')
  const [agree, setAgree] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [placed, setPlaced] = useState(null)
  const [coupon, setCoupon] = useState(null) // { code, discountPercent, discountAmount, finalAmount }

  useEffect(() => {
    const update = () => setItems(getCart())
    const t = setTimeout(update, 0)
    window.addEventListener('cart-updated', update)
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || null))
      .catch(() => {})
    return () => {
      clearTimeout(t)
      window.removeEventListener('cart-updated', update)
    }
  }, [])

  // Reset coupon if cart changes
  useEffect(() => { setCoupon(null) }, [items.length])

  function refresh() { setItems(getCart()) }

  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0)
  const mrpTotal = items.reduce((n, i) => n + (i.mrp || i.price) * i.qty, 0)
  const totalSaving = mrpTotal - subtotal
  const freeDelivery = settings && subtotal >= Number(settings.freeDeliveryAbove || 0)
  const deliveryFee = freeDelivery ? 0 : Number(settings?.deliveryFee ?? 49)
  const rawTotal = subtotal + deliveryFee    // pre-coupon total
  const couponDiscount = coupon?.discountAmount || 0
  const total = Math.max(0, rawTotal - couponDiscount)  // final payable
  const codEnabled = settings ? Boolean(settings.codEnabled) : true

  async function placeOrder(e) {
    e.preventDefault()
    setError('')
    if (method === 'upi') {
      if (!agree) return setError('Please confirm that you have paid')
      if (utr.trim().length < 6) return setError('Please enter the Transaction ID (UTR) from your UPI app')
    }
    if (items.length === 0) return setError('Your cart is empty')
    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, size: i.size, qty: i.qty })),
          customer: form,
          method,
          utr: utr.trim(),
          couponCode: coupon?.code || '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not place order')
      saveCart([])
      setPlaced(data.order)
    } catch (err) {
      setError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  /* ── ORDER SUCCESS ──────────────────────────────── */
  if (placed) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0f0f] flex items-center justify-center px-4 py-16">
        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm p-8 sm:p-12 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Order Placed!</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Your order ID is{' '}
            <span className="font-black text-brand">{placed.orderId}</span>
          </p>
          {coupon && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-3 rounded-sm text-sm text-green-700 dark:text-green-300 text-left mb-4">
              <p className="font-semibold">Coupon {coupon.code} applied — you saved {inr(coupon.discountAmount)}!</p>
            </div>
          )}
          {method === 'upi' && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-4 text-sm text-amber-800 dark:text-amber-300 text-left rounded-sm mb-6">
              <p className="font-bold mb-1">Payment Pending Verification</p>
              <p>Your payment (UTR: <b>{utr}</b>) will be verified by the store. We&apos;ll call you on <b>{form.phone}</b> if needed.</p>
            </div>
          )}
          <Link
            href="/orders"
            className="inline-block bg-[#111] dark:bg-white text-white dark:text-[#111] font-bold px-8 py-3 text-sm tracking-wider uppercase hover:opacity-80 transition-opacity"
          >
            Track My Order
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0f0f]">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-[#222]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-brand transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-200 font-medium">Bag &amp; Checkout</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider">
          Your Bag
        </h1>

        {items.length === 0 ? (
          /* ── EMPTY CART ──────────────────── */
          <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-[#222] rounded-full flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <p className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-1">Your bag is empty</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Looks like you haven&apos;t added anything yet!
            </p>
            <Link
              href="/shop"
              className="inline-block bg-brand text-white font-bold px-8 py-3 text-sm tracking-wider uppercase hover:bg-brand-dark transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">

            {/* ── LEFT — Items + Coupon + Form ──── */}
            <div className="lg:col-span-3 space-y-4">

              {/* Cart items */}
              <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
                  <h2 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                    Items ({items.length})
                  </h2>
                  <Link href="/shop" className="text-xs text-brand hover:underline font-semibold">
                    + Add more
                  </Link>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-[#222]">
                  {items.map((i) => (
                    <div key={i.id + i.size} className="flex gap-4 p-4 sm:p-5">
                      {/* Image */}
                      <div className="shrink-0 w-20 sm:w-24 rounded-sm overflow-hidden bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222]"
                        style={{ aspectRatio: '3/4' }}>
                        {i.image ? (
                          <img
                            src={imgUrl(i.image)}
                            alt={i.name}
                            onError={fallbackImg}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-[#222]" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug mb-1 line-clamp-2">
                          {i.name}
                        </p>
                        <p className="text-xs text-gray-400 mb-2">
                          Size: <span className="font-semibold text-gray-600 dark:text-gray-300">{i.size}</span>
                        </p>
                        <div className="flex items-center gap-1 mb-3">
                          <button
                            onClick={() => { updateQty(i.id, i.size, i.qty - 1); refresh() }}
                            className="w-7 h-7 border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-300 font-bold text-sm hover:border-brand hover:text-brand transition-colors flex items-center justify-center"
                          >−</button>
                          <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{i.qty}</span>
                          <button
                            onClick={() => { updateQty(i.id, i.size, i.qty + 1); refresh() }}
                            className="w-7 h-7 border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-300 font-bold text-sm hover:border-brand hover:text-brand transition-colors flex items-center justify-center"
                          >+</button>
                          <button
                            onClick={() => { removeItem(i.id, i.size); refresh() }}
                            className="ml-3 flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                          >
                            <TrashIcon /> Remove
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="shrink-0 text-right">
                        <p className="font-black text-gray-900 dark:text-white text-sm">{inr(i.price * i.qty)}</p>
                        {i.qty > 1 && (
                          <p className="text-xs text-gray-400 mt-0.5">{inr(i.price)} each</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Coupon Section ─────────────── */}
              <CouponSection
                cartTotal={rawTotal}
                applied={coupon}
                onApply={(data) => setCoupon(data)}
                onRemove={() => setCoupon(null)}
              />

              {/* Delivery address form */}
              <form onSubmit={placeOrder} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 dark:border-[#222]">
                  <h2 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                    Delivery Address
                  </h2>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name *" className={inputCls} />
                    <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Mobile number * (10 digits)" pattern="[0-9]{10}" className={inputCls} />
                  </div>
                  <textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Full address with house no, street, landmark *" rows={2}
                    className={`${inputCls} resize-none`} />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="City" className={inputCls} />
                    <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      placeholder="Pincode" className={inputCls} />
                  </div>
                </div>

                {/* Payment method */}
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
                  <div className="border-t border-gray-100 dark:border-[#222] pt-4">
                    <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-3">
                      Payment Method
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2 mb-4">
                      <button type="button" onClick={() => setMethod('upi')}
                        className={`border-2 px-4 py-3 text-sm font-bold text-left transition-all rounded-sm ${
                          method === 'upi'
                            ? 'border-brand bg-red-50 dark:bg-red-950/30 text-brand'
                            : 'border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-gray-300'
                        }`}>
                        UPI Payment
                        <span className="block text-[11px] font-normal text-gray-400 mt-0.5">GPay · PhonePe · Paytm</span>
                      </button>
                      {codEnabled && (
                        <button type="button" onClick={() => setMethod('cod')}
                          className={`border-2 px-4 py-3 text-sm font-bold text-left transition-all rounded-sm ${
                            method === 'cod'
                              ? 'border-green-600 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                              : 'border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}>
                          Cash on Delivery
                          <span className="block text-[11px] font-normal text-gray-400 mt-0.5">Pay when order arrives</span>
                        </button>
                      )}
                    </div>

                    {method === 'upi' ? (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222] p-4 text-center rounded-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Step 1 — Scan &amp; Pay</p>
                          {settings?.qrImageUrl ? (
                            <img src={settings.qrImageUrl} alt="UPI QR" className="mx-auto w-36 h-36 object-contain" />
                          ) : (
                            <div className="mx-auto w-36 h-36 bg-gray-200 dark:bg-[#222] flex items-center justify-center text-xs text-gray-400 text-center px-2">
                              QR not set yet — pay to UPI ID below
                            </div>
                          )}
                          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Pay <b className="text-gray-900 dark:text-white">{inr(total)}</b> to</p>
                          <p className="text-sm font-black text-brand">{settings?.upiId || 'upi-id@upi'}</p>
                          {settings?.upiId && (
                            <a href={`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.storeName || 'Store')}&am=${total}&cu=INR`}
                              className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">
                              Tap to open UPI app →
                            </a>
                          )}
                        </div>
                        <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222] p-4 rounded-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Step 2 — Enter Transaction ID</p>
                          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                            After paying, open your UPI app → Bank account → Transactions — copy the <b>12-digit UTR / Transaction ID</b> and paste here.
                          </p>
                          <input required value={utr} onChange={(e) => setUtr(e.target.value)}
                            placeholder="e.g. 412345678901"
                            className={`${inputCls} tracking-widest font-mono`} />
                          <label className="mt-3 flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
                            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-brand" />
                            <span>I confirm I have <b>paid</b> {inr(total)} to the above UPI ID and the transaction belongs to this order.</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 p-4 rounded-sm text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-bold text-green-700 dark:text-green-400 mb-1">Cash on Delivery selected</p>
                        <p>No UPI payment needed now. Keep <b>{inr(total)}</b> ready in cash when your order arrives. We&apos;ll call you to confirm first.</p>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-3 rounded-sm text-sm text-red-600 dark:text-red-400 font-medium">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={placing}
                    className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-black py-4 text-sm tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed shadow-sm hover:shadow-md">
                    {placing ? 'Placing Order...' : `Place Order · ${inr(total)}`}
                  </button>
                </div>
              </form>
            </div>

            {/* ── RIGHT — Price Summary ───────── */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm overflow-hidden lg:sticky lg:top-[130px]">
                <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 dark:border-[#222]">
                  <h2 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider">Price Details</h2>
                </div>
                <div className="p-4 sm:p-5 space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Total MRP ({items.reduce((n, i) => n + i.qty, 0)} items)</span>
                    <span>{inr(mrpTotal)}</span>
                  </div>
                  {totalSaving > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Product Discount</span>
                      <span>− {inr(totalSaving)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Delivery {freeDelivery ? <span className="text-green-600 font-semibold">(FREE)</span> : null}</span>
                    <span>{deliveryFee === 0 ? <span className="text-green-600 font-semibold">FREE</span> : inr(deliveryFee)}</span>
                  </div>

                  {settings && subtotal < Number(settings.freeDeliveryAbove || 0) ? (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/30 p-2.5 text-xs text-amber-700 dark:text-amber-300 rounded-sm">
                      Add items worth {inr(Number(settings.freeDeliveryAbove) - subtotal)} more for FREE delivery!
                    </div>
                  ) : null}

                  {/* Coupon discount row */}
                  {coupon && (
                    <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <TagIcon />
                        Coupon ({coupon.discountPercent}% off)
                      </span>
                      <span>− {inr(coupon.discountAmount)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-100 dark:border-[#222] pt-3 flex justify-between font-black text-gray-900 dark:text-white text-base">
                    <span>Total Amount</span>
                    <span>{inr(total)}</span>
                  </div>

                  {(totalSaving > 0 || couponDiscount > 0) && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 p-2.5 text-xs text-green-700 dark:text-green-400 font-semibold text-center rounded-sm">
                      You save {inr(totalSaving + couponDiscount)} on this order!
                    </div>
                  )}
                </div>
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Payment is manually verified by the store after you submit the Transaction ID. Orders are dispatched within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}