import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDb, dbConfigured } from '@/lib/db'
import { Order, Product, Coupon } from '@/lib/models'
import { getSettings } from '@/lib/data'
import { genOrderId } from '@/lib/format'
import { getUser } from '@/lib/auth'

export async function GET(request) {
  const { searchParams } = new URL(request.url)

  // ── Auth: resolve the current user ───────────────────────────
  const user = await getUser()

  // Must be logged in
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!dbConfigured) return NextResponse.json({ orders: [] })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ orders: [] })

  // ══════════════════════════════════════════════════════════════
  // HOST / ADMIN — full access to all orders with optional filters
  // ══════════════════════════════════════════════════════════════
  if (user.role === 'host') {
    const phone = (searchParams.get('phone') || '').trim()
    const orderId = (searchParams.get('orderId') || '').trim()
    const status = (searchParams.get('status') || '').trim()

    let query = {}

    if (orderId) {
      // Filter by exact Order ID
      query.orderId = orderId.toUpperCase()
    } else if (phone) {
      // Filter by mobile number
      if (!/^[0-9]{6,15}$/.test(phone)) {
        return NextResponse.json(
          { error: 'Enter a valid mobile number (6–15 digits)' },
          { status: 400 }
        )
      }
      query['customer.phone'] = phone
    } else if (status) {
      // Filter by status
      query.status = status
    }
    // else: no filter → return all orders

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(500).lean()
    return NextResponse.json({ orders })
  }

  // ══════════════════════════════════════════════════════════════
  // CUSTOMER — can only look up their own single order by Order ID
  // Ownership verified by matching customer.email against session email
  // ══════════════════════════════════════════════════════════════
  const orderId = (searchParams.get('orderId') || '').trim()

  if (!orderId) {
    return NextResponse.json(
      { error: 'Enter your Order ID (e.g. JN-X3K2A)' },
      { status: 400 }
    )
  }

  // Fetch the order by orderId only — DO NOT filter by email in DB query
  // so that we can distinguish "order not found" from "order not yours"
  const order = await Order.findOne({ orderId: orderId.toUpperCase() }).lean()

  if (!order) {
    // Order ID doesn't exist at all — return not found (no information leakage)
    return NextResponse.json({ orders: [] })
  }

  // ── Ownership check ─────────────────────────────────────────
  // The JWT session email must match the email used when the order was placed.
  // Orders store customer.phone but NOT customer.email, so we need a secondary
  // way to link customer to order. We use the email stored in the session
  // matched against the email embedded at order creation time.
  //
  // IMPORTANT: The order schema does NOT have a customer.email field.
  // We add it below during POST (order creation). For existing orders without
  // email, we fall back to an additional phone check if provided.
  //
  // Strategy: if the order has a customerEmail field → match it.
  // For legacy orders without customerEmail, allow if phone matches.
  const sessionEmail = user.email?.toLowerCase?.() || ''
  const orderEmail = (order.customerEmail || '').toLowerCase()
  const orderPhone = order.customer?.phone || ''

  const emailMatches = orderEmail && orderEmail === sessionEmail
  const phoneParam = (searchParams.get('phone') || '').trim()
  const phoneMatches = phoneParam && phoneParam === orderPhone && /^[0-9]{10}$/.test(phoneParam)

  if (!emailMatches && !phoneMatches) {
    // The order exists but doesn't belong to this customer
    // Return empty — do not leak any order information
    return NextResponse.json({ orders: [] })
  }

  // Order belongs to this customer — return safe subset
  const safe = {
    _id: order._id,
    orderId: order.orderId,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({ name: i.name, size: i.size, qty: i.qty })),
    amount: order.amount,
    status: order.status,
    note: order.note,
    utr: order.utr,
    paymentMethod: order.paymentMethod,
    tracking: order.tracking
      ? {
          courier: order.tracking.courier || '',
          number: order.tracking.number || '',
          url: order.tracking.url || '',
          eta: order.tracking.eta || '',
          updatedAt: order.tracking.updatedAt || null,
        }
      : null,
  }
  return NextResponse.json({ orders: [safe] })
}

export async function POST(request) {
  if (!dbConfigured) {
    return NextResponse.json(
      { error: 'The store database is not connected yet. Please wait for the owner to finish setup.' },
      { status: 503 }
    )
  }
  try {
    const conn = await connectDb()
    if (!conn) {
      return NextResponse.json(
        { error: 'The store database is not reachable right now. Please try again in a moment.' },
        { status: 503 }
      )
    }

    // Attach the current user's email to the order for future ownership checks
    const sessionUser = await getUser()

    const data = await request.json()
    const { items, customer, utr } = data
    const method = data.method === 'cod' ? 'cod' : 'upi'
    const couponCodeRaw = String(data.couponCode || '').trim().toUpperCase()
    if (!Array.isArray(items) || items.length === 0) throw new Error('Cart is empty')
    if (!customer?.name?.trim()) throw new Error('Name is required')
    if (!/^[0-9]{10}$/.test(customer.phone || '')) throw new Error('Enter a valid 10-digit mobile number')
    if (!customer.address?.trim()) throw new Error('Address is required')
    if (method === 'upi' && (!utr || String(utr).trim().length < 6)) {
      throw new Error('Please enter the Transaction ID (UTR)')
    }

    const ids = items.map((i) => i.id).filter((id) => mongoose.Types.ObjectId.isValid(id))
    const products = await Product.find({ _id: { $in: ids } }).lean()
    const byId = new Map(products.map((p) => [String(p._id), p]))

    const orderItems = []
    let subtotal = 0
    for (const i of items) {
      const p = byId.get(String(i.id))
      if (!p) throw new Error(`Product not found: ${i.id}`)
      const qty = Math.max(1, Math.min(Number(i.qty) || 1, 20))
      if (p.stock < qty) throw new Error(`Only ${p.stock} left of "${p.name}"`)
      orderItems.push({
        productId: p._id,
        name: p.name,
        image: p.image,
        size: String(i.size || 'Free Size'),
        qty,
        price: p.price,
        mrp: p.mrp,
      })
      subtotal += p.price * qty
    }

    const settings = await getSettings()
    const freeDelivery = subtotal >= Number(settings.freeDeliveryAbove || 0)
    const deliveryFee = freeDelivery ? 0 : Number(settings.deliveryFee ?? 49)
    const rawTotal = subtotal + deliveryFee  // pre-coupon

    // ── Coupon re-validation (backend authority) ──────────────
    let couponCode = ''
    let couponDiscount = 0   // percentage
    let discountAmount = 0   // ₹
    if (couponCodeRaw) {
      const coupon = await Coupon.findOne({ code: couponCodeRaw, isActive: true }).lean()
      if (coupon) {
        couponCode = coupon.code
        couponDiscount = coupon.discountPercent
        discountAmount = Math.min(Math.floor((rawTotal * couponDiscount) / 100), rawTotal)
      }
      // If coupon not found / inactive, silently ignore (no discount applied)
    }

    const amount = Math.max(0, rawTotal - discountAmount)

    const order = await Order.create({
      orderId: genOrderId(),
      items: orderItems,
      paymentMethod: method,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
        city: String(customer.city || ''),
        pincode: String(customer.pincode || ''),
      },
      customerEmail: sessionUser?.email ? sessionUser.email.toLowerCase() : '',
      amount,
      originalAmount: rawTotal,
      deliveryFee,
      couponCode,
      couponDiscount,
      discountAmount,
      utr: method === 'upi' ? String(utr).trim() : '',
      upiId: method === 'upi' ? settings.upiId || '' : '',
      status: 'pending',
    })

    await Promise.all(
      orderItems.map((i) => Product.findByIdAndUpdate(i.productId, { $inc: { stock: -i.qty } }))
    )

    return NextResponse.json({ ok: true, order: { orderId: order.orderId } }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}