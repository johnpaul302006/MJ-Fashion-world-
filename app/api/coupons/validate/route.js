import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { Coupon } from '@/lib/models'
import { getUser } from '@/lib/auth'

/**
 * POST /api/coupons/validate
 * Body: { code: string, cartTotal: number }
 * Returns: { discountPercent, discountAmount, finalAmount, code }
 *
 * This is the AUTHORITATIVE discount calculator.
 * The checkout page shows these values; the orders POST re-validates independently.
 */
export async function POST(request) {
  // Must be logged in
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to apply a coupon' }, { status: 401 })

  const { code, cartTotal } = await request.json()

  if (!code || !String(code).trim()) {
    return NextResponse.json({ error: 'Please enter a coupon code' }, { status: 400 })
  }

  const total = Number(cartTotal)
  if (!total || total <= 0) {
    return NextResponse.json({ error: 'Invalid cart total' }, { status: 400 })
  }

  if (!dbConfigured) return NextResponse.json({ error: 'Store database not ready' }, { status: 503 })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ error: 'Database not reachable' }, { status: 503 })

  const clean = String(code).trim().toUpperCase()
  const coupon = await Coupon.findOne({ code: clean }).lean()

  if (!coupon) {
    return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 404 })
  }
  if (!coupon.isActive) {
    return NextResponse.json({ error: 'This coupon has been deactivated' }, { status: 400 })
  }

  const discountPercent = coupon.discountPercent
  // Round down to nearest rupee; never allow negative final price
  const discountAmount = Math.min(Math.floor((total * discountPercent) / 100), total)
  const finalAmount = Math.max(0, total - discountAmount)

  return NextResponse.json({ ok: true, code: clean, discountPercent, discountAmount, finalAmount })
}
