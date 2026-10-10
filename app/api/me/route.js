import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUser, createUserSession } from '@/lib/auth'
import { getSettings } from '@/lib/data'
import { dbConfigured, connectDb } from '@/lib/db'
import { User } from '@/lib/models'
import { availableGateways } from '@/lib/payments'
import { verifyPassword, hashPassword, passwordIssues, normalizePhone, isValidPhone } from '@/lib/password'

export async function GET() {
  let sessionUser = await getUser()

  // Sessions issued before real accounts existed carry no User record —
  // treat them as logged out so protected features never break.
  if (sessionUser && sessionUser.role !== 'host' && dbConfigured) {
    try {
      const conn = await connectDb()
      const exists =
        conn && sessionUser.email
          ? await User.exists({ email: sessionUser.email.toLowerCase() })
          : null
      if (!exists) {
        const store = await cookies()
        store.delete('usersession')
        sessionUser = null
      }
    } catch {
      // DB hiccup — keep the session claims rather than logging people out
    }
  }

  let profile = null
  if (sessionUser && dbConfigured) {
    try {
      const conn = await connectDb()
      if (conn) {
        const doc = await User.findOne({ email: String(sessionUser.email).toLowerCase() })
          .select('name email phone role createdAt')
          .lean()
        if (doc) {
          profile = {
            id: String(doc._id),
            name: doc.name,
            email: doc.email,
            phone: doc.phone,
            role: sessionUser.role,
            createdAt: doc.createdAt,
          }
        }
      }
    } catch {}
  }

  const settings = await getSettings()
  return NextResponse.json({
    user: profile || sessionUser,
    offers: settings.offers || [],
    announcements: settings.announcements || [],
    announcement: settings.announcement || '',
    paymentGateways: availableGateways(),
  })
}

export async function PATCH(request) {
  const sessionUser = await getUser()
  if (!sessionUser) {
    return NextResponse.json({ error: 'Please log in to continue' }, { status: 401 })
  }
  if (!dbConfigured) {
    return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
  }

  try {
    const conn = await connectDb()
    if (!conn) {
      return NextResponse.json({ error: 'Database not reachable' }, { status: 503 })
    }

    const dbUser = await User.findOne({ email: String(sessionUser.email).toLowerCase() })
    if (!dbUser) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action } = body

    // ── Change Password ───────────────────────────────────────
    if (action === 'password') {
      const { currentPassword, newPassword } = body
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Both current and new password are required' }, { status: 400 })
      }
      if (!verifyPassword(currentPassword, dbUser.passwordHash)) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
      const issues = passwordIssues(newPassword)
      if (issues.length > 0) {
        return NextResponse.json({ error: `New password must have ${issues.join(', ')}` }, { status: 400 })
      }
      dbUser.passwordHash = hashPassword(newPassword)
      await dbUser.save()
      return NextResponse.json({ ok: true, message: 'Password updated successfully' })
    }

    // ── Edit Profile (Name & Phone) ───────────────────────────
    const name = String(body.name || '').trim()
    const phone = normalizePhone(body.phone)

    if (name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: 'Enter a valid 10-digit mobile number' }, { status: 400 })
    }

    // Check if another user already has this phone number
    const existingPhone = await User.findOne({ phone, _id: { $ne: dbUser._id } })
    if (existingPhone) {
      return NextResponse.json({ error: 'This phone number is already linked to another account' }, { status: 400 })
    }

    dbUser.name = name
    dbUser.phone = phone
    await dbUser.save()

    // Update user session cookie
    await createUserSession(dbUser, sessionUser.role)

    return NextResponse.json({
      ok: true,
      message: 'Profile updated successfully',
      user: {
        id: String(dbUser._id),
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        role: sessionUser.role,
        createdAt: dbUser.createdAt,
      },
    })
  } catch (err) {
    console.error('Failed to update profile:', err)
    return NextResponse.json({ error: 'Could not update profile. Please try again.' }, { status: 500 })
  }
}

