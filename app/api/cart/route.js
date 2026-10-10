import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { Cart, Product } from '@/lib/models'
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

    const doc = await Cart.findOne({
      $or: [
        { userId },
        ...(userEmail ? [{ userEmail }] : []),
      ],
    })

    if (!doc || !doc.items || doc.items.length === 0) {
      return NextResponse.json({ items: [] })
    }

    // Verify products still exist in the database (gracefully prune deleted ones)
    const productIds = doc.items.map((i) => i.id).filter(Boolean)
    const activeProducts = await Product.find({ _id: { $in: productIds } }).select('_id').lean()
    const activeSet = new Set(activeProducts.map((p) => String(p._id)))

    const validItems = doc.items.filter((i) => activeSet.has(String(i.id)))
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
    return NextResponse.json({ error: 'Please log in to save your bag' }, { status: 401 })
  }

  if (!dbConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const conn = await connectDb()
    if (!conn) return NextResponse.json({ error: 'Database unreachable' }, { status: 503 })

    const body = await request.json()
    const rawItems = Array.isArray(body.items) ? body.items : []

    // Consolidate duplicate variants (same id and same size)
    const itemMap = new Map()
    for (const item of rawItems) {
      if (!item || !item.id) continue
      const size = String(item.size || 'Free Size').trim()
      const key = `${item.id}:${size}`
      const qty = Math.max(1, Number(item.qty) || 1)

      if (itemMap.has(key)) {
        itemMap.get(key).qty += qty
      } else {
        itemMap.set(key, {
          id: String(item.id),
          name: String(item.name || ''),
          image: String(item.image || ''),
          price: Math.max(0, Number(item.price) || 0),
          mrp: Math.max(0, Number(item.mrp) || 0),
          size,
          qty,
        })
      }
    }

    const items = Array.from(itemMap.values())

    // Prune deleted products
    const productIds = items.map((i) => i.id).filter(Boolean)
    const activeProducts = await Product.find({ _id: { $in: productIds } }).select('_id').lean()
    const activeSet = new Set(activeProducts.map((p) => String(p._id)))
    const validItems = items.filter((i) => activeSet.has(String(i.id)))

    const userEmail = String(sessionUser.email || '').toLowerCase()
    const userId = String(sessionUser.id || userEmail)

    const doc = await Cart.findOneAndUpdate(
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

// Merge guest bag into authenticated user's bag
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
    const guestItems = Array.isArray(body.guestItems) ? body.guestItems : []

    const userEmail = String(sessionUser.email || '').toLowerCase()
    const userId = String(sessionUser.id || userEmail)

    let doc = await Cart.findOne({
      $or: [
        { userId },
        ...(userEmail ? [{ userEmail }] : []),
      ],
    })

    const currentItems = doc?.items ? [...doc.items] : []
    const itemMap = new Map()

    for (const item of currentItems) {
      const key = `${item.id}:${item.size}`
      itemMap.set(key, { ...item.toObject?.() || item })
    }

    // Merge guest items without overwriting existing items (increment or add)
    for (const g of guestItems) {
      if (!g || !g.id) continue
      const size = String(g.size || 'Free Size').trim()
      const key = `${g.id}:${size}`
      const qty = Math.max(1, Number(g.qty) || 1)

      if (itemMap.has(key)) {
        itemMap.get(key).qty += qty
      } else {
        itemMap.set(key, {
          id: String(g.id),
          name: String(g.name || ''),
          image: String(g.image || ''),
          price: Math.max(0, Number(g.price) || 0),
          mrp: Math.max(0, Number(g.mrp) || 0),
          size,
          qty,
        })
      }
    }

    const items = Array.from(itemMap.values())

    // Prune deleted products
    const productIds = items.map((i) => i.id).filter(Boolean)
    const activeProducts = await Product.find({ _id: { $in: productIds } }).select('_id').lean()
    const activeSet = new Set(activeProducts.map((p) => String(p._id)))
    const validItems = items.filter((i) => activeSet.has(String(i.id)))

    doc = await Cart.findOneAndUpdate(
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
    const size = searchParams.get('size')

    const userEmail = String(sessionUser.email || '').toLowerCase()
    const userId = String(sessionUser.id || userEmail)

    let update = { $set: { items: [] } }
    if (itemId) {
      update = {
        $pull: {
          items: size ? { id: itemId, size } : { id: itemId },
        },
      }
    }

    const doc = await Cart.findOneAndUpdate(
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
