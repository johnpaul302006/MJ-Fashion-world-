import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { Order, ReturnRequest } from '@/lib/models'
import { getUser } from '@/lib/auth'

export async function GET(request) {
  if (!dbConfigured) return NextResponse.json({ requests: [] })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ requests: [] })

  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to view return requests' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const orderId = (searchParams.get('orderId') || '').trim().toUpperCase()
  const status = (searchParams.get('status') || '').trim().toLowerCase()

  // Host access: can view all requests
  if (user.role === 'host') {
    const query = {}
    if (orderId) query.orderId = orderId
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      query.status = status
    }
    const requests = await ReturnRequest.find(query).sort({ createdAt: -1 }).limit(200).lean()
    return NextResponse.json({ requests })
  }

  // Customer access: only requests matching their user ID, email, or verified phone
  const userConditions = []
  if (user.id) userConditions.push({ userId: user.id })
  if (user.email) userConditions.push({ customerEmail: user.email.toLowerCase() })
  if (user.phone) userConditions.push({ customerPhone: user.phone.replace(/[^0-9]/g, '').slice(-10) })

  const query = userConditions.length > 0 ? { $or: userConditions } : { customerEmail: user.email }
  if (orderId) query.orderId = orderId

  const requests = await ReturnRequest.find(query).sort({ createdAt: -1 }).limit(100).lean()
  return NextResponse.json({ requests })
}

export async function POST(request) {
  if (!dbConfigured) {
    return NextResponse.json({ error: 'Database not configured yet' }, { status: 503 })
  }
  const conn = await connectDb()
  if (!conn) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to request a return or exchange' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { orderId, product, type, reason, exchangeDetails, photos, declaration, feedback } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }
    if (!product || !product.name || !product.price) {
      return NextResponse.json({ error: 'Product details are required' }, { status: 400 })
    }
    if (!type || !['return', 'exchange'].includes(type)) {
      return NextResponse.json({ error: 'Select either Return or Exchange' }, { status: 400 })
    }
    if (!reason || !reason.code) {
      return NextResponse.json({ error: 'Please select a reason for your request' }, { status: 400 })
    }
    if (!declaration) {
      return NextResponse.json(
        { error: 'You must confirm the declaration that the item is unworn and in original condition' },
        { status: 400 }
      )
    }

    // Verify order exists and belongs to this user
    const order = await Order.findOne({ orderId: orderId.toUpperCase() })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const isHost = user.role === 'host'
    const ownsOrder =
      isHost ||
      (user.id && order.userId && String(order.userId) === String(user.id)) ||
      (user.email && order.customerEmail && order.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
      (user.phone && order.customer?.phone && user.phone.replace(/[^0-9]/g, '').slice(-10) === order.customer.phone.replace(/[^0-9]/g, '').slice(-10))

    if (!ownsOrder) {
      return NextResponse.json({ error: 'Unauthorized to request return for this order' }, { status: 403 })
    }

    // Check delivery status
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Return or exchange can only be requested after the order has been delivered' },
        { status: 400 }
      )
    }

    // Check 7-day return window from delivery date
    const deliveryTimestamp = order.deliveredAt || order.statusTimestamps?.delivered || order.updatedAt || order.createdAt
    if (deliveryTimestamp) {
      const deliveredTime = new Date(deliveryTimestamp).getTime()
      const now = Date.now()
      const diffDays = (now - deliveredTime) / (1000 * 60 * 60 * 24)
      if (diffDays > 7) {
        return NextResponse.json(
          { error: 'The 7-day return/exchange window for this item has expired' },
          { status: 400 }
        )
      }
    }

    // Check for duplicate pending/accepted request for this item
    const existing = await ReturnRequest.findOne({
      orderId: order.orderId,
      'product.name': product.name,
      status: { $in: ['pending', 'accepted'] },
    })
    if (existing) {
      return NextResponse.json(
        { error: `A ${existing.type} request is already active for this product (ID: ${existing.requestId})` },
        { status: 409 }
      )
    }

    // Generate unique Request ID
    const requestId = 'RET-' + Math.random().toString(36).substring(2, 8).toUpperCase()

    const created = await ReturnRequest.create({
      requestId,
      orderId: order.orderId,
      orderDocId: order._id,
      userId: user.id || null,
      customerName: user.name || order.customer?.name || 'Customer',
      customerPhone: order.customer?.phone || user.phone || '',
      customerEmail: user.email || order.customerEmail || '',
      product: {
        productId: product.productId || null,
        name: String(product.name),
        image: String(product.image || ''),
        size: String(product.size || ''),
        price: Number(product.price) || 0,
        qty: Number(product.qty) || 1,
      },
      type,
      reason: {
        code: String(reason.code),
        text: String(reason.text || ''),
      },
      exchangeDetails: {
        newSize: String(exchangeDetails?.newSize || ''),
        newColor: String(exchangeDetails?.newColor || ''),
      },
      photos: Array.isArray(photos) ? photos.slice(0, 3) : [],
      declaration: true,
      feedback: {
        rating: Math.min(5, Math.max(1, Number(feedback?.rating) || 5)),
        comments: String(feedback?.comments || ''),
      },
      status: 'pending',
    })

    return NextResponse.json({ ok: true, request: created }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to submit return request' }, { status: 500 })
  }
}
