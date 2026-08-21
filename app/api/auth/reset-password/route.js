import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { User, PasswordResetToken } from '@/lib/models'
import { hashPassword, passwordIssues, sha256 } from '@/lib/password'

export async function POST(request) {
  try {
    const body = await request.json()
    const token = String(body.token || '').trim()
    const password = String(body.password || '')
    const confirmPassword = String(body.confirmPassword || '')

    if (!token) return NextResponse.json({ error: 'Reset link is invalid' }, { status: 400 })
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }
    const issues = passwordIssues(password)
    if (issues.length > 0) {
      return NextResponse.json(
        { error: `Password must contain ${issues.join(', ')}` },
        { status: 400 }
      )
    }

    if (!dbConfigured) {
      return NextResponse.json({ error: 'Database not connected. Please try again later.' }, { status: 503 })
    }
    const conn = await connectDb()
    if (!conn) return NextResponse.json({ error: 'Database not reachable.' }, { status: 503 })

    const record = await PasswordResetToken.findOne({ tokenHash: sha256(token), used: false })
    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    const user = await User.findById(record.userId)
    if (!user) {
      return NextResponse.json({ error: 'Account no longer exists' }, { status: 400 })
    }

    user.passwordHash = hashPassword(password)
    await user.save()

    // Consume this token and burn any other outstanding ones
    await PasswordResetToken.updateMany({ userId: user._id }, { used: true })

    return NextResponse.json({
      ok: true,
      message: 'Your password has been updated. You can now log in with it.',
    })
  } catch {
    return NextResponse.json({ error: 'Could not reset your password. Please try again.' }, { status: 500 })
  }
}
