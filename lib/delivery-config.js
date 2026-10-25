// Delivery configuration and PIN code estimation helper

const METRO_PREFIXES = ['11', '40', '56', '60', '50', '70', '41', '38']

/**
 * Checks if a string is a valid 6-digit Indian postal PIN code.
 */
export function isValidPincode(pincode) {
  if (!pincode) return false
  const clean = String(pincode).trim()
  return /^[1-9][0-9]{5}$/.test(clean)
}

/**
 * Calculates delivery estimation based on PIN code.
 * @param {string} pincode - 6-digit pin code
 * @returns {object} { serviceable, etaDays, formattedDate, fastDelivery, codAvailable }
 */
export function getDeliveryEstimate(pincode) {
  if (!isValidPincode(pincode)) {
    return {
      serviceable: false,
      error: 'Please enter a valid 6-digit PIN code.',
    }
  }

  const clean = String(pincode).trim()
  const prefix = clean.slice(0, 2)
  const isMetro = METRO_PREFIXES.includes(prefix)

  // Metro delivery: 2-3 days, Non-metro: 4-5 days
  const etaDays = isMetro ? 2 : 4

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + etaDays)

  const options = { weekday: 'short', month: 'short', day: 'numeric' }
  const formattedDate = targetDate.toLocaleDateString('en-IN', options)

  return {
    serviceable: true,
    pincode: clean,
    etaDays,
    formattedDate,
    fastDelivery: isMetro,
    shippingFee: 0,
    codAvailable: true,
    policy: '7-Day Return & Exchange Policy',
  }
}

/**
 * Default fallback delivery estimation for initial render.
 */
export function getDefaultDeliveryEstimate() {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + 3)
  const options = { weekday: 'short', month: 'short', day: 'numeric' }
  return {
    serviceable: true,
    pincode: null,
    etaDays: 3,
    formattedDate: targetDate.toLocaleDateString('en-IN', options),
    fastDelivery: false,
    shippingFee: 0,
    codAvailable: true,
    policy: '7-Day Return & Exchange Policy',
  }
}
