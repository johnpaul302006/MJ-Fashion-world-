const KEY = 'wishlist_items'

export function getWishlist() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveWishlist(items) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
  window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: items }))
}

export function isInWishlist(id) {
  if (!id) return false
  const items = getWishlist()
  return items.some((i) => (i._id || i.id) === id)
}

export function addToWishlist(product) {
  if (!product) return
  const id = product._id || product.id
  const items = getWishlist()
  if (items.some((i) => (i._id || i.id) === id)) return items

  const next = [
    {
      _id: id,
      id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      category: product.category,
      stock: product.stock,
      sizes: product.sizes || [],
      colors: product.colors || [],
      description: product.description || '',
      featured: Boolean(product.featured),
    },
    ...items,
  ]
  saveWishlist(next)
  return next
}

export function removeFromWishlist(id) {
  if (!id) return
  const items = getWishlist()
  const next = items.filter((i) => (i._id || i.id) !== id)
  saveWishlist(next)
  return next
}

export function toggleWishlist(product) {
  if (!product) return false
  const id = product._id || product.id
  if (isInWishlist(id)) {
    removeFromWishlist(id)
    return false
  } else {
    addToWishlist(product)
    return true
  }
}

export function wishlistCount() {
  return getWishlist().length
}
