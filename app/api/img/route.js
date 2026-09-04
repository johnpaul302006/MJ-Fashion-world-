import { NextResponse } from 'next/server'

/* Guess content-type from the URL path extension */
function guessType(url) {
  const ext = url.pathname.split('.').pop()?.toLowerCase()
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    avif: 'image/avif', ico: 'image/x-icon', bmp: 'image/bmp',
  }
  return map[ext] || 'image/jpeg'
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('u')
  if (!url) return new NextResponse('missing url', { status: 400 })

  let target
  try {
    target = new URL(url)
  } catch {
    return new NextResponse('bad url', { status: 400 })
  }
  if (!['http:', 'https:'].includes(target.protocol)) {
    return new NextResponse('bad url', { status: 400 })
  }

  try {
    const res = await fetch(target.toString(), {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        referer: target.origin + '/',
      },
      redirect: 'follow',
      cache: 'no-store',
    })
    if (!res.ok) return new NextResponse('image not found', { status: 404 })

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0) return new NextResponse('empty response', { status: 404 })

    /* Use the server's content-type if it looks like an image,
       otherwise guess from the URL extension */
    let type = res.headers.get('content-type') || ''
    if (!type.startsWith('image/')) {
      type = guessType(target)
    }

    return new NextResponse(buf, {
      headers: {
        'content-type': type,
        'cache-control': 'public, max-age=86400, s-maxage=86400',
        'access-control-allow-origin': '*',
      },
    })
  } catch {
    return new NextResponse('fetch failed', { status: 502 })
  }
}
