import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { Coupon } from '@/lib/models'
import { requireAdmin, isAdmin } from '@/lib/auth'

/* ── GET /api/coupons — list coupons (active for public, all for admin) ── */
export async function GET() {
  if (!dbConfigured) return NextResponse.json({ coupons: [] })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ coupons: [] })

  const admin = await isAdmin()
  if (admin) {
    const raw = await Coupon.find({}).sort({ createdAt: -1 }).lean()
    const coupons = raw.map((c) => ({
      _id: String(c._id),
      code: c.code,
      percentage: c.percentage || c.discountPercent || 0,
      discountPercent: c.discountPercent || c.percentage || 0,
      startsAt: c.startsAt || c.createdAt || new Date(),
      expiresAt: c.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: c.createdAt,
      createdBy: c.createdBy || 'sjohnpaul638@gmail.com',
      isActive: c.isActive !== false,
    }))
    return NextResponse.json({ coupons })
  }

  // Customer / public view: currently valid or upcoming coupons only
  const now = new Date()
  const raw = await Coupon.find({
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: now } },
    ],
  })
    .sort({ percentage: -1, discountPercent: -1 })
    .lean()

  const coupons = raw.map((c) => ({
    _id: String(c._id),
    code: c.code,
    percentage: c.percentage || c.discountPercent || 0,
    discountPercent: c.discountPercent || c.percentage || 0,
    startsAt: c.startsAt || c.createdAt || now,
    expiresAt: c.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isUpcoming: c.startsAt ? new Date(c.startsAt) > now : false,
    isValid: c.startsAt ? new Date(c.startsAt) <= now : true,
  }))

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
    const body = await request.json()
    const rawCode = String(body.code || '').trim()
    const clean = rawCode.toUpperCase()

    // 1. Code validation
    if (!clean) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }
    if (clean.length < 4 || clean.length > 20) {
      return NextResponse.json({ error: 'Coupon code must be between 4 and 20 characters' }, { status: 400 })
    }
    if (!/^[A-Z0-9-]+$/.test(clean)) {
      return NextResponse.json({ error: 'Coupon code may only contain uppercase letters, numbers, and hyphens' }, { status: 400 })
    }

    // 2. Percentage validation (1 to 90)
    const pct = Number(body.percentage ?? body.discountPercent)
    if (isNaN(pct) || pct < 1 || pct > 90) {
      return NextResponse.json({ error: 'Discount percentage must be between 1% and 90%' }, { status: 400 })
    }

    // 3. Dates validation
    const start = body.startsAt ? new Date(body.startsAt) : new Date()
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: 'Invalid start date and time' }, { status: 400 })
    }

    if (!body.expiresAt) {
      return NextResponse.json({ error: 'Expiry date and time is required' }, { status: 400 })
    }
    const expiry = new Date(body.expiresAt)
    if (isNaN(expiry.getTime())) {
      return NextResponse.json({ error: 'Invalid expiry date and time' }, { status: 400 })
    }
    if (expiry <= start) {
      return NextResponse.json({ error: 'Expiry date and time must be after the start date' }, { status: 400 })
    }

    // 4. Unique check
    const existing = await Coupon.findOne({ code: clean })
    if (existing) {
      return NextResponse.json({ error: 'This coupon code already exists. Please choose a unique code.' }, { status: 409 })
    }

    const coupon = await Coupon.create({
      code: clean,
      percentage: pct,
      discountPercent: pct,
      startsAt: start,
      expiresAt: expiry,
      createdBy: 'sjohnpaul638@gmail.com',
      isActive: body.isActive !== false,
    })

    return NextResponse.json({ ok: true, coupon }, { status: 201 })
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'This coupon code already exists. Please choose a unique code.' }, { status: 409 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

/* ── PATCH /api/coupons — host: update or toggle active ── */
export async function PATCH(request) {
  try {
    await requireAdmin()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
  if (!dbConfigured) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ error: 'Database not reachable' }, { status: 503 })

  try {
    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 })

    const update = {}

    if (body.isActive !== undefined) {
      update.isActive = Boolean(body.isActive)
    }

    if (body.code !== undefined) {
      const clean = String(body.code).trim().toUpperCase()
      if (clean.length < 4 || clean.length > 20 || !/^[A-Z0-9-]+$/.test(clean)) {
        return NextResponse.json({ error: 'Code must be 4–20 characters (letters, numbers, hyphens)' }, { status: 400 })
      }
      const existing = await Coupon.findOne({ code: clean, _id: { $ne: id } })
      if (existing) {
        return NextResponse.json({ error: 'Another coupon with this code already exists' }, { status: 409 })
      }
      update.code = clean
    }

    if (body.percentage !== undefined || body.discountPercent !== undefined) {
      const pct = Number(body.percentage ?? body.discountPercent)
      if (isNaN(pct) || pct < 1 || pct > 90) {
        return NextResponse.json({ error: 'Discount must be between 1% and 90%' }, { status: 400 })
      }
      update.percentage = pct
      update.discountPercent = pct
    }

    if (body.startsAt !== undefined) {
      const start = new Date(body.startsAt)
      if (isNaN(start.getTime())) return NextResponse.json({ error: 'Invalid start date' }, { status: 400 })
      update.startsAt = start
    }

    if (body.expiresAt !== undefined) {
      const expiry = new Date(body.expiresAt)
      if (isNaN(expiry.getTime())) return NextResponse.json({ error: 'Invalid expiry date' }, { status: 400 })
      update.expiresAt = expiry
    }

    const updated = await Coupon.findByIdAndUpdate(id, update, { new: true })
    if (!updated) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })

    return NextResponse.json({ ok: true, coupon: updated })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
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

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 })
    await Coupon.findByIdAndDelete(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
