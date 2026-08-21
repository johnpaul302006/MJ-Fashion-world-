import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { User } from '@/lib/models'
import { createUserSession } from '@/lib/auth'
import {
  hashPassword,
  passwordIssues,
  isValidEmail,
  isValidPhone,
  normalizePhone,
} from '@/lib/password'

export async function POST(request) {
  if (!dbConfigured) {
    return NextResponse.json(
      { error: 'The store database is not connected yet. Please try again later.' },
      { status: 503 }
    )
  }
  try {
    const conn = await connectDb()
    if (!conn) {
      return NextResponse.json({ error: 'Database not reachable. Please try again.' }, { status: 503 })
    }

    const body = await request.json()
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = normalizePhone(body.phone)
    const password = String(body.password || '')
    const confirmPassword = String(body.confirmPassword || '')

    // ── Validation ────────────────────────────────────────────
    const fieldErrors = {}
    if (name.length < 3) fieldErrors.name = 'Please enter your full name (min 3 characters)'
    if (!isValidEmail(email)) fieldErrors.email = 'Enter a valid email address'
    if (!isValidPhone(phone)) fieldErrors.phone = 'Enter a valid 10-digit mobile number'
    const issues = passwordIssues(password)
    if (issues.length > 0) {
      fieldErrors.password = `Password must contain ${issues.join(', ')}`
    }
    if (password !== confirmPassword) {
      fieldErrors.confirmPassword = 'Passwords do not match'
    }
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: Object.values(fieldErrors)[0], fieldErrors },
        { status: 400 }
      )
    }

    // ── Duplicate checks ─────────────────────────────────────
    const existing = await User.findOne({ $or: [{ email }, { phone }] })
      .select('email phone')
      .lean()
    if (existing) {
      if (existing.email === email) {
        return NextResponse.json(
          { error: 'An account with this email already exists', fieldErrors: { email: 'Email already registered' } },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'An account with this mobile number already exists', fieldErrors: { phone: 'Mobile number already registered' } },
        { status: 409 }
      )
    }

    // ── Create the account ───────────────────────────────────
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: hashPassword(password),
      role: 'customer',
    })

    await createUserSession(user, 'customer')
    return NextResponse.json(
      {
        ok: true,
        user: { id: String(user._id), name: user.name, email: user.email, phone: user.phone, role: user.role },
      },
      { status: 201 }
    )
  } catch (err) {
    // Race-safe duplicate handling on the unique indexes
    if (err?.code === 11000) {
      const dupField = Object.keys(err.keyPattern || {})[0] || 'email'
      return NextResponse.json(
        {
          error: `An account with this ${dupField === 'phone' ? 'mobile number' : 'email'} already exists`,
          fieldErrors: { [dupField]: 'Already registered' },
        },
        { status: 409 }
      )
    }
    console.error('signup error:', err.message)
    return NextResponse.json({ error: 'Could not create your account. Please try again.' }, { status: 500 })
  }
}
