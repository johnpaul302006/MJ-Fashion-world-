import { NextResponse } from 'next/server'

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
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        referer: '',
      },
      redirect: 'follow',
      cache: 'no-store',
    })
    if (!res.ok) return new NextResponse('image not found', { status: 404 })
    const type = res.headers.get('content-type') || ''
    if (!type.startsWith('image/')) return new NextResponse('not an image', { status: 415 })
    const buf = Buffer.from(await res.arrayBuffer())
    return new NextResponse(buf, {
      headers: {
        'content-type': type,
        'cache-control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch {
    return new NextResponse('fetch failed', { status: 502 })
  }
}
