export function imgUrl(src) {
  if (!src) return ''
  if (src.startsWith('/api/img?u=')) return src
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return `/api/img?u=${encodeURIComponent(src)}`
  }
  return src
}