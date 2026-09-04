import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDb, dbConfigured } from '@/lib/db'
import { Review } from '@/lib/models'

// GET /api/products/[id]/rating — lightweight endpoint for rating badge
export async function GET(_request, { params }) {
  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ avg: 0, count: 0 })
  }
  if (!dbConfigured) return NextResponse.json({ avg: 0, count: 0 })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ avg: 0, count: 0 })

  try {
    const result = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    const row = result[0]
    return NextResponse.json({
      avg: row ? Math.round(row.avg * 100) / 100 : 0,
      count: row ? row.count : 0,
    })
  } catch {
    return NextResponse.json({ avg: 0, count: 0 })
  }
}
