import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { User, PasswordResetToken } from '@/lib/models'
import { generateResetToken, normalizePhone } from '@/lib/password'

const GENERIC_MESSAGE =
  'If an account exists with those details, a password reset link will be sent. Check your inbox.'

// Simple in-memory rate limit: 5 requests / hour / IP
const hits = new Map()
function rateLimited(ip) {
  const now = Date.now()
  const windowStart = now - 60 * 60 * 1000
  const list = (hits.get(ip) || []).filter((t) => t > windowStart)
  list.push(now)
  hits.set(ip, list)
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t < windowStart)) hits.delete(k)
    }
  }
  return list.length > 5
}

function siteOrigin(request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) return envUrl.replace(/\/$/, '')
  try {
    const url = new URL(request.url)
    const host = request.headers.get('x-forwarded-host') || url.host
    const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '')
    return `${proto}://${host}`
  } catch {
    return 'http://localhost:3000'
  }
}

async function sendResetEmail(to, resetUrl) {
  // Uses Resend's plain REST API — no SDK needed. Configure RESEND_API_KEY
  // and MAIL_FROM to enable real email delivery.
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to,
      subject: `Reset your ${process.env.STORE_NAME || 'Big Pickle'} password`,
      html: `<p>We received a request to reset your password.</p>
             <p><a href="${resetUrl}">Click here to choose a new password</a></p>
             <p>This link expires in 30 minutes and can be used once.
             If you did not request this, you can safely ignore this email.</p>`,
    }),
  })
  if (!res.ok) {
    console.error('reset email failed:', await res.text())
    return false
  }
  return true
}

export async function POST(request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a while and try again.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const identifierRaw = String(body.identifier || '').trim()

    // Always answer generically so accounts cannot be enumerated
    if (!dbConfigured) return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
    const conn = await connectDb()
    if (!conn) return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })

    let user = null
    if (identifierRaw.includes('@')) {
      if (/^\S+@\S+\.\S+$/.test(identifierRaw)) {
        user = await User.findOne({ email: identifierRaw.toLowerCase() })
      }
    } else {
      const phone = normalizePhone(identifierRaw)
      if (/^[6-9][0-9]{9}$/.test(phone)) user = await User.findOne({ phone })
    }

    if (!user) return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })

    // Invalidate previous unused tokens for this user
    await PasswordResetToken.updateMany({ userId: user._id, used: false }, { used: true })

    const { token, tokenHash } = generateResetToken()
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    })

    const resetUrl = `${siteOrigin(request)}/reset-password?token=${token}`
    const mailerConfigured = Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM)

    let emailed = false
    if (mailerConfigured && !user.phone.startsWith('host-')) {
      emailed = await sendResetEmail(user.email, resetUrl)
    }

    if (emailed) {
      return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
    }

    // No mailer available — expose the link only in development, or in
    // production when the store owner explicitly opted into the insecure
    // fallback (ALLOW_INSECURE_RESET_FALLBACK=true).
    const insecureFallback =
      process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_INSECURE_RESET_FALLBACK === 'true'
    if (insecureFallback) {
      return NextResponse.json({
        ok: true,
        message:
          'Email delivery is not configured on this store, so your personal reset link is shown below. Set RESEND_API_KEY to send it by email instead.',
        resetUrl,
      })
    }
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
  } catch {
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
  }
}
