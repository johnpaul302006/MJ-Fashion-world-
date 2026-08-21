import { NextResponse } from 'next/server'
import { loginAdmin, logoutAdmin, isAdmin } from '@/lib/auth'

export async function GET() {
  return NextResponse.json({ ok: await isAdmin() })
}

export async function POST(request) {
  try {
    const { password } = await request.json()
    const ok = await loginAdmin(String(password || ''))
    if (!ok) return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function DELETE() {
  await logoutAdmin()
  return NextResponse.json({ ok: true })
}