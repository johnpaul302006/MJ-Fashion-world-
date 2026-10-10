import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/data'
import { connectDb, dbConfigured } from '@/lib/db'
import { Product } from '@/lib/models'
import { requireAdmin, getUser } from '@/lib/auth'
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
    newArrivals: searchParams.get('newArrivals') === '1' || searchParams.get('newArrivals') === 'true',
    limit: Number(searchParams.get('limit')) || undefined,
  }
  const products = await getProducts(filters)
  return NextResponse.json({ products })
}

export async function POST(request) {
  try {
    const user = await getUser()
    const hostEmail = (process.env.HOST_EMAIL || 'sjohnpaul638@gmail.com').toLowerCase()
    if (!user || user.role !== 'host' || (user.email && user.email.toLowerCase() !== hostEmail)) {
      await requireAdmin()
    }
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized: Only the host account (sjohnpaul638@gmail.com) can manage products' }, { status: 401 })
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

    const isNew = Boolean(data.isNewArrival)
    const images = Array.isArray(data.images) && data.images.length > 0
      ? data.images.map(String).filter(Boolean)
      : data.image
      ? [String(data.image)]
      : []

    const product = await Product.create({
      name: String(data.name || '').trim(),
      category: String(data.category || 'men'),
      brand: String(data.brand || '').trim(),
      tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      price: Number(data.price) || 0,
      mrp: Number(data.mrp) || Number(data.price) || 0,
      stock: Number(data.stock) >= 0 ? Number(data.stock) : 0,
      sizes: Array.isArray(data.sizes) ? data.sizes.map(String) : [],
      colors: Array.isArray(data.colors) ? data.colors.map(String) : [],
      image: String(data.image || images[0] || ''),
      images,
      description: String(data.description || ''),
      featured: Boolean(data.featured),
      isNewArrival: isNew,
      newArrivalAt: isNew ? new Date() : null,
    })
    return NextResponse.json({ ok: true, product: product.toObject() }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}