import { NextResponse } from 'next/server'
import { connectDb, dbConfigured } from '@/lib/db'
import { Address } from '@/lib/models'
import { getCurrentDbUser, safeAddress } from '@/lib/user'
import { normalizePhone, isValidPhone } from '@/lib/password'

function validate(body) {
  const errors = {}
  const fullName = String(body.fullName || '').trim()
  const phone = normalizePhone(body.phone)
  const line1 = String(body.line1 || '').trim()
  const line2 = String(body.line2 || '').trim()
  const city = String(body.city || '').trim()
  const state = String(body.state || '').trim()
  const pincode = String(body.pincode || '').replace(/[^0-9]/g, '')
  const label = String(body.label || 'Home').trim() || 'Home'

  if (fullName.length < 3) errors.fullName = 'Enter the full name (min 3 characters)'
  if (!isValidPhone(phone)) errors.phone = 'Enter a valid 10-digit mobile number'
  if (line1.length < 5) errors.line1 = 'Enter the address (house no, street)'
  if (!city) errors.city = 'City is required'
  if (!/^[1-9][0-9]{5}$/.test(pincode)) errors.pincode = 'Enter a valid 6-digit PIN code'

  return {
    errors,
    value: {
      label,
      fullName,
      phone,
      line1,
      line2,
      city,
      state,
      pincode,
      country: String(body.country || 'India').trim() || 'India',
      isDefault: Boolean(body.isDefault),
    },
  }
}

export async function GET() {
  const user = await getCurrentDbUser()
  if (!user) return NextResponse.json({ error: 'Please log in to continue' }, { status: 401 })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ addresses: [] })
  const docs = await Address.find({ userId: user.id }).sort({ isDefault: -1, createdAt: -1 }).lean()
  return NextResponse.json({ addresses: docs.map(safeAddress) })
}

export async function POST(request) {
  const user = await getCurrentDbUser()
  if (!user) return NextResponse.json({ error: 'Please log in to continue' }, { status: 401 })

  try {
    const body = await request.json()
    const { errors, value } = validate(body)
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: Object.values(errors)[0], fieldErrors: errors }, { status: 400 })
    }

    if (!(await connectDb())) {
      return NextResponse.json({ error: 'Database not reachable. Please try again.' }, { status: 503 })
    }

    const count = await Address.countDocuments({ userId: user.id })
    if (count >= 10) {
      return NextResponse.json({ error: 'You can save up to 10 addresses' }, { status: 400 })
    }

    const makeDefault = value.isDefault || count === 0
    if (makeDefault) {
      await Address.updateMany({ userId: user.id }, { isDefault: false })
    }
    const address = await Address.create({ ...value, isDefault: makeDefault, userId: user.id })

    return NextResponse.json({ ok: true, address: safeAddress(address.toObject()) }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Could not save the address. Please try again.' }, { status: 500 })
  }
}
