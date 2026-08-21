const FALLBACK = () =>
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="100%" height="100%" fill="#482a0f"/><text x="50%" y="50%" fill="#96602c" font-size="46" text-anchor="middle" dominant-baseline="middle">🖼️</text><text x="50%" y="68%" fill="#c28a52" font-size="20" text-anchor="middle" font-family="Arial">image unavailable</text></svg>'
  )

export function fallbackImg(e) {
  const el = e.currentTarget
  if (!el || el.dataset.fallbackApplied) return
  el.dataset.fallbackApplied = '1'
  el.src = FALLBACK()
}