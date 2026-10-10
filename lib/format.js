export function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}

export const formatPrice = inr

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

export function getReturnEligibility(deliveryTime) {
  if (!deliveryTime) return { isWithinWindow: true, returnDaysRemaining: 7 }
  try {
    const deliveredMs = new Date(deliveryTime).getTime()
    if (isNaN(deliveredMs)) return { isWithinWindow: true, returnDaysRemaining: 7 }
    const diffDays = (Date.now() - deliveredMs) / (1000 * 60 * 60 * 24)
    const returnDaysRemaining = Math.max(0, Math.ceil(7 - diffDays))
    const isWithinWindow = diffDays <= 7
    return { isWithinWindow, returnDaysRemaining }
  } catch {
    return { isWithinWindow: true, returnDaysRemaining: 7 }
  }
}