import mongoose from 'mongoose'
import { connectDb, dbConfigured } from './db'
import { Product, Order, Settings } from './models'
import { DEMO_SETTINGS, DEMO_PRODUCTS } from './demo'
import { discountPct } from './format'

// Convert mongoose documents into plain, serializable objects
// so they can be passed safely from Server to Client Components.
function plain(doc) {
  if (!doc) return doc
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc
  return {
    ...obj,
    _id: String(obj._id),
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : obj.createdAt,
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : obj.updatedAt,
    items: Array.isArray(obj.items) ? obj.items : obj.items,
  }
}

export async function getSettings() {
  if (!dbConfigured) return DEMO_SETTINGS
  const conn = await connectDb()
  if (!conn) return DEMO_SETTINGS
  try {
    let s = await Settings.findOne({ key: 'main' })
    if (!s) {
      s = await Settings.create({ key: 'main' })
    }
    return plain(s)
  } catch (err) {
    console.error('getSettings error:', err.message)
    return DEMO_SETTINGS
  }
}

export async function saveSettings(data) {
  if (!dbConfigured) {
    const err = new Error('database_not_configured')
    err.status = 503
    throw err
  }
  const conn = await connectDb()
  if (!conn) {
    const err = new Error('database_not_configured')
    err.status = 503
    throw err
  }
  const allowed = [
    'storeName',
    'tagline',
    'announcement',
    'upiId',
    'qrImageUrl',
    'phone',
    'address',
    'deliveryFee',
    'freeDeliveryAbove',
    'heroImageUrl',
    'codEnabled',
    'offers',
    'announcements',
  ]
  const patch = {}
  for (const k of allowed) if (typeof data[k] !== 'undefined') patch[k] = data[k]
  let s = await Settings.findOne({ key: 'main' })
  if (!s) s = new Settings({ key: 'main' })
  for (const k of Object.keys(patch)) s[k] = patch[k]
  await s.save()
  return s.toObject()
}

export async function getProducts(filters = {}) {
  if (!dbConfigured) return filterDemoProducts(filters)
  const conn = await connectDb()
  if (!conn) return filterDemoProducts(filters)

  const { category, q, size, sort, onSale, featured, ids, limit } = filters
  const query = {}
  if (category) query.category = category
  if (featured) query.featured = true
  if (ids && Array.isArray(ids) && ids.length) {
    const valid = ids
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id))
    if (valid.length) query._id = { $in: valid }
  }
  if (q) query.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  if (size && size !== 'all') query.sizes = size

  let list = await Product.find(query).sort({ createdAt: -1 }).limit(limit || 200).lean()

  if (onSale) list = list.filter((p) => p.price < p.mrp)

  if (sort === 'priceLow') list.sort((a, b) => a.price - b.price)
  else if (sort === 'priceHigh') list.sort((a, b) => b.price - a.price)
  else if (sort === 'discount') list.sort((a, b) => discountPct(b.price, b.mrp) - discountPct(a.price, a.mrp))

  return list.map((p) => plain(p))
}

function filterDemoProducts({ category, q, size, sort, onSale, featured, limit }) {
  let list = DEMO_PRODUCTS.slice()
  if (category) list = list.filter((p) => p.category === category)
  if (featured) list = list.filter((p) => p.featured)
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
  if (size && size !== 'all') list = list.filter((p) => (p.sizes || []).includes(size))
  if (onSale) list = list.filter((p) => p.price < p.mrp)
  if (sort === 'priceLow') list.sort((a, b) => a.price - b.price)
  else if (sort === 'priceHigh') list.sort((a, b) => b.price - a.price)
  else if (sort === 'discount') list.sort((a, b) => discountPct(b.price, b.mrp) - discountPct(a.price, a.mrp))
  if (limit) list = list.slice(0, limit)
  return list
}

export async function getProduct(id) {
  if (!dbConfigured) return DEMO_PRODUCTS.find((p) => p._id === id) || null
  const conn = await connectDb()
  if (!conn) return null
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  const doc = await Product.findById(id)
  return doc ? plain(doc) : null
}