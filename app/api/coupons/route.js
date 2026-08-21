import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { Coupon } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'

/* ── GET /api/coupons — host: list all coupons ── */
export async function GET() {
  try {
    await requireAdmin()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
  if (!dbConfigured) return NextResponse.json({ coupons: [] })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ coupons: [] })
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ coupons })
}

/* ── POST /api/coupons — host: create coupon ── */
export async function POST(request) {
  try {
    await requireAdmin()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
  if (!dbConfigured) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ error: 'Database not reachable' }, { status: 503 })

  try {
    const { code, discountPercent, isActive } = await request.json()
    if (!code || !String(code).trim()) return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    const pct = Number(discountPercent)
    if (!pct || pct < 1 || pct > 100) return NextResponse.json({ error: 'Discount must be 1–100%' }, { status: 400 })

    const clean = String(code).trim().toUpperCase().replace(/\s+/g, '')
    if (!/^[A-Z0-9]+$/.test(clean)) {
      return NextResponse.json({ error: 'Coupon code may only contain letters and numbers' }, { status: 400 })
    }

    const coupon = await Coupon.create({ code: clean, discountPercent: pct, isActive: isActive !== false })
    return NextResponse.json({ ok: true, coupon }, { status: 201 })
  } catch (err) {
    if (err.code === 11000) return NextResponse.json({ error: 'This coupon code already exists' }, { status: 409 })
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

/* ── PATCH /api/coupons — host: toggle active ── */
export async function PATCH(request) {
  try {
    await requireAdmin()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
  if (!dbConfigured) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ error: 'Database not reachable' }, { status: 503 })
  const { id, isActive } = await request.json()
  await Coupon.findByIdAndUpdate(id, { isActive })
  return NextResponse.json({ ok: true })
}

/* ── DELETE /api/coupons — host: delete coupon ── */
export async function DELETE(request) {
  try {
    await requireAdmin()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
  if (!dbConfigured) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ error: 'Database not reachable' }, { status: 503 })
  const { id } = await request.json()
  await Coupon.findByIdAndDelete(id)
  return NextResponse.json({ ok: true })
}
