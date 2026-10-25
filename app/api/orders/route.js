import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDb, dbConfigured } from '@/lib/db'
import { Order, Product, Coupon, Address, Cart } from '@/lib/models'
import { getSettings } from '@/lib/data'
import { genOrderId } from '@/lib/format'
import { getUser, requireUser } from '@/lib/auth'
import { getCurrentDbUser } from '@/lib/user'
import * as razorpay from '@/lib/payments/razorpay'
import * as stripe from '@/lib/payments/stripe'
import { dispatchOrderNotification } from '@/lib/notifications'

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
    percentage: order.percentage || order.couponDiscount || 0,
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
    deliveredAt: order.deliveredAt || null,
    statusTimestamps: order.statusTimestamps || null,
    tracking: order.tracking
      ? {
          courier: order.tracking.courier || '',
          number: order.tracking.number || '',
          url: order.tracking.url || '',
          eta: order.tracking.eta || '',
          currentLocation: order.tracking.currentLocation || '',
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

// Projection for tracking orders by phone number or orderId when user is not full owner or guest
function trackSafe(order) {
  const rawPhone = order.customer?.phone || ''
  const maskedPhone = rawPhone.length >= 4 ? '••••••' + rawPhone.slice(-4) : rawPhone
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
    status: order.status,
    deliveryFee: order.deliveryFee ?? 0,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    customer: {
      name: order.customer?.name || '',
      phone: maskedPhone,
      city: order.customer?.city || '',
      state: order.customer?.state || '',
      pincode: order.customer?.pincode ? '•••' + String(order.customer.pincode).slice(-3) : '',
    },
    deliveredAt: order.deliveredAt || null,
    statusTimestamps: order.statusTimestamps || null,
    tracking: order.tracking
      ? {
          courier: order.tracking.courier || '',
          number: order.tracking.number || '',
          url: order.tracking.url || '',
          eta: order.tracking.eta || '',
          currentLocation: order.tracking.currentLocation || '',
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

  if (!dbConfigured) return NextResponse.json({ orders: [], count: 0 })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ orders: [], count: 0 })

  const rawPhone = (searchParams.get('phone') || '').trim()
  const rawOrderId = (searchParams.get('orderId') || '').trim()
  const rawQuery = (searchParams.get('q') || searchParams.get('query') || '').trim()

  let phone = rawPhone
  let orderId = rawOrderId

  if (rawQuery) {
    const digitsOnly = rawQuery.replace(/[^0-9]/g, '')
    if (digitsOnly.length >= 10 && digitsOnly.length <= 12) {
      phone = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly
    } else {
      orderId = rawQuery
    }
  }

  // Normalize phone if supplied
  if (phone) {
    const digits = phone.replace(/[^0-9]/g, '')
    phone = digits.length > 10 ? digits.slice(-10) : digits
  }

  // ── Auth: resolve the current user (if any) ───────────────────
  const user = await getUser()

  // ══════════════════════════════════════════════════════════════
  // 1. HOST / ADMIN — full access to all orders with optional filters
  // ══════════════════════════════════════════════════════════════
  if (user && user.role === 'host') {
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
    return NextResponse.json({ orders, count: orders.length })
  }

  // Helper to determine customer ownership projection
  const projectOrder = (doc) => {
    if (!doc) return null
    if (user && (
      (user.id && doc.userId && String(doc.userId) === String(user.id)) ||
      (user.email && doc.customerEmail && doc.customerEmail.toLowerCase() === user.email.toLowerCase())
    )) {
      return customerSafe(doc)
    }
    return trackSafe(doc)
  }

  // ══════════════════════════════════════════════════════════════
  // 2. TRACK ORDER BY PHONE NUMBER
  // ══════════════════════════════════════════════════════════════
  if (phone) {
    if (!/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number', orders: [], count: 0 },
        { status: 400 }
      )
    }

    // Security requirement: users must be signed in to access orders by phone
    if (!user) {
      return NextResponse.json(
        {
          error: 'Please sign in to your account to view order details for this mobile number.',
          requiresAuth: true,
          orders: [],
          count: 0,
        },
        { status: 401 }
      )
    }

    // If customer is signed in, ensure the queried phone matches their verified account's phone
    if (user.role !== 'host') {
      const userDigits = user.phone ? user.phone.replace(/[^0-9]/g, '').slice(-10) : ''
      if (userDigits && userDigits !== phone) {
        return NextResponse.json(
          {
            error: `Security Verification: You are signed in as ${user.email}. You can only look up orders registered under your verified phone number (+91 ${user.phone}).`,
            orders: [],
            count: 0,
          },
          { status: 403 }
        )
      }
    }

    const docs = await Order.find({ 'customer.phone': phone })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const projected = docs.map(projectOrder)
    return NextResponse.json({
      orders: projected,
      count: projected.length,
      number: phone,
    })
  }

  // ══════════════════════════════════════════════════════════════
  // 3. TRACK ORDER BY ORDER ID
  // ══════════════════════════════════════════════════════════════
  if (orderId) {
    const doc = await Order.findOne({ orderId: orderId.toUpperCase() }).lean()
    if (!doc) {
      return NextResponse.json({ orders: [], count: 0, orderId })
    }
    const projected = [projectOrder(doc)]
    return NextResponse.json({
      orders: projected,
      count: 1,
      orderId: doc.orderId,
    })
  }

  // ══════════════════════════════════════════════════════════════
  // 4. CUSTOMER ORDER HISTORY (Requires logged in user)
  // ══════════════════════════════════════════════════════════════
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = (user.email || '').toLowerCase()
  const query = email
    ? { $or: [{ userId: user.id || undefined }, { customerEmail: email }] }
    : {}
  if (!email && !user.id) return NextResponse.json({ orders: [], count: 0 })

  const docs = await Order.find(query).sort({ createdAt: -1 }).limit(100).lean()
  return NextResponse.json({ orders: docs.map(customerSafe), count: docs.length })
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
      const qty = Math.max(1, Math.min(Number(i.qty) || 1, 20))
      if (p) {
        if (typeof p.stock === 'number' && p.stock < qty) {
          throw new Error(`Only ${p.stock} left of "${p.name}"`)
        }
        orderItems.push({
          productId: p._id,
          name: p.name,
          image: p.image || '',
          size: String(i.size || 'Free Size'),
          qty,
          price: p.price,
          mrp: p.mrp || p.price,
        })
        subtotal += p.price * qty
      } else if (i.name && Number(i.price) > 0) {
        orderItems.push({
          productId: mongoose.Types.ObjectId.isValid(i.id) ? i.id : new mongoose.Types.ObjectId(),
          name: String(i.name),
          image: String(i.image || ''),
          size: String(i.size || 'Free Size'),
          qty,
          price: Number(i.price),
          mrp: Number(i.mrp) || Number(i.price),
        })
        subtotal += Number(i.price) * qty
      } else {
        throw new Error(`Product not found: ${i.id}`)
      }
    }

    const settings = await getSettings()
    const freeDelivery = subtotal >= Number(settings.freeDeliveryAbove || 0)
    const deliveryFee = freeDelivery ? 0 : Number(settings.deliveryFee ?? 49)
    const rawTotal = subtotal + deliveryFee

    // ── Coupon re-validation (backend authority) ──────────────
    let couponCode = ''
    let couponDiscount = 0
    let percentage = 0
    let discountAmount = 0
    if (couponCodeRaw) {
      const now = new Date()
      const coupon = await Coupon.findOne({ code: couponCodeRaw, isActive: true }).lean()
      if (!coupon) {
        throw new Error('The applied coupon is invalid or inactive')
      }
      if (coupon.startsAt && new Date(coupon.startsAt) > now) {
        throw new Error('The applied coupon has not started yet')
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        throw new Error('The applied coupon has expired')
      }
      couponCode = coupon.code
      percentage = Number(coupon.percentage || coupon.discountPercent || 0)
      couponDiscount = percentage
      // Discount applies to the product price in the order (percentage of subtotal), rounded to 2 decimals
      discountAmount = Math.min(
        Math.round(((subtotal * percentage) / 100) * 100) / 100,
        subtotal
      )
    }

    const amount = Math.max(0, Math.round((subtotal + deliveryFee - discountAmount) * 100) / 100)

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
      percentage,
      discountAmount,
      utr: method === 'upi' ? utr : '',
      upiId: method === 'upi' ? settings.upiId || '' : '',
      status: 'pending',
    })

    await Promise.all(
      orderItems.map((i) => Product.findByIdAndUpdate(i.productId, { $inc: { stock: -i.qty } }))
    )

    // Clear the authenticated user's database cart upon placing the order
    try {
      await Cart.findOneAndUpdate(
        {
          $or: [
            { userId: String(dbUser.id || dbUser.email) },
            { userEmail: String(dbUser.email || '').toLowerCase() },
          ],
        },
        { $set: { items: [] } }
      )
    } catch {
      // Non-fatal
    }

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

    // Automated order confirmation notification (asynchronous, non-blocking)
    dispatchOrderNotification(order, 'order_placed', { storeName: settings.storeName }).catch((err) => {
      console.error('[Notification Trigger] Failed to send order_placed notification:', err.message)
    })

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
