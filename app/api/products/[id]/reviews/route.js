import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDb, dbConfigured } from '@/lib/db'
import { Review, Product, Order } from '@/lib/models'
import { getUser } from '@/lib/auth'

// GET /api/products/[id]/reviews — fetch all reviews for a product + average rating + canReview flag
export async function GET(_request, { params }) {
  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ reviews: [], avg: 0, count: 0, canReview: false })
  }
  if (!dbConfigured) return NextResponse.json({ reviews: [], avg: 0, count: 0, canReview: false })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ reviews: [], avg: 0, count: 0, canReview: false })

  try {
    const reviews = await Review.find({ productId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    const count = reviews.length
    const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0

    const user = await getUser()

    let canReview = false
    if (user?.id) {
      if (user.role === 'host') {
        canReview = true
      } else {
        const userConditions = [{ userId: user.id }]
        if (user.email) userConditions.push({ customerEmail: user.email.toLowerCase() })
        if (user.phone) userConditions.push({ 'customer.phone': user.phone })

        const hasDelivered = await Order.exists({
          $or: userConditions,
          status: 'delivered',
          'items.productId': id,
        })
        canReview = Boolean(hasDelivered)
      }
    }

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        _id: String(r._id),
        productId: String(r.productId),
        userId: String(r.userId),
        userName: r.userName,
        rating: r.rating,
        feedback: r.feedback,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
        isOwn: user?.id ? String(r.userId) === user.id : false,
      })),
      avg: Math.round(avg * 100) / 100,
      count,
      canReview,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/products/[id]/reviews — create or update a review (verified buyers only)
export async function POST(request, { params }) {
  const { id } = await params

  // Auth check
  const user = await getUser()
  if (!user || !user.id) {
    return NextResponse.json({ error: 'Please log in to submit a review' }, { status: 401 })
  }

  // Validate product ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
  }
  if (!dbConfigured) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }
  const conn = await connectDb()
  if (!conn) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }

  // Verify product exists
  const productExists = await Product.exists({ _id: id })
  if (!productExists) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Security check: Only verified customers who have a delivered order containing this product can review
  if (user.role !== 'host') {
    const userConditions = [{ userId: user.id }]
    if (user.email) userConditions.push({ customerEmail: user.email.toLowerCase() })
    if (user.phone) userConditions.push({ 'customer.phone': user.phone })

    const hasDelivered = await Order.exists({
      $or: userConditions,
      status: 'delivered',
      'items.productId': id,
    })

    if (!hasDelivered) {
      return NextResponse.json(
        { error: 'Only verified customers who have received this product (delivered order) can submit a review.' },
        { status: 403 }
      )
    }
  }

  // Parse and validate body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const rating = Number(body.rating)
  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }

  const feedback = String(body.feedback || '').trim()
  if (feedback.length > 2000) {
    return NextResponse.json({ error: 'Feedback is too long (max 2000 chars)' }, { status: 400 })
  }

  try {
    // Upsert: one user + one product = one review
    const review = await Review.findOneAndUpdate(
      { productId: id, userId: user.id },
      {
        $set: {
          rating,
          feedback,
          userName: user.name || 'Customer',
        },
        $setOnInsert: {
          productId: id,
          userId: user.id,
        },
      },
      { upsert: true, new: true, runValidators: true }
    )

    return NextResponse.json({
      ok: true,
      review: {
        _id: String(review._id),
        productId: String(review.productId),
        userId: String(review.userId),
        userName: review.userName,
        rating: review.rating,
        feedback: review.feedback,
        createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : null,
        updatedAt: review.updatedAt ? new Date(review.updatedAt).toISOString() : null,
        isOwn: true,
      },
    })
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: 'You have already reviewed this product. Your review has been updated.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
