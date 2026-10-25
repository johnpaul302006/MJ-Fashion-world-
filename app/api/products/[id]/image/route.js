import { NextResponse } from 'next/server'
import { getProduct } from '@/lib/data'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const product = await getProduct(id)

    if (!product || (!product.image && (!Array.isArray(product.images) || product.images.length === 0))) {
      return fallbackSvg('MJ Fashion World')
    }

    const rawImg = product.image || product.images[0]

    // 1. Base64 Data URL (e.g. uploaded from admin panel)
    if (typeof rawImg === 'string' && rawImg.startsWith('data:')) {
      const match = rawImg.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        const mimeType = match[1] || 'image/jpeg'
        const base64Data = match[2]
        const buffer = Buffer.from(base64Data, 'base64')

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          },
        })
      }
    }

    // 2. Absolute Remote URL (e.g. Unsplash, Pexels, CDN)
    if (typeof rawImg === 'string' && (rawImg.startsWith('http://') || rawImg.startsWith('https://'))) {
      return NextResponse.redirect(rawImg, { status: 307 })
    }

    // 3. Fallback SVG
    return fallbackSvg(product.name || 'MJ Fashion World')
  } catch (err) {
    console.error('product image route error:', err)
    return fallbackSvg('MJ Fashion World')
  }
}

function fallbackSvg(title) {
  const safeTitle = String(title || 'MJ Fashion World')
    .slice(0, 40)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="100%" height="100%" fill="#0f172a" />
    <circle cx="600" cy="220" r="80" fill="#cc0000" />
    <text x="600" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle">MJ</text>
    <text x="600" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle">${safeTitle}</text>
    <text x="600" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#94a3b8" text-anchor="middle">MJ FASHION WORLD · PREMIUM FASHION</text>
  </svg>`

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  })
}
