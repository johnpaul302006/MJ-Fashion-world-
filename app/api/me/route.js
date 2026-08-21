import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUser } from '@/lib/auth'
import { getSettings } from '@/lib/data'
import { dbConfigured, connectDb } from '@/lib/db'
import { User } from '@/lib/models'
import { availableGateways } from '@/lib/payments'

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
          .select('name email phone role')
          .lean()
        if (doc) {
          profile = { id: String(doc._id), name: doc.name, email: doc.email, phone: doc.phone, role: sessionUser.role }
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
