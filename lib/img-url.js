export function imgUrl(src) {
  if (!src) return ''
  // Already proxied
  if (src.startsWith('/api/img?u=')) return src
  // Data URLs (from file upload) – use directly, don't proxy
  if (src.startsWith('data:')) return src
  // Absolute URLs – proxy through our server to avoid CORS/hotlink issues
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return `/api/img?u=${encodeURIComponent(src)}`
  }
  // Relative / local paths
  return src
}

const NON_IMAGE_HOSTS = [
  'instagram.com',
  'instagr.am',
  'facebook.com',
  'fb.com',
  'fb.watch',
  'youtube.com',
  'youtu.be',
  'pinterest.com',
  'pin.it',
  'x.com',
  'twitter.com',
  'snapchat.com',
  'amazon.in',
  'amazon.com',
  'flipkart.com',
  'myntra.com',
  'ajio.com',
  'meesho.com',
  'nykaa.com',
]

export function isNonImageLink(src) {
  if (!src || src.startsWith('data:image')) return false
  if (!/^https?:\/\//i.test(src)) return false
  let host
  try {
    host = new URL(src).hostname.toLowerCase()
  } catch {
    return false
  }
  return NON_IMAGE_HOSTS.some((h) => host === h || host.endsWith('.' + h))
}