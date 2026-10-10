import { NextResponse } from 'next/server'
import { getProduct } from '@/lib/data'
import { connectDb } from '@/lib/db'
import { Product } from '@/lib/models'
import { requireAdmin, getUser } from '@/lib/auth'
import { isNonImageLink } from '@/lib/img-url'

export async function GET(_request, { params }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json({ product })
}

export async function PATCH(request, { params }) {
  try {
    const user = await getUser()
    const hostEmail = (process.env.HOST_EMAIL || 'sjohnpaul638@gmail.com').toLowerCase()
    if (!user || user.role !== 'host' || (user.email && user.email.toLowerCase() !== hostEmail)) {
      await requireAdmin()
    }
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized: Only the host account (sjohnpaul638@gmail.com) can manage products' }, { status: 401 })
  }
  try {
    const { id } = await params
    const conn = await connectDb()
    if (!conn) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
    }
    const data = await request.json()
    if (typeof data.image !== 'undefined' && isNonImageLink(String(data.image))) {
      return NextResponse.json(
        { error: 'That is a social media page link, not an image. Please upload the photo from your PC instead.' },
        { status: 400 }
      )
    }
    const allowed = ['name', 'category', 'price', 'mrp', 'stock', 'sizes', 'colors', 'image', 'images', 'description', 'featured', 'brand', 'tags', 'isNewArrival']
    const patch = {}
    for (const k of allowed) {
      if (typeof data[k] === 'undefined') continue
      if (['price', 'mrp', 'stock'].includes(k)) patch[k] = Number(data[k]) || 0
      else if (k === 'sizes' || k === 'colors' || k === 'tags' || k === 'images') patch[k] = Array.isArray(data[k]) ? data[k].map(String) : []
      else if (k === 'featured') patch[k] = Boolean(data[k])
      else if (k === 'isNewArrival') {
        patch.isNewArrival = Boolean(data.isNewArrival)
        patch.newArrivalAt = Boolean(data.isNewArrival) ? new Date() : null
      }
      else patch[k] = String(data[k])
    }
    const product = await Product.findByIdAndUpdate(id, { $set: patch }, { new: true })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ ok: true, product: product.toObject() })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await getUser()
    const hostEmail = (process.env.HOST_EMAIL || 'sjohnpaul638@gmail.com').toLowerCase()
    if (!user || user.role !== 'host' || (user.email && user.email.toLowerCase() !== hostEmail)) {
      await requireAdmin()
    }
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized: Only the host account (sjohnpaul638@gmail.com) can manage products' }, { status: 401 })
  }
  try {
    const { id } = await params
    const conn = await connectDb()
    if (!conn) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
    }
    const product = await Product.findByIdAndDelete(id)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}