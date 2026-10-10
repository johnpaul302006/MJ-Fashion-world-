const GUEST_KEY = 'cart_guest'
const ACTIVE_UID_KEY = '_mj_active_uid'

// Clear obsolete global shared key on script execution to prevent legacy leakage
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('cart_items')
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

function getCartStorageKey() {
  const ukey = getActiveUserKey()
  return ukey === 'guest' ? GUEST_KEY : `cart_user_${ukey}`
}

export function syncCartUser(user) {
  if (typeof window === 'undefined') return
  const currentKey = user
    ? String(user.id || user._id || user.email || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
    : 'guest'

  if (user && currentKey && currentKey !== 'guest') {
    localStorage.setItem(ACTIVE_UID_KEY, currentKey)

    // Check for guest cart items to merge into account
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
      // Merge on server and update local storage
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestItems }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.items)) {
            localStorage.setItem(`cart_user_${currentKey}`, JSON.stringify(data.items))
            window.dispatchEvent(new Event('cart-updated'))
          }
        })
        .catch(() => {})
    } else {
      // Fetch server cart for this user
      fetch('/api/cart')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.items)) {
            localStorage.setItem(`cart_user_${currentKey}`, JSON.stringify(data.items))
            window.dispatchEvent(new Event('cart-updated'))
          }
        })
        .catch(() => {})
    }
  } else {
    // Logout: Clear active user id & guest cache to prevent state leakage
    localStorage.removeItem(ACTIVE_UID_KEY)
    localStorage.removeItem(GUEST_KEY)
    window.dispatchEvent(new Event('cart-updated'))
  }
}

export function getCart() {
  if (typeof window === 'undefined') return []
  try {
    const key = getCartStorageKey()
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

export function saveCart(items) {
  if (typeof window === 'undefined') return
  const key = getCartStorageKey()
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {}
  window.dispatchEvent(new Event('cart-updated'))

  // Sync with server if logged in
  const ukey = getActiveUserKey()
  if (ukey !== 'guest') {
    fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }).catch(() => {})
  }
}

export function addToCart(product, size, qty = 1) {
  if (!product) return
  const pid = String(product._id || product.id || '')
  if (!pid) return
  const chosenSize = String(size || product.sizes?.[0] || 'Free Size').trim()
  const addQty = Math.max(1, Number(qty) || 1)

  const items = getCart()
  const existing = items.find((i) => String(i.id) === pid && String(i.size) === chosenSize)
  if (existing) {
    existing.qty += addQty
  } else {
    items.push({
      id: pid,
      name: product.name,
      image: product.image || (Array.isArray(product.images) ? product.images[0] : ''),
      price: product.price,
      mrp: product.mrp,
      size: chosenSize,
      qty: addQty,
    })
  }
  saveCart(items)
}

export function updateQty(id, size, qty) {
  const pid = String(id)
  const items = getCart()
  const item = items.find((i) => String(i.id) === pid && String(i.size) === String(size))
  if (!item) return
  if (qty <= 0) {
    removeItem(id, size)
  } else {
    item.qty = qty
    saveCart(items)
  }
}

export function removeItem(id, size) {
  const pid = String(id)
  const filtered = getCart().filter((i) => !(String(i.id) === pid && String(i.size) === String(size)))
  saveCart(filtered)
}

export function cartCount() {
  return getCart().reduce((n, i) => n + (Number(i.qty) || 0), 0)
}

export function cartTotal(items) {
  return (items || []).reduce((n, i) => n + (Number(i.price) || 0) * (Number(i.qty) || 0), 0)
}