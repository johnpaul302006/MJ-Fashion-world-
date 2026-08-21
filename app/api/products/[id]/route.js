import { NextResponse } from 'next/server'
import { getProduct } from '@/lib/data'
import { connectDb } from '@/lib/db'
import { Product } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'

export async function GET(_request, { params }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json({ product })
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
  try {
    const { id } = await params
    const conn = await connectDb()
    if (!conn) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
    }
    const data = await request.json()
    const allowed = ['name', 'category', 'price', 'mrp', 'stock', 'sizes', 'colors', 'image', 'description', 'featured']
    const patch = {}
    for (const k of allowed) {
      if (typeof data[k] === 'undefined') continue
      if (['price', 'mrp', 'stock'].includes(k)) patch[k] = Number(data[k]) || 0
      else if (k === 'sizes' || k === 'colors') patch[k] = Array.isArray(data[k]) ? data[k].map(String) : []
      else if (k === 'featured') patch[k] = Boolean(data[k])
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
    await requireAdmin()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
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