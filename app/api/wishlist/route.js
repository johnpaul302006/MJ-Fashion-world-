import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { Wishlist, Product } from '@/lib/models'
import { getUser } from '@/lib/auth'

export async function GET() {
  const sessionUser = await getUser()
  if (!sessionUser) {
    return NextResponse.json({ items: [] })
  }

  if (!dbConfigured) {
    return NextResponse.json({ items: [] })
  }

  try {
    const conn = await connectDb()
    if (!conn) return NextResponse.json({ items: [] })

    const userEmail = String(sessionUser.email || '').toLowerCase()
    const userId = String(sessionUser.id || userEmail)

    const doc = await Wishlist.findOne({
      $or: [
        { userId },
        ...(userEmail ? [{ userEmail }] : []),
      ],
    })

    if (!doc || !doc.items || doc.items.length === 0) {
      return NextResponse.json({ items: [] })
    }

    // Verify products still exist in the database (gracefully prune deleted ones)
    const productIds = doc.items.map((i) => i._id || i.id).filter(Boolean)
    const activeProducts = await Product.find({ _id: { $in: productIds } }).select('_id').lean()
    const activeSet = new Set(activeProducts.map((p) => String(p._id)))

    const validItems = doc.items.filter((i) => activeSet.has(String(i._id || i.id)))
    if (validItems.length !== doc.items.length) {
      doc.items = validItems
      await doc.save()
    }

    return NextResponse.json({ items: validItems })
  } catch (err) {
    return NextResponse.json({ error: err.message, items: [] }, { status: 500 })
  }
}

export async function PUT(request) {
  const sessionUser = await getUser()
  if (!sessionUser) {
    return NextResponse.json({ error: 'Please log in to save your wishlist' }, { status: 401 })
  }

  if (!dbConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const conn = await connectDb()
    if (!conn) return NextResponse.json({ error: 'Database unreachable' }, { status: 503 })

    const body = await request.json()
    const rawItems = Array.isArray(body.items) ? body.items : []

    // Ensure unique items by product id
    const seen = new Set()
    const uniqueItems = []
    for (const item of rawItems) {
      const id = String(item?._id || item?.id || '')
      if (!id || seen.has(id)) continue
      seen.add(id)
      uniqueItems.push({
        id,
        _id: id,
        name: String(item.name || ''),
        price: Math.max(0, Number(item.price) || 0),
        mrp: Math.max(0, Number(item.mrp) || 0),
        image: String(item.image || ''),
        category: String(item.category || ''),
        stock: Math.max(0, Number(item.stock) || 0),
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        colors: Array.isArray(item.colors) ? item.colors : [],
        description: String(item.description || ''),
        featured: Boolean(item.featured),
      })
    }

    // Prune deleted products
    const productIds = uniqueItems.map((i) => i.id)
    const activeProducts = await Product.find({ _id: { $in: productIds } }).select('_id').lean()
    const activeSet = new Set(activeProducts.map((p) => String(p._id)))
    const validItems = uniqueItems.filter((i) => activeSet.has(String(i.id)))

    const userEmail = String(sessionUser.email || '').toLowerCase()
    const userId = String(sessionUser.id || userEmail)

    const doc = await Wishlist.findOneAndUpdate(
      {
        $or: [
          { userId },
          ...(userEmail ? [{ userEmail }] : []),
        ],
      },
      {
        $set: {
          userId,
          userEmail,
          items: validItems,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return NextResponse.json({ ok: true, items: doc.items })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  const sessionUser = await getUser()
  if (!sessionUser) {
    return NextResponse.json({ error: 'Please log in' }, { status: 401 })
  }

  if (!dbConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const conn = await connectDb()
    if (!conn) return NextResponse.json({ error: 'Database unreachable' }, { status: 503 })

    const body = await request.json()
    const userEmail = String(sessionUser.email || '').toLowerCase()
    const userId = String(sessionUser.id || userEmail)

    let doc = await Wishlist.findOne({
      $or: [
        { userId },
        ...(userEmail ? [{ userEmail }] : []),
      ],
    })

    const currentItems = doc?.items ? [...doc.items] : []

    // If merging guest wishlist
    if (Array.isArray(body.guestItems)) {
      const existingIds = new Set(currentItems.map((i) => String(i._id || i.id)))
      for (const g of body.guestItems) {
        const id = String(g?._id || g?.id || '')
        if (id && !existingIds.has(id)) {
          existingIds.add(id)
          currentItems.unshift({
            id,
            _id: id,
            name: String(g.name || ''),
            price: Math.max(0, Number(g.price) || 0),
            mrp: Math.max(0, Number(g.mrp) || 0),
            image: String(g.image || ''),
            category: String(g.category || ''),
            stock: Math.max(0, Number(g.stock) || 0),
            sizes: Array.isArray(g.sizes) ? g.sizes : [],
            colors: Array.isArray(g.colors) ? g.colors : [],
            description: String(g.description || ''),
            featured: Boolean(g.featured),
          })
        }
      }
    } else if (body.product) {
      // Toggle single product
      const p = body.product
      const id = String(p._id || p.id || '')
      const idx = currentItems.findIndex((i) => String(i._id || i.id) === id)
      if (idx >= 0) {
        currentItems.splice(idx, 1)
      } else if (id) {
        currentItems.unshift({
          id,
          _id: id,
          name: String(p.name || ''),
          price: Math.max(0, Number(p.price) || 0),
          mrp: Math.max(0, Number(p.mrp) || 0),
          image: String(p.image || ''),
          category: String(p.category || ''),
          stock: Math.max(0, Number(p.stock) || 0),
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          colors: Array.isArray(p.colors) ? p.colors : [],
          description: String(p.description || ''),
          featured: Boolean(p.featured),
        })
      }
    }

    // Prune deleted products
    const productIds = currentItems.map((i) => i.id)
    const activeProducts = await Product.find({ _id: { $in: productIds } }).select('_id').lean()
    const activeSet = new Set(activeProducts.map((p) => String(p._id)))
    const validItems = currentItems.filter((i) => activeSet.has(String(i.id)))

    doc = await Wishlist.findOneAndUpdate(
      {
        $or: [
          { userId },
          ...(userEmail ? [{ userEmail }] : []),
        ],
      },
      {
        $set: {
          userId,
          userEmail,
          items: validItems,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return NextResponse.json({ ok: true, items: doc.items })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  const sessionUser = await getUser()
  if (!sessionUser) {
    return NextResponse.json({ error: 'Please log in' }, { status: 401 })
  }

  if (!dbConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const conn = await connectDb()
    if (!conn) return NextResponse.json({ error: 'Database unreachable' }, { status: 503 })

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    const userEmail = String(sessionUser.email || '').toLowerCase()
    const userId = String(sessionUser.id || userEmail)

    let update = { $set: { items: [] } }
    if (itemId) {
      update = {
        $pull: {
          items: {
            $or: [{ id: itemId }, { _id: itemId }],
          },
        },
      }
    }

    const doc = await Wishlist.findOneAndUpdate(
      {
        $or: [
          { userId },
          ...(userEmail ? [{ userEmail }] : []),
        ],
      },
      update,
      { new: true }
    )

    return NextResponse.json({ ok: true, items: doc?.items || [] })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
