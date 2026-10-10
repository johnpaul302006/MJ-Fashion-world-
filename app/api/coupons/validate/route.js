import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { Coupon } from '@/lib/models'
import { getUser } from '@/lib/auth'

/**
 * Format date for friendly error messages (e.g. "12 Oct 2026, 06:00 PM")
 */
function formatDate(d) {
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return String(d)
  }
}

/**
 * POST /api/coupons/validate
 * Body: { code: string, cartTotal: number }
 * Returns: { ok: true, code, percentage, discountPercent, discountAmount, finalAmount }
 */
export async function POST(request) {
  // Must be logged in to apply coupon
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please log in to apply a coupon' }, { status: 401 })
  }

  const { code, cartTotal } = await request.json()

  const clean = String(code || '').trim().toUpperCase()
  if (!clean) {
    return NextResponse.json({ error: 'Please enter a coupon code' }, { status: 400 })
  }

  const total = Number(cartTotal)
  if (isNaN(total) || total <= 0) {
    return NextResponse.json({ error: 'Please add items to your bag first' }, { status: 400 })
  }

  if (!dbConfigured) {
    return NextResponse.json({ error: 'Store database not ready' }, { status: 503 })
  }
  const conn = await connectDb()
  if (!conn) {
    return NextResponse.json({ error: 'Database not reachable' }, { status: 503 })
  }

  const coupon = await Coupon.findOne({ code: clean }).lean()

  if (!coupon) {
    return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
  }

  if (!coupon.isActive) {
    return NextResponse.json({ error: 'This coupon is currently inactive' }, { status: 400 })
  }

  const now = new Date()

  // 1. Check if start date is in the future
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return NextResponse.json(
      { error: `This coupon starts on ${formatDate(coupon.startsAt)}` },
      { status: 400 }
    )
  }

  // 2. Check if expiry date has passed
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return NextResponse.json(
      { error: `This coupon expired on ${formatDate(coupon.expiresAt)}` },
      { status: 400 }
    )
  }

  const percentage = Number(coupon.percentage || coupon.discountPercent || 0)
  if (percentage <= 0 || percentage > 90) {
    return NextResponse.json({ error: 'Invalid coupon discount percentage' }, { status: 400 })
  }

  // Discount rounded to two decimals
  const discountAmount = Math.min(
    Math.round(((total * percentage) / 100) * 100) / 100,
    total
  )
  const finalAmount = Math.max(0, Math.round((total - discountAmount) * 100) / 100)

  return NextResponse.json({
    ok: true,
    code: coupon.code,
    percentage,
    discountPercent: percentage,
    discountAmount,
    finalAmount,
  })
}
