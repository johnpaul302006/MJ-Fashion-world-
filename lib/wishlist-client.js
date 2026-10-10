const GUEST_KEY = 'wishlist_guest'
const ACTIVE_UID_KEY = '_mj_active_uid'

// Clear obsolete global shared key on script execution to prevent legacy leakage
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('wishlist_items')
  } catch {}
}

export function getActiveUserKey() {
  if (typeof window === 'undefined') return 'guest'
  try {
    const uid = localStorage.getItem(ACTIVE_UID_KEY)
    if (uid) return uid.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  } catch {}
  return 'guest'
}

function getWishlistStorageKey() {
  const ukey = getActiveUserKey()
  return ukey === 'guest' ? GUEST_KEY : `wishlist_user_${ukey}`
}

export function syncWishlistUser(user) {
  if (typeof window === 'undefined') return
  const currentKey = user
    ? String(user.id || user._id || user.email || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
    : 'guest'

  if (user && currentKey && currentKey !== 'guest') {
    localStorage.setItem(ACTIVE_UID_KEY, currentKey)

    // Check for guest wishlist items to merge
    let guestItems = []
    try {
      guestItems = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]')
      if (guestItems.length > 0) {
        localStorage.removeItem(GUEST_KEY)
      }
    } catch {
      guestItems = []
    }

    if (guestItems.length > 0) {
      fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestItems }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.items)) {
            localStorage.setItem(`wishlist_user_${currentKey}`, JSON.stringify(data.items))
            window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: data.items }))
          }
        })
        .catch(() => {})
    } else {
      // Fetch latest wishlist for this user from server
      fetch('/api/wishlist')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.items)) {
            localStorage.setItem(`wishlist_user_${currentKey}`, JSON.stringify(data.items))
            window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: data.items }))
          }
        })
        .catch(() => {})
    }
  } else {
    // Logout: Clear active user id & guest cache to prevent state leakage
    localStorage.removeItem(ACTIVE_UID_KEY)
    localStorage.removeItem(GUEST_KEY)
    window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: [] }))
  }
}

export function getWishlist() {
  if (typeof window === 'undefined') return []
  try {
    const key = getWishlistStorageKey()
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

export function saveWishlist(items) {
  if (typeof window === 'undefined') return
  const key = getWishlistStorageKey()
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {}
  window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: items }))

  const ukey = getActiveUserKey()
  if (ukey !== 'guest') {
    fetch('/api/wishlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }).catch(() => {})
  }
}

export function isInWishlist(id) {
  if (!id) return false
  const pid = String(id)
  const items = getWishlist()
  return items.some((i) => String(i._id || i.id) === pid)
}

export function addToWishlist(product) {
  if (!product) return []
  const id = String(product._id || product.id || '')
  if (!id) return []
  const items = getWishlist()
  if (items.some((i) => String(i._id || i.id) === id)) return items

  const next = [
    {
      _id: id,
      id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.image || (Array.isArray(product.images) ? product.images[0] : ''),
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
  if (!id) return []
  const pid = String(id)
  const items = getWishlist()
  const next = items.filter((i) => String(i._id || i.id) !== pid)
  saveWishlist(next)
  return next
}

export function toggleWishlist(product) {
  if (!product) return false
  const id = String(product._id || product.id || '')
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
