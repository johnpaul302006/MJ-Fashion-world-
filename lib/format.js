export function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}

export function discountPct(price, mrp) {
  if (!mrp || !price || Number(mrp) <= 0) return 0
  return Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)
}

export function genOrderId() {
  const t = Date.now().toString(36).toUpperCase().slice(-5)
  const r = Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
  return 'JN-' + t + r
}

export function shortDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(iso).slice(0, 10)
  }
}