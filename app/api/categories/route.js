import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/data'
import { connectDb, dbConfigured } from '@/lib/db'
import { Category } from '@/lib/models'
import { getUser } from '@/lib/auth'

export async function GET() {
  const categories = await getCategories()
  return NextResponse.json({ categories })
}

export async function POST(request) {
  if (!dbConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  const conn = await connectDb()
  if (!conn) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
  }

  // Role protection: host only
  const user = await getUser()
  if (!user || user.role !== 'host') {
    return NextResponse.json({ error: 'Unauthorized: host login required' }, { status: 403 })
  }

  try {
    const data = await request.json()
    const name = String(data.name || data.label || '').trim()
    const image = String(data.image || '').trim()
    const sub = String(data.sub || data.description || 'Collection').trim()
    const order = Number(data.order) || 0

    if (!name || name.length < 2 || name.length > 50) {
      return NextResponse.json({ error: 'Category name must be between 2 and 50 characters' }, { status: 400 })
    }
    if (!image) {
      return NextResponse.json({ error: 'Category image is required' }, { status: 400 })
    }

    // Generate clean slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (!slug) {
      return NextResponse.json({ error: 'Invalid category name for slug generation' }, { status: 400 })
    }

    // Block duplicate category names (case-insensitive) and slugs
    const existing = await Category.findOne({
      $or: [
        { slug },
        { label: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
      ],
    })

    if (existing) {
      return NextResponse.json({ error: `A category named "${existing.label}" already exists` }, { status: 400 })
    }

    const created = await Category.create({
      slug,
      label: name,
      image,
      sub,
      order,
      isActive: true,
    })

    return NextResponse.json({
      ok: true,
      category: {
        _id: String(created._id),
        slug: created.slug,
        label: created.label,
        image: created.image,
        sub: created.sub,
        order: created.order,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to create category' }, { status: 500 })
  }
}
