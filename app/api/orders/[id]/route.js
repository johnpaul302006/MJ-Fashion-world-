import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { Order, Product } from '@/lib/models'
import { requireAdmin, getUser } from '@/lib/auth'
import { ORDER_STATUS, STATUS_LABEL } from '@/lib/categories'
import { createShipmentForOrder } from '@/lib/shipping'
import { dispatchOrderNotification } from '@/lib/notifications'

export async function PATCH(request, { params }) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please log in to continue' }, { status: 401 })
  }

  if (!dbConfigured) {
    return NextResponse.json({ error: 'Database not configured yet' }, { status: 503 })
  }
  try {
    const { id } = await params
    const data = await request.json()
    const conn = await connectDb()
    if (!conn) {
      return NextResponse.json({ error: 'The store database is not reachable right now' }, { status: 503 })
    }
    const order = await Order.findById(id)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const isHost = user.role === 'host'
    const ownsOrder =
      (user.id && order.userId && String(order.userId) === String(user.id)) ||
      (user.email && order.customerEmail && order.customerEmail.toLowerCase() === user.email.toLowerCase())

    if (!isHost && !ownsOrder) {
      return NextResponse.json({ error: 'Unauthorized to modify this order' }, { status: 403 })
    }

    // Customer cancellation
    if (!isHost) {
      if (data.status === 'cancelled') {
        if (order.status !== 'pending') {
          return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 })
        }
        order.status = 'cancelled'
        order.note = order.note ? `${order.note} | Cancelled by customer` : 'Cancelled by customer'
        await Promise.all(
          order.items.map((i) => i.productId && Product.findByIdAndUpdate(i.productId, { $inc: { stock: i.qty } }))
        )
        await order.save()
        dispatchOrderNotification(order, 'order_cancelled').catch((err) => {
          console.error('[Notification Trigger] Customer cancellation dispatch failed:', err.message)
        })
        return NextResponse.json({
          ok: true,
          order: {
            _id: order._id,
            orderId: order.orderId,
            status: order.status,
            note: order.note,
          },
        })
      }
      return NextResponse.json({ error: 'Customers can only cancel pending orders' }, { status: 400 })
    }

    const validStatuses = ORDER_STATUS.map((s) => s.value)
    const oldStatus = order.status

    if (typeof data.status !== 'undefined') {
      if (!validStatuses.includes(data.status)) throw new Error('Invalid status')
      if (data.status === 'rejected' && oldStatus !== 'pending') {
        throw new Error('Only pending orders can be rejected')
      }
      order.status = data.status

      if (!order.statusTimestamps) {
        order.statusTimestamps = { placed: order.createdAt || new Date() }
      }
      if (data.status === 'confirmed' && !order.statusTimestamps.confirmed) {
        order.statusTimestamps.confirmed = new Date()
      } else if (data.status === 'packed' && !order.statusTimestamps.packed) {
        order.statusTimestamps.packed = new Date()
      } else if (data.status === 'shipped' && !order.statusTimestamps.shipped) {
        order.statusTimestamps.shipped = new Date()
      } else if (data.status === 'out_for_delivery' && !order.statusTimestamps.out_for_delivery) {
        order.statusTimestamps.out_for_delivery = new Date()
      } else if (data.status === 'delivered') {
        order.statusTimestamps.delivered = order.statusTimestamps.delivered || new Date()
        order.deliveredAt = order.deliveredAt || new Date()
      }

      // Keep payment status in sync with the store owner's decision
      if (data.status === 'confirmed' && order.paymentMethod === 'upi' && order.paymentStatus !== 'paid') {
        // Manual UPI verification — the owner has matched the UTR in their bank app
        order.paymentStatus = 'paid'
        order.payment.provider = order.payment.provider || 'upi-manual'
        order.payment.paidAt = new Date()
      }
      if (data.status === 'delivered' && order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid'
        order.payment.provider = 'cod'
        order.payment.paidAt = new Date()
      }
      if (data.status === 'rejected' && order.paymentStatus === 'pending') {
        order.paymentStatus = 'failed'
      }

      // Hand over to the external courier provider when the order ships
      let shipmentError = ''
      if (data.status === 'shipped' && !order.shipment?.refId) {
        try {
          await createShipmentForOrder(order)
        } catch (err) {
          // Shipping provider issues never block the status change — the
          // owner can still enter tracking details manually.
          shipmentError = err.message
        }
      }

      if (data.status === 'rejected') {
        await Promise.all(
          order.items.map((i) => i.productId && Product.findByIdAndUpdate(i.productId, { $inc: { stock: i.qty } }))
        )
      }
    }
    if (typeof data.note !== 'undefined') order.note = String(data.note || '')
    if (typeof data.tracking !== 'undefined') {
      const t = data.tracking || {}
      if (!order.tracking) order.tracking = {}
      if (t.courier !== undefined) order.tracking.courier = String(t.courier || '')
      if (t.number !== undefined) order.tracking.number = String(t.number || '')
      if (t.url !== undefined) order.tracking.url = String(t.url || '')
      if (t.eta !== undefined) order.tracking.eta = String(t.eta || '')
      if (t.currentLocation !== undefined) order.tracking.currentLocation = String(t.currentLocation || '')
      order.tracking.updatedAt = new Date()
    }
    await order.save()

    // Send automated WhatsApp/SMS lifecycle notification (asynchronous, non-blocking)
    if (typeof data.status !== 'undefined' && data.status !== oldStatus) {
      const eventName = data.status === 'out_for_delivery' ? 'out_for_delivery' : `order_${data.status}`
      dispatchOrderNotification(order, eventName).catch((err) => {
        console.error(`[Notification Trigger] ${eventName} dispatch failed:`, err.message)
      })
    }

    return NextResponse.json({
      ok: true,
      order: {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        deliveredAt: order.deliveredAt,
        statusTimestamps: order.statusTimestamps,
        note: order.note,
        tracking: order.tracking,
        paymentStatus: order.paymentStatus,
        shipment: order.shipment,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(_request, { params }) {
  try {
    await requireAdmin()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
  if (!dbConfigured) {
    return NextResponse.json({ error: 'Database not configured yet' }, { status: 503 })
  }
  try {
    const { id } = await params
    const conn = await connectDb()
    if (!conn) {
      return NextResponse.json({ error: 'The store database is not reachable right now' }, { status: 503 })
    }
    const order = await Order.findById(id)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status === 'pending') {
      await Promise.all(
        order.items.map((i) => i.productId && Product.findByIdAndUpdate(i.productId, { $inc: { stock: i.qty } }))
      )
    }
    await Order.findByIdAndDelete(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}