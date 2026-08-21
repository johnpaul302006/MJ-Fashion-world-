import { NextResponse } from 'next/server'
import { connectDb } from '@/lib/db'
import { Address } from '@/lib/models'
import { getCurrentDbUser, safeAddress } from '@/lib/user'
import { normalizePhone, isValidPhone } from '@/lib/password'

// PATCH /api/addresses/:id — update an address owned by the current user
export async function PATCH(request, { params }) {
  const user = await getCurrentDbUser()
  if (!user) return NextResponse.json({ error: 'Please log in to continue' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    if (!(await connectDb())) {
      return NextResponse.json({ error: 'Database not reachable. Please try again.' }, { status: 503 })
    }

    // Ownership enforced in the query itself — one user can never touch another's address
    const address = await Address.findOne({ _id: id, userId: user.id })
    if (!address) return NextResponse.json({ error: 'Address not found' }, { status: 404 })

    const fullName = String(body.fullName ?? address.fullName).trim()
    const phone = normalizePhone(body.phone ?? address.phone)
    const line1 = String(body.line1 ?? address.line1).trim()
    const city = String(body.city ?? address.city).trim()
    const pincode = String(body.pincode ?? address.pincode).replace(/[^0-9]/g, '')

    if (fullName.length < 3) return NextResponse.json({ error: 'Enter the full name' }, { status: 400 })
    if (!isValidPhone(phone)) return NextResponse.json({ error: 'Enter a valid mobile number' }, { status: 400 })
    if (line1.length < 5) return NextResponse.json({ error: 'Enter the street address' }, { status: 400 })
    if (!city) return NextResponse.json({ error: 'City is required' }, { status: 400 })
    if (!/^[1-9][0-9]{5}$/.test(pincode)) return NextResponse.json({ error: 'Enter a valid PIN code' }, { status: 400 })

    address.fullName = fullName
    address.phone = phone
    address.line1 = line1
    if (body.line2 !== undefined) address.line2 = String(body.line2 || '').trim()
    address.city = city
    if (body.state !== undefined) address.state = String(body.state || '').trim()
    address.pincode = pincode
    if (body.label !== undefined) address.label = String(body.label || 'Home').trim() || 'Home'

    if (body.isDefault === true && !address.isDefault) {
      await Address.updateMany({ userId: user.id }, { isDefault: false })
      address.isDefault = true
    }
    await address.save()

    return NextResponse.json({ ok: true, address: safeAddress(address.toObject()) })
  } catch {
    return NextResponse.json({ error: 'Could not update the address' }, { status: 400 })
  }
}

// DELETE /api/addresses/:id — remove an address owned by the current user
export async function DELETE(_request, { params }) {
  const user = await getCurrentDbUser()
  if (!user) return NextResponse.json({ error: 'Please log in to continue' }, { status: 401 })

  try {
    const { id } = await params
    if (!(await connectDb())) {
      return NextResponse.json({ error: 'Database not reachable. Please try again.' }, { status: 503 })
    }
    const deleted = await Address.findOneAndDelete({ _id: id, userId: user.id })
    if (!deleted) return NextResponse.json({ error: 'Address not found' }, { status: 404 })

    // Promote another address to default when the default was removed
    if (deleted.isDefault) {
      const next = await Address.findOneAndUpdate(
        { userId: user.id },
        { isDefault: true },
        { sort: { createdAt: -1 } }
      )
      if (next) await next.save().catch(() => {})
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not remove the address' }, { status: 400 })
  }
}
