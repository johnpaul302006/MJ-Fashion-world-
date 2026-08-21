import { NextResponse } from 'next/server'
import { createUserSession, logoutUser } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    const mail = String(email || '').trim().toLowerCase()
    const pass = String(password || '')

    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }

    const hostMail = String(process.env.HOST_EMAIL || '').trim().toLowerCase()
    const isHost = hostMail && mail === hostMail

    if (isHost) {
      if (!process.env.ADMIN_PASSWORD || pass !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Wrong host password' }, { status: 401 })
      }
      await createUserSession(mail, 'host')
      return NextResponse.json({ ok: true, role: 'host', email: mail })
    }

    if (pass.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 401 })
    }
    await createUserSession(mail, 'customer')
    return NextResponse.json({ ok: true, role: 'customer', email: mail })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function DELETE() {
  await logoutUser()
  return NextResponse.json({ ok: true })
}