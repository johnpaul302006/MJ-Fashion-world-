const KEY = 'cart_items'

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('cart-updated'))
}

export function addToCart(product, size, qty = 1) {
  const items = getCart()
  const existing = items.find((i) => i.id === product._id && i.size === size)
  if (existing) existing.qty += qty
  else
    items.push({
      id: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      mrp: product.mrp,
      size,
      qty,
    })
  saveCart(items)
}

export function updateQty(id, size, qty) {
  const items = getCart()
  const item = items.find((i) => i.id === id && i.size === size)
  if (!item) return
  if (qty <= 0) removeItem(id, size)
  else {
    item.qty = qty
    saveCart(items)
  }
}

export function removeItem(id, size) {
  saveCart(getCart().filter((i) => !(i.id === id && i.size === size)))
}

export function cartCount() {
  return getCart().reduce((n, i) => n + i.qty, 0)
}

export function cartTotal(items) {
  return items.reduce((n, i) => n + i.price * i.qty, 0)
}