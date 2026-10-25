import mongoose from 'mongoose'
import { connectDb, dbConfigured } from './db'
import { Product, Order, Settings, Category } from './models'
import { DEMO_SETTINGS, DEMO_PRODUCTS } from './demo'
import { discountPct } from './format'
import { filterAndRankProducts } from './smart-search'
import { CATEGORIES, CATEGORY_LABEL } from './categories'

// Generate intelligent fallback highlights for products
function getDefaultHighlights(obj) {
  const brandName = obj.brand || 'MJ Fashion World'
  return [
    `100% Genuine Quality Guaranteed by ${brandName}`,
    'Ultra-Comfortable, Breathable All-Day Fabric',
    'Vivid Colorfast Technology & Pre-Shrunk Stitching',
    'Versatile Styling — Perfect for Casual and Daily Wear',
    '7-Day Easy Return & Exchange Available',
  ]
}

// Generate intelligent fallback grouped specifications
function getDefaultSpecifications(obj) {
  const cat = CATEGORY_LABEL[obj.category] || obj.category || 'Apparel'
  const brandName = obj.brand || 'MJ Fashion World'
  const styleCode = `MJ-${String(obj._id || 'PROD').slice(-6).toUpperCase()}`
  const availableSizes = Array.isArray(obj.sizes) && obj.sizes.length > 0 ? obj.sizes.join(', ') : 'Free Size'
  const availableColors = Array.isArray(obj.colors) && obj.colors.length > 0 ? obj.colors.join(', ') : 'As Shown in Images'

  return [
    {
      group: 'General',
      items: [
        { label: 'Brand', value: brandName },
        { label: 'Style Code', value: styleCode },
        { label: 'Ideal For', value: cat },
        { label: 'Occasion', value: 'Casual / Everyday' },
        { label: 'Pattern', value: obj.tags?.[0] || 'Solid / Printed Contemporary' },
      ],
    },
    {
      group: 'Fabric & Fit Details',
      items: [
        { label: 'Fabric', value: 'Premium Breathable Cotton Blend' },
        { label: 'Fit', value: 'Regular Comfort Fit' },
        { label: 'Available Sizes', value: availableSizes },
        { label: 'Color Palette', value: availableColors },
      ],
    },
    {
      group: 'Care Instructions & Policies',
      items: [
        { label: 'Wash Care', value: 'Machine wash gentle with like colors; do not bleach' },
        { label: 'Ironing', value: 'Medium iron on reverse side' },
        { label: 'Return Policy', value: '7-Day Return / Exchange on eligible items' },
        { label: 'Country of Origin', value: 'India' },
      ],
    },
  ]
}

// Convert mongoose documents into plain, serializable objects
// so they can be passed safely from Server to Client Components.
function plain(doc) {
  if (!doc) return doc
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc
  const primaryImg = obj.image || ''
  const images = Array.isArray(obj.images) && obj.images.length > 0 ? obj.images : (primaryImg ? [primaryImg] : [])

  const highlights = Array.isArray(obj.highlights) && obj.highlights.length > 0
    ? obj.highlights
    : getDefaultHighlights(obj)

  const specifications = Array.isArray(obj.specifications) && obj.specifications.length > 0
    ? obj.specifications
    : getDefaultSpecifications(obj)

  return {
    ...obj,
    _id: String(obj._id),
    brand: obj.brand || '',
    tags: Array.isArray(obj.tags) ? obj.tags : [],
    image: primaryImg,
    images,
    highlights,
    specifications,
    isNewArrival: Boolean(obj.isNewArrival || obj.featured),
    newArrivalAt: obj.newArrivalAt ? new Date(obj.newArrivalAt).toISOString() : (obj.createdAt ? new Date(obj.createdAt).toISOString() : null),
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
    'gstin',
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
  if (!dbConfigured) return filterDemoProducts(filters).map(plain)
  const conn = await connectDb()
  if (!conn) return filterDemoProducts(filters).map(plain)

  const { category, q, size, sort, onSale, featured, newArrivals, ids, limit } = filters
  const query = {}
  if (category) query.category = category
  if (featured) query.featured = true
  if (newArrivals) query.isNewArrival = true
  if (ids && Array.isArray(ids) && ids.length) {
    const valid = ids
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id))
    if (valid.length) query._id = { $in: valid }
  }
  if (size && size !== 'all') query.sizes = size

  // Fetch up to 400 candidate products to allow deep multi-field token ranking
  let list = await Product.find(query)
    .sort({ newArrivalAt: -1, createdAt: -1 })
    .limit(limit || 400)
    .lean()

  // Apply Smart Search: tokenized multi-field matching & weighted ranking
  if (q && String(q).trim()) {
    list = filterAndRankProducts(list, q)
  }

  if (onSale) list = list.filter((p) => p.price < p.mrp)

  if (sort === 'priceLow') list.sort((a, b) => a.price - b.price)
  else if (sort === 'priceHigh') list.sort((a, b) => b.price - a.price)
  else if (sort === 'discount') list.sort((a, b) => discountPct(b.price, b.mrp) - discountPct(a.price, a.mrp))

  if (limit && list.length > limit) list = list.slice(0, limit)

  return list.map((p) => plain(p))
}

export async function getCategories() {
  if (!dbConfigured) return CATEGORIES
  const conn = await connectDb()
  if (!conn) return CATEGORIES
  try {
    let docs = await Category.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean()
    if (!docs || docs.length === 0) {
      const defaults = [
        {
          slug: 'boys',
          label: 'Boys',
          image: 'https://images.pexels.com/photos/15459807/pexels-photo-15459807.jpeg?auto=compress&cs=tinysrgb&w=800',
          sub: 'Trendy Fits',
          order: 1,
        },
        {
          slug: 'girls',
          label: 'Girls',
          image: 'https://images.pexels.com/photos/19214177/pexels-photo-19214177.jpeg?auto=compress&cs=tinysrgb&w=800',
          sub: 'New Collection',
          order: 2,
        },
        {
          slug: 'children',
          label: 'Children',
          image: 'https://images.pexels.com/photos/33776741/pexels-photo-33776741.jpeg?auto=compress&cs=tinysrgb&w=800',
          sub: 'Fun & Colorful',
          order: 3,
        },
        {
          slug: 'men',
          label: 'Men',
          image: 'https://images.pexels.com/photos/35312945/pexels-photo-35312945.jpeg?auto=compress&cs=tinysrgb&w=800',
          sub: 'Classic Styles',
          order: 4,
        },
        {
          slug: 'women',
          label: 'Women',
          image: 'https://images.pexels.com/photos/9767828/pexels-photo-9767828.jpeg?auto=compress&cs=tinysrgb&w=800',
          sub: 'Latest Trends',
          order: 5,
        },
      ]
      try {
        await Category.insertMany(defaults)
        docs = defaults
      } catch {
        docs = defaults
      }
    }
    return docs.map((d) => ({
      _id: d._id ? String(d._id) : d.slug,
      slug: d.slug,
      label: d.label,
      image: d.image || '',
      sub: d.sub || 'Shop Now',
      order: d.order || 0,
    }))
  } catch (err) {
    console.error('getCategories error:', err)
    return CATEGORIES
  }
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
  if (!id) return null
  if (!dbConfigured) {
    const demo = DEMO_PRODUCTS.find((p) => String(p._id) === String(id) || String(p.id) === String(id))
    return demo ? plain(demo) : null
  }
  const conn = await connectDb()
  if (!conn) {
    const demo = DEMO_PRODUCTS.find((p) => String(p._id) === String(id) || String(p.id) === String(id))
    return demo ? plain(demo) : null
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const demo = DEMO_PRODUCTS.find((p) => String(p._id) === String(id) || String(p.id) === String(id))
    return demo ? plain(demo) : null
  }
  const doc = await Product.findById(id)
  if (doc) return plain(doc)
  const demo = DEMO_PRODUCTS.find((p) => String(p._id) === String(id) || String(p.id) === String(id))
  return demo ? plain(demo) : null
}

export async function getOrderForDocument(idOrOrderId) {
  if (!idOrOrderId) return null
  if (!dbConfigured) return null
  const conn = await connectDb()
  if (!conn) return null
  try {
    let order = null
    if (mongoose.Types.ObjectId.isValid(idOrOrderId)) {
      order = await Order.findById(idOrOrderId).lean()
    }
    if (!order) {
      order = await Order.findOne({ orderId: String(idOrOrderId).toUpperCase() }).lean()
    }
    if (!order) return null
    return {
      ...order,
      _id: String(order._id),
      userId: order.userId ? String(order.userId) : null,
    }
  } catch (err) {
    console.error('getOrderForDocument error:', err)
    return null
  }
}