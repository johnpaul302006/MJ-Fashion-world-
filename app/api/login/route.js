import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { User } from '@/lib/models'
import { createUserSession, logoutUser } from '@/lib/auth'
import { verifyPassword, normalizePhone } from '@/lib/password'

export async function POST(request) {
  try {
    const body = await request.json()
    const identifierRaw = String(body.identifier ?? body.email ?? '').trim()
    const password = String(body.password || '')

    if (!identifierRaw || !password) {
      return NextResponse.json({ error: 'Enter your email/mobile and password' }, { status: 400 })
    }

    const isEmail = identifierRaw.includes('@')
    if (!isEmail && !/^[0-9]{10,13}$/.test(identifierRaw.replace(/[^0-9]/g, ''))) {
      return NextResponse.json({ error: 'Enter a valid email or mobile number' }, { status: 400 })
    }
    if (isEmail && !/^\S+@\S+\.\S+$/.test(identifierRaw)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }

    // ── Host login (store owner) — env credentials ───────────
    const hostMail = String(process.env.HOST_EMAIL || '').trim().toLowerCase()
    const identifier = identifierRaw.toLowerCase()
    if (hostMail && identifier === hostMail) {
      if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
      }
      // Keep a host user record so orders/accounts work uniformly
      let hostUser = null
      if (dbConfigured) {
        try {
          const conn = await connectDb()
          if (conn) {
            hostUser = await User.findOneAndUpdate(
              { email: hostMail },
              {
                $set: { role: 'host' },
                $setOnInsert: {
                  name: 'Store Owner',
                  email: hostMail,
                  phone: `host-${Date.now()}`,
                  passwordHash: 'scrypt$00$00',
                },
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            )
          }
        } catch {
          hostUser = null
        }
      }
      const claims = hostUser
        ? { _id: hostUser._id, email: hostMail, name: hostUser.name || 'Store Owner' }
        : hostMail
      await createUserSession(claims, 'host')
      return NextResponse.json({ ok: true, role: 'host', email: hostMail })
    }

    // ── Customer login (database-backed) ─────────────────────
    if (!dbConfigured) {
      return NextResponse.json(
        { error: 'The store database is not connected yet. Please try again later.' },
        { status: 503 }
      )
    }
    const conn = await connectDb()
    if (!conn) {
      return NextResponse.json({ error: 'Database not reachable. Please try again.' }, { status: 503 })
    }

    const query = isEmail ? { email: identifier } : { phone: normalizePhone(identifierRaw) }
    const user = await User.findOne(query)
    if (!user) {
      return NextResponse.json({ error: 'No account found with these details. Create one below.' }, { status: 401 })
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    await createUserSession(user, 'customer')
    return NextResponse.json({
      ok: true,
      role: 'customer',
      user: { id: String(user._id), name: user.name, email: user.email, phone: user.phone },
    })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function DELETE() {
  await logoutUser()
  return NextResponse.json({ ok: true })
}
