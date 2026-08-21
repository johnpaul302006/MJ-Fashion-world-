'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCart, saveCart, updateQty, removeItem } from '@/lib/cart-client'
import { inr } from '@/lib/format'
import { fallbackImg } from '@/lib/img-fallback'
import { imgUrl } from '@/lib/img-url'
import { useAuth } from '@/components/auth/AuthProvider'

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
function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

const inputCls = "w-full border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] dark:text-white rounded-sm px-3 py-2.5 text-sm outline-none focus:border-brand transition-colors placeholder-gray-400"

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

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
      <div className="p-4 sm:p-5">
        <div
          className="flex gap-2"
          onKeyDown={(e) => { if (e.key === 'Enter') apply(e) }}
        >
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
            placeholder="Enter coupon code"
            className={`${inputCls} font-mono tracking-wider uppercase flex-1`}
            maxLength={30}
          />
          <button
            type="button"
            onClick={apply}
            disabled={loading}
            className="shrink-0 bg-[#111] dark:bg-white text-white dark:text-[#111] font-bold px-5 py-2.5 text-sm tracking-wide hover:opacity-80 disabled:opacity-50 transition-opacity rounded-sm"
          >
            {loading ? '...' : 'Apply'}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
        )}
      </div>
    </div>
  )
}

/* ─── Saved Address Picker ───────────────────────── */
function AddressPicker({ addresses, selectedId, onSelect, onAddNew, defaultForm }) {
  const [adding, setAdding] = useState(addresses.length === 0)
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState('')

  function validate() {
    const fe = {}
    if ((form.fullName || '').trim().length < 3) fe.fullName = 'Enter the full name'
    if (!/^[6-9][0-9]{9}$/.test((form.phone || '').replace(/[^0-9]/g, '').slice(-10))) fe.phone = 'Enter a valid 10-digit mobile number'
    if ((form.line1 || '').trim().length < 5) fe.line1 = 'Enter house no & street'
    if (!(form.city || '').trim()) fe.city = 'City is required'
    if (!/^[1-9][0-9]{5}$/.test((form.pincode || '').replace(/[^0-9]/g, ''))) fe.pincode = 'Valid 6-digit PIN required'
    return fe
  }

  async function save(e) {
    e.preventDefault()
    const fe = validate()
    setErrors(fe)
    if (Object.keys(fe).length > 0) return
    setSaving(true)
    setLocalError('')
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors)
        throw new Error(data.error || 'Could not save address')
      }
      onAddNew(data.address)
      setAdding(false)
      setForm(defaultForm)
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {addresses.map((a) => (
        <label
          key={a.id}
          className={`flex gap-3 p-3.5 border-2 rounded-sm cursor-pointer transition-all ${
            selectedId === a.id
              ? 'border-brand bg-red-50/50 dark:bg-red-950/20'
              : 'border-gray-100 dark:border-[#2a2a2a] hover:border-gray-200 dark:hover:border-[#3a3a3a]'
          }`}
        >
          <input
            type="radio"
            name="address"
            checked={selectedId === a.id}
            onChange={() => onSelect(a.id)}
            className="mt-1 accent-brand"
          />
          <div className="flex-1 min-w-0">
            <p className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              {a.fullName}
              <span className="text-[9px] font-black bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 px-1.5 py-0.5 uppercase tracking-wider">{a.label}</span>
              {a.isDefault ? <span className="text-[9px] font-black bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-1.5 py-0.5 uppercase tracking-wider">Default</span> : null}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}{a.state ? `, ${a.state}` : ''} — {a.pincode}
              <br />Phone: {a.phone}
            </p>
          </div>
        </label>
      ))}

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full border-2 border-dashed border-gray-200 dark:border-[#333] hover:border-brand hover:text-brand text-gray-500 dark:text-gray-400 font-bold text-sm py-3 rounded-sm flex items-center justify-center gap-2 transition-colors"
        >
          <PlusIcon /> Add New Address
        </button>
      ) : (
        <div className="border border-gray-100 dark:border-[#222] rounded-sm p-4 space-y-3 bg-gray-50/50 dark:bg-[#161616]">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Full name *" className={inputCls} />
              {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Mobile number * (10 digits)" className={inputCls} maxLength={10} />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>
          </div>
          <div>
            <input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })}
              placeholder="House no, building, street *" className={inputCls} />
            {errors.line1 && <p className="text-xs text-red-600 mt-1">{errors.line1}</p>}
          </div>
          <input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })}
            placeholder="Area, landmark (optional)" className={inputCls} />
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="City *" className={inputCls} />
              {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
            </div>
            <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="State" className={inputCls} />
            <div>
              <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                placeholder="PIN code *" className={inputCls} maxLength={6} />
              {errors.pincode && <p className="text-xs text-red-600 mt-1">{errors.pincode}</p>}
            </div>
          </div>
          {localError && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{localError}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={save} disabled={saving}
              className="bg-[#111] dark:bg-white text-white dark:text-[#111] font-bold px-5 py-2.5 text-sm hover:opacity-80 disabled:opacity-50 transition-opacity rounded-sm">
              {saving ? 'Saving…' : 'Save Address'}
            </button>
            {addresses.length > 0 && (
              <button type="button" onClick={() => { setAdding(false); setErrors({}) }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [items, setItems] = useState([])
  const [settings, setSettings] = useState(null)
  const [gateways, setGateways] = useState(null)
  const [addresses, setAddresses] = useState(null) // null = still loading
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [utr, setUtr] = useState('')
  const [methodChoice, setMethodChoice] = useState('') // '' = auto-pick once gateways load
  const [agree, setAgree] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [coupon, setCoupon] = useState(null)
  const ranRef = useRef(false)

  // ── Auth gate — checkout requires an account ──────────────
  useEffect(() => {
    if (ranRef.current) return
    if (!authLoading && !user) {
      router.replace('/login?next=%2Fcheckout')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    const update = () => setItems(getCart())
    const t = setTimeout(update, 0)
    window.addEventListener('cart-updated', update)
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || null)
        setGateways(d.paymentGateways || { razorpay: false, stripe: false })
      })
      .catch(() => {})
    const c = setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search)
        if (params.get('canceled') === '1') {
          setNotice('Payment was cancelled — nothing was charged. Your bag is intact; you can retry below.')
        }
      } catch {}
    }, 0)
    return () => {
      clearTimeout(t)
      clearTimeout(c)
      window.removeEventListener('cart-updated', update)
    }
  }, [])

  // Load saved delivery addresses for the signed-in user
  useEffect(() => {
    if (!user) return
    let active = true
    fetch('/api/addresses')
      .then((r) => r.json())
      .then((d) => {
        if (!active) return
        const list = d.addresses || []
        setAddresses(list)
        const def = list.find((a) => a.isDefault) || list[0]
        if (def) setSelectedAddressId(def.id)
      })
      .catch(() => setAddresses([]))
    return () => { active = false }
  }, [user])

  // Default method: the only configured gateway (if just one), else UPI
  const autoMethod =
    !gateways
      ? ''
      : !gateways.stripe && gateways.razorpay
        ? 'razorpay'
        : !gateways.razorpay && gateways.stripe
          ? 'stripe'
          : ''
  const method = methodChoice || autoMethod || 'upi'

  // Reset an applied coupon whenever the bag contents change
  const [prevCount, setPrevCount] = useState(items.length)
  if (items.length !== prevCount) {
    setPrevCount(items.length)
    setCoupon(null)
  }

  function refresh() { setItems(getCart()) }

  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0)
  const mrpTotal = items.reduce((n, i) => n + (i.mrp || i.price) * i.qty, 0)
  const totalSaving = mrpTotal - subtotal
  const freeDelivery = settings && subtotal >= Number(settings.freeDeliveryAbove || 0)
  const deliveryFee = freeDelivery ? 0 : Number(settings?.deliveryFee ?? 49)
  const rawTotal = subtotal + deliveryFee
  const couponDiscount = coupon?.discountAmount || 0
  const total = Math.max(0, rawTotal - couponDiscount)
  const codEnabled = settings ? Boolean(settings.codEnabled) : true

  const selectedAddress = (addresses || []).find((a) => a.id === selectedAddressId)

  function buildOrderPayload() {
    const payload = {
      method,
      utr: utr.trim(),
      couponCode: coupon?.code || '',
    }
    if (selectedAddress) {
      payload.addressId = selectedAddress.id
    } else {
      // No saved address picked — inline form fields
      payload.customer = inlineForm
      payload.saveAddress = true
    }
    return payload
  }

  const [inlineForm, setInlineForm] = useState({
    name: '', phone: '', address: '', city: '', state: '', pincode: '',
  })

  function validateBeforePay() {
    if (items.length === 0) return 'Your bag is empty'
    if (!selectedAddress) {
      if (!inlineForm.name.trim() || inlineForm.name.trim().length < 3) return 'Enter the recipient full name'
      if (!/^[6-9][0-9]{9}$/.test(inlineForm.phone.replace(/[^0-9]/g, '').slice(-10))) return 'Enter a valid 10-digit mobile number'
      if (inlineForm.address.trim().length < 5) return 'Enter the full delivery address'
    }
    return ''
  }

  async function placeOrder(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    const validationError = validateBeforePay()
    if (validationError) return setError(validationError)
    if (method === 'upi') {
      if (!agree) return setError('Please confirm that you have paid')
      if (utr.trim().length < 6) return setError('Please enter the Transaction ID (UTR) from your UPI app')
    }
    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildOrderPayload()),
      })

      // Session expired mid-checkout → send to login, come back after
      if (res.status === 401) {
        router.replace('/login?next=%2Fcheckout')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not place order')

      const order = data.order
      const payment = data.payment

      // ── COD / manual UPI → done ──────────────────────────
      if (method === 'upi' || method === 'cod') {
        saveCart([])
        router.replace(`/order/${order.orderId}?placed=1`)
        return
      }

      // ── Razorpay checkout modal ──────────────────────────
      if (method === 'razorpay') {
        const ok = await loadRazorpayScript()
        if (!ok) throw new Error('Could not reach the payment gateway. Check your connection and retry.')
        const rzp = new window.Razorpay({
          key: payment.keyId,
          amount: payment.amountPaise,
          currency: 'INR',
          name: settings?.storeName || 'Big Pickle',
          description: `Order ${order.orderId}`,
          order_id: payment.razorpayOrderId,
          prefill: payment.prefill || {},
          notes: { orderId: order.orderId },
          theme: { color: '#cc0000' },
          handler: async (resp) => {
            try {
              const vres = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  gateway: 'razorpay',
                  orderId: order.orderId,
                  razorpay_order_id: resp.razorpay_order_id,
                  razorpay_payment_id: resp.razorpay_payment_id,
                  razorpay_signature: resp.razorpay_signature,
                }),
              })
              const vdata = await vres.json()
              if (!vres.ok) throw new Error(vdata.error || 'Payment verification failed')
              saveCart([])
              router.replace(`/order/${order.orderId}?paid=1`)
            } catch (err) {
              setError(err.message + ' Your order is visible in Order History.')
              setPlacing(false)
            }
          },
          modal: {
            ondismiss: () => {
              setPlacing(false)
              setNotice(`Payment window closed before finishing. You can retry paying for order ${order.orderId} from Order History.`)
            },
          },
        })
        rzp.on('payment.failed', () => {
          setPlacing(false)
          setError('The bank declined the payment. No money was captured — please retry or choose another method.')
        })
        rzp.open()
        return
      }

      // ── Stripe hosted checkout ───────────────────────────
      if (method === 'stripe') {
        if (payment?.checkoutUrl) {
          window.location.href = payment.checkoutUrl
          return
        }
        throw new Error('Stripe did not return a checkout link. Please retry.')
      }
    } catch (err) {
      setError(err.message)
      setPlacing(false)
    }
  }

  /* ── AUTH LOADING / GATE SCREENS ─────────────────── */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-gray-400 font-medium tracking-widest uppercase">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
          Loading checkout…
        </div>
      </div>
    )
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0f0f] flex items-center justify-center px-4">
        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm p-10 max-w-md w-full text-center shadow-sm">
          <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">Login to continue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Browsing is always free — you only need an account to place orders so we can track
            them securely for you.
          </p>
          <Link
            href="/login?next=%2Fcheckout"
            className="inline-block bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3 text-sm tracking-wider uppercase transition-colors mr-2"
          >
            Login
          </Link>
          <Link
            href="/signup?next=%2Fcheckout"
            className="inline-block border-2 border-gray-200 dark:border-[#333] hover:border-brand hover:text-brand text-gray-700 dark:text-gray-200 font-bold px-8 py-3 text-sm tracking-wider uppercase transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    )
  }

  /* ── MAIN CHECKOUT UI ───────────────────────────── */
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

        {notice && (
          <div className="mb-5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 p-4 rounded-sm text-sm text-blue-800 dark:text-blue-300 font-medium">
            {notice}
          </div>
        )}

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
          <form onSubmit={placeOrder}>
            <div className="grid lg:grid-cols-5 gap-6">

              {/* ── LEFT — Items + Address + Payment ──── */}
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
                              type="button"
                              onClick={() => { updateQty(i.id, i.size, i.qty - 1); refresh() }}
                              className="w-7 h-7 border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-300 font-bold text-sm hover:border-brand hover:text-brand transition-colors flex items-center justify-center"
                            >−</button>
                            <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{i.qty}</span>
                            <button
                              type="button"
                              onClick={() => { updateQty(i.id, i.size, i.qty + 1); refresh() }}
                              className="w-7 h-7 border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-300 font-bold text-sm hover:border-brand hover:text-brand transition-colors flex items-center justify-center"
                            >+</button>
                            <button
                              type="button"
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

                {/* Delivery address */}
                <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm overflow-hidden">
                  <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
                    <h2 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                      <PinIcon /> Delivery Address
                    </h2>
                    <span className="text-[11px] text-gray-400 hidden sm:block">
                      Signed in as <b>{user.name || user.email}</b>
                    </span>
                  </div>
                  <div className="p-4 sm:p-5">
                    {addresses === null ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400 py-4 justify-center">
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
                        Loading your saved addresses…
                      </div>
                    ) : (
                      <AddressPicker
                        addresses={addresses}
                        selectedId={selectedAddressId}
                        onSelect={setSelectedAddressId}
                        onAddNew={(addr) => {
                          setAddresses((list) => [addr, ...(list || [])])
                          setSelectedAddressId(addr.id)
                        }}
                        defaultForm={{
                          label: 'Home',
                          fullName: user.name || '',
                          phone: user.phone || '',
                          line1: '', line2: '', city: '', state: '', pincode: '',
                        }}
                      />
                    )}

                    {/* Inline fallback form when no saved address is selected */}
                    {Array.isArray(addresses) && addresses.length === 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Enter delivery details
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <input value={inlineForm.name} onChange={(e) => setInlineForm({ ...inlineForm, name: e.target.value })}
                            placeholder="Full name *" className={inputCls} />
                          <input value={inlineForm.phone} onChange={(e) => setInlineForm({ ...inlineForm, phone: e.target.value })}
                            placeholder="Mobile number * (10 digits)" maxLength={10} className={inputCls} />
                        </div>
                        <textarea value={inlineForm.address} onChange={(e) => setInlineForm({ ...inlineForm, address: e.target.value })}
                          placeholder="Full address with house no, street, landmark *" rows={2}
                          className={`${inputCls} resize-none`} />
                        <div className="grid sm:grid-cols-3 gap-3">
                          <input value={inlineForm.city} onChange={(e) => setInlineForm({ ...inlineForm, city: e.target.value })}
                            placeholder="City" className={inputCls} />
                          <input value={inlineForm.state} onChange={(e) => setInlineForm({ ...inlineForm, state: e.target.value })}
                            placeholder="State" className={inputCls} />
                          <input value={inlineForm.pincode} onChange={(e) => setInlineForm({ ...inlineForm, pincode: e.target.value })}
                            placeholder="Pincode" maxLength={6} className={inputCls} />
                        </div>
                        <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
                          <input type="checkbox" checked readOnly className="mt-0.5 accent-brand" />
                          <span>Save this address to my account for faster checkout next time.</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment method */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm px-4 sm:px-5 py-3.5">
                    <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-3">
                      Payment Method
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {gateways?.razorpay && (
                        <button type="button" onClick={() => setMethodChoice('razorpay')}
                          className={`border-2 px-4 py-3 text-sm font-bold text-left transition-all rounded-sm ${
                            method === 'razorpay'
                              ? 'border-brand bg-red-50 dark:bg-red-950/30 text-brand'
                              : 'border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}>
                          UPI / Card / Netbanking
                          <span className="block text-[11px] font-normal text-gray-400 mt-0.5">Powered by Razorpay — instant confirmation</span>
                        </button>
                      )}
                      {gateways?.stripe && (
                        <button type="button" onClick={() => setMethodChoice('stripe')}
                          className={`border-2 px-4 py-3 text-sm font-bold text-left transition-all rounded-sm ${
                            method === 'stripe'
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}>
                          Card (International)
                          <span className="block text-[11px] font-normal text-gray-400 mt-0.5">Secure checkout by Stripe</span>
                        </button>
                      )}
                      <button type="button" onClick={() => setMethodChoice('upi')}
                        className={`border-2 px-4 py-3 text-sm font-bold text-left transition-all rounded-sm ${
                          method === 'upi'
                            ? 'border-brand bg-red-50 dark:bg-red-950/30 text-brand'
                            : 'border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-gray-300'
                        }`}>
                        Direct UPI Transfer
                        <span className="block text-[11px] font-normal text-gray-400 mt-0.5">Scan QR · pay manually · verified by store</span>
                      </button>
                      {codEnabled && (
                        <button type="button" onClick={() => setMethodChoice('cod')}
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
                  </div>

                  {/* Method-specific panels */}
                  {method === 'upi' && (
                    <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm p-4 sm:p-5 grid sm:grid-cols-2 gap-4">
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
                        <input required={method === 'upi'} value={utr} onChange={(e) => setUtr(e.target.value)}
                          placeholder="e.g. 412345678901"
                          className={`${inputCls} tracking-widest font-mono`} />
                        <label className="mt-3 flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
                          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-brand" />
                          <span>I confirm I have <b>paid</b> {inr(total)} to the above UPI ID and the transaction belongs to this order.</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {method === 'cod' && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 p-4 rounded-sm text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-bold text-green-700 dark:text-green-400 mb-1">Cash on Delivery selected</p>
                      <p>No payment needed now. Keep <b>{inr(total)}</b> ready in cash when your order arrives. We&apos;ll call you on <b>{selectedAddress?.phone || inlineForm.phone || 'your number'}</b> to confirm first.</p>
                    </div>
                  )}

                  {method === 'razorpay' && (
                    <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-sm text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-bold text-brand mb-1">Paying {inr(total)} via Razorpay</p>
                      <p>Click <b>Place Order</b> — a secure Razorpay window will open where you can pay by UPI, card, netbanking or wallets. The order confirms instantly after payment.</p>
                    </div>
                  )}

                  {method === 'stripe' && (
                    <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-sm text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-bold text-indigo-700 dark:text-indigo-300 mb-1">Paying {inr(total)} via Stripe</p>
                      <p>Click <b>Place Order</b> and you&apos;ll be taken to Stripe&apos;s secure hosted checkout to pay by card. You&apos;ll return here automatically once done.</p>
                    </div>
                  )}
                </div>
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

                    {coupon && (
                      <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <TagIcon />
                          Coupon ({coupon.discountPercent}% off)
                        </span>
                        <span>− {inr(couponDiscount)}</span>
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

                  {error && (
                    <div className="px-4 sm:px-5 pb-4">
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-3 rounded-sm text-sm text-red-600 dark:text-red-400 font-medium">
                        {error}
                      </div>
                    </div>
                  )}

                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
                    <button type="submit" disabled={placing}
                      className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-black py-4 text-sm tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed shadow-sm hover:shadow-md">
                      {placing ? (method === 'upi' || method === 'cod' ? 'Placing Order…' : 'Opening secure payment…') : `Place Order · ${inr(total)}`}
                    </button>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      {method === 'razorpay' || method === 'stripe'
                        ? 'Payment is processed by the gateway and verified server-side before your order is confirmed.'
                        : 'Orders are dispatched within 24 hours. UPI transfers are verified by the store before dispatch.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
