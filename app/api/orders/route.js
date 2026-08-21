import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDb, dbConfigured } from '@/lib/db'
import { Order, Product, Coupon, Address } from '@/lib/models'
import { getSettings } from '@/lib/data'
import { genOrderId } from '@/lib/format'
import { getUser, requireUser } from '@/lib/auth'
import { getCurrentDbUser } from '@/lib/user'
import * as razorpay from '@/lib/payments/razorpay'
import * as stripe from '@/lib/payments/stripe'

const VALID_METHODS = ['upi', 'cod', 'razorpay', 'stripe']

// Safe projection for customer-facing order data (never exposes other
// users' orders or internal fields)
function customerSafe(order) {
  return {
    _id: String(order._id),
    orderId: order.orderId,
    createdAt: order.createdAt,
    items: (order.items || []).map((i) => ({
      name: i.name,
      image: i.image,
      size: i.size,
      qty: i.qty,
      price: i.price,
      mrp: i.mrp,
    })),
    amount: order.amount,
    originalAmount: order.originalAmount || 0,
    deliveryFee: order.deliveryFee ?? 0,
    couponCode: order.couponCode,
    couponDiscount: order.couponDiscount || 0,
    discountAmount: order.discountAmount || 0,
    status: order.status,
    note: order.note,
    utr: order.utr,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    payment: {
      provider: order.payment?.provider || '',
      paidAt: order.payment?.paidAt || null,
    },
    customer: {
      name: order.customer?.name || '',
      phone: order.customer?.phone || '',
      address: order.customer?.address || '',
      city: order.customer?.city || '',
      state: order.customer?.state || '',
      pincode: order.customer?.pincode || '',
    },
    tracking: order.tracking
      ? {
          courier: order.tracking.courier || '',
          number: order.tracking.number || '',
          url: order.tracking.url || '',
          eta: order.tracking.eta || '',
          updatedAt: order.tracking.updatedAt || null,
        }
      : null,
    shipment: order.shipment?.awb
      ? {
          provider: order.shipment.provider || '',
          awb: order.shipment.awb || '',
          courier: order.shipment.courier || '',
          status: order.shipment.status || '',
          trackingUrl: order.shipment.trackingUrl || '',
        }
      : null,
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)

  // ── Auth: resolve the current user ───────────────────────────
  const user = await getUser()

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
      query.orderId = orderId.toUpperCase()
    } else if (phone) {
      if (!/^[0-9]{6,15}$/.test(phone)) {
        return NextResponse.json(
          { error: 'Enter a valid mobile number (6–15 digits)' },
          { status: 400 }
        )
      }
      query['customer.phone'] = phone
    } else if (status) {
      query.status = status
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(500).lean()
    return NextResponse.json({ orders })
  }

  // ══════════════════════════════════════════════════════════════
  // CUSTOMER
  // ══════════════════════════════════════════════════════════════
  const orderId = (searchParams.get('orderId') || '').trim()

  if (!orderId) {
    // ── Order history — every order belonging to this user only ──
    const email = (user.email || '').toLowerCase()
    const query = email
      ? { $or: [{ userId: user.id || undefined }, { customerEmail: email }] }
      : {}
    if (!email && !user.id) return NextResponse.json({ orders: [] })
    const docs = await Order.find(query).sort({ createdAt: -1 }).limit(100)
    return NextResponse.json({ orders: docs.map(customerSafe) })
  }

  // ── Single-order lookup (Track Order) with ownership check ──
  const order = await Order.findOne({ orderId: orderId.toUpperCase() }).lean()

  if (!order) {
    return NextResponse.json({ orders: [] })
  }

  const sessionEmail = user.email?.toLowerCase?.() || ''
  const orderEmail = (order.customerEmail || '').toLowerCase()
  const ownsByUser =
    user.id && order.userId && String(order.userId) === String(user.id)
  const emailMatches = orderEmail && orderEmail === sessionEmail
  const orderPhone = order.customer?.phone || ''
  const phoneParam = (searchParams.get('phone') || '').trim()
  const phoneMatches = phoneParam && phoneParam === orderPhone && /^[0-9]{10}$/.test(phoneParam)

  if (!ownsByUser && !emailMatches && !phoneMatches) {
    // Order exists but doesn't belong to this customer — leak nothing
    return NextResponse.json({ orders: [] })
  }

  return NextResponse.json({ orders: [customerSafe(order)] })
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

    // ── Checkout requires a signed-in account ────────────────
    await requireUser()
    const dbUser = await getCurrentDbUser()
    if (!dbUser) {
      return NextResponse.json(
        { error: 'Please log in again to place your order.', code: 'auth_required' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { items } = data
    const method = VALID_METHODS.includes(data.method) ? data.method : 'upi'
    const utr = String(data.utr || '').trim()
    const couponCodeRaw = String(data.couponCode || '').trim().toUpperCase()

    if (!Array.isArray(items) || items.length === 0) throw new Error('Your bag is empty')
    if (method === 'upi' && utr.length < 6) {
      throw new Error('Please enter the Transaction ID (UTR)')
    }
    if (method === 'razorpay' && !razorpay.isConfigured()) {
      throw new Error('Online payment is currently unavailable. Please choose another method.')
    }
    if (method === 'stripe' && !stripe.isConfigured()) {
      throw new Error('Online payment is currently unavailable. Please choose another method.')
    }

    // ── Delivery address: saved address OR inline form ────────
    let customer
    let addressId = ''
    if (data.addressId && mongoose.Types.ObjectId.isValid(String(data.addressId))) {
      const addr = await Address.findOne({
        _id: String(data.addressId),
        userId: dbUser.id,   // ownership enforced in the query
      }).lean()
      if (!addr) throw new Error('Selected address could not be found')
      addressId = String(addr._id)
      customer = {
        name: addr.fullName,
        phone: addr.phone,
        address: [addr.line1, addr.line2].filter(Boolean).join(', '),
        city: addr.city,
        state: addr.state || '',
        pincode: addr.pincode,
        country: addr.country || 'India',
      }
    } else {
      const f = data.customer || {}
      if (!f.name?.trim()) throw new Error('Name is required')
      if (!/^[0-9]{10}$/.test(f.phone || '')) throw new Error('Enter a valid 10-digit mobile number')
      if (!f.address?.trim()) throw new Error('Address is required')
      customer = {
        name: f.name.trim(),
        phone: f.phone.trim(),
        address: f.address.trim(),
        city: String(f.city || ''),
        state: String(f.state || ''),
        pincode: String(f.pincode || ''),
        country: 'India',
      }
    }

    // Optionally save a new inline address to the account
    if (!addressId && data.saveAddress) {
      try {
        const count = await Address.countDocuments({ userId: dbUser.id })
        if (count < 10) {
          const parts = customer.address.split(',')
          const created = await Address.create({
            userId: dbUser.id,
            label: data.saveAddressLabel || 'Home',
            fullName: customer.name,
            phone: customer.phone,
            line1: customer.address.slice(0, 250),
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode.replace(/[^0-9]/g, '') || '000000',
            isDefault: count === 0,
          })
          addressId = String(created._id)
        }
      } catch {
        // Non-fatal: order can proceed without saving the address
      }
    }

    // ── Items + stock + pricing (server authority) ───────────
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
    const rawTotal = subtotal + deliveryFee

    // ── Coupon re-validation (backend authority) ──────────────
    let couponCode = ''
    let couponDiscount = 0
    let discountAmount = 0
    if (couponCodeRaw) {
      const coupon = await Coupon.findOne({ code: couponCodeRaw, isActive: true }).lean()
      if (coupon) {
        couponCode = coupon.code
        couponDiscount = coupon.discountPercent
        discountAmount = Math.min(Math.floor((rawTotal * couponDiscount) / 100), rawTotal)
      }
    }

    const amount = Math.max(0, rawTotal - discountAmount)

    // ── Create the order ──────────────────────────────────────
    const providerForMethod = {
      upi: 'upi-manual',
      cod: 'cod',
      razorpay: 'razorpay',
      stripe: 'stripe',
    }
    const order = await Order.create({
      orderId: genOrderId(),
      userId: dbUser.id,
      items: orderItems,
      paymentMethod: method,
      paymentStatus: 'pending',
      payment: { provider: providerForMethod[method] },
      customer,
      customerEmail: dbUser.email.toLowerCase(),
      addressId,
      amount,
      originalAmount: rawTotal,
      deliveryFee,
      couponCode,
      couponDiscount,
      discountAmount,
      utr: method === 'upi' ? utr : '',
      upiId: method === 'upi' ? settings.upiId || '' : '',
      status: 'pending',
    })

    await Promise.all(
      orderItems.map((i) => Product.findByIdAndUpdate(i.productId, { $inc: { stock: -i.qty } }))
    )

    // ── Initialise the chosen payment gateway ────────────────
    let payment = null
    if (method === 'razorpay') {
      try {
        const rp = await razorpay.createPayment({ order })
        order.payment.refId = rp.refId
        await order.save()
        payment = {
          gateway: 'razorpay',
          keyId: rp.keyId,
          razorpayOrderId: rp.refId,
          amountPaise: rp.amount,
          prefill: { name: customer.name, contact: customer.phone, email: dbUser.email },
        }
      } catch (err) {
        console.error('razorpay init failed:', err.message)
        await restoreAndRemove(order)
        return NextResponse.json(
          { error: 'Payment provider is not responding. Please try again or use another method.' },
          { status: 502 }
        )
      }
    } else if (method === 'stripe') {
      try {
        const origin =
          process.env.NEXT_PUBLIC_SITE_URL ||
          request.headers.get('origin') ||
          new URL(request.url).origin
        const sp = await stripe.createPayment({ order, origin })
        order.payment.refId = sp.refId
        await order.save()
        payment = { gateway: 'stripe', checkoutUrl: sp.url }
      } catch (err) {
        console.error('stripe init failed:', err.message)
        await restoreAndRemove(order)
        return NextResponse.json(
          { error: 'Payment provider is not responding. Please try again or use another method.' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { ok: true, order: customerSafe(order.toObject()), payment },
      { status: 201 }
    )
  } catch (err) {
    if (err.status === 401) {
      return NextResponse.json({ error: err.message, code: 'auth_required' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// Rolls back an order whose payment initialisation failed:
// restocks the items and removes the pending-payment record.
async function restoreAndRemove(order) {
  try {
    await Promise.all(
      order.items.map((i) =>
        i.productId && Product.findByIdAndUpdate(i.productId, { $inc: { stock: i.qty } })
      )
    )
    await Order.findByIdAndDelete(order._id)
  } catch (err) {
    console.error('order rollback failed:', err.message)
  }
}
