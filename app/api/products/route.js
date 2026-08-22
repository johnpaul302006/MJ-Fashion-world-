import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/data'
import { connectDb, dbConfigured } from '@/lib/db'
import { Product } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'
import { isNonImageLink } from '@/lib/img-url'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const filters = {
    category: searchParams.get('category') || undefined,
    q: searchParams.get('q') || undefined,
    size: searchParams.get('size') || undefined,
    sort: searchParams.get('sort') || undefined,
    onSale: searchParams.get('onSale') === '1' || searchParams.get('onSale') === 'true',
    featured: searchParams.get('featured') === '1' || searchParams.get('featured') === 'true',
    limit: Number(searchParams.get('limit')) || undefined,
  }
  const products = await getProducts(filters)
  return NextResponse.json({ products })
}

export async function POST(request) {
  try {
    await requireAdmin()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
  if (!dbConfigured) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }
  try {
    const conn = await connectDb()
    if (!conn) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
    }
    const data = await request.json()
    if (isNonImageLink(String(data.image || ''))) {
      return NextResponse.json(
        { error: 'That is a social media page link, not an image. Please upload the photo from your PC instead.' },
        { status: 400 }
      )
    }
    const product = await Product.create({
      name: String(data.name || '').trim(),
      category: String(data.category || 'men'),
      price: Number(data.price) || 0,
      mrp: Number(data.mrp) || Number(data.price) || 0,
      stock: Number(data.stock) >= 0 ? Number(data.stock) : 0,
      sizes: Array.isArray(data.sizes) ? data.sizes.map(String) : [],
      colors: Array.isArray(data.colors) ? data.colors.map(String) : [],
      image: String(data.image || ''),
      description: String(data.description || ''),
      featured: Boolean(data.featured),
    })
    return NextResponse.json({ ok: true, product: product.toObject() }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}