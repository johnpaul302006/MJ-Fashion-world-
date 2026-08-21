import { connectDb, dbConfigured } from './db'
import { User, Address } from './models'
import { getUser } from './auth'

// Resolves the full DB user document for the current session.
// Returns null when not logged in / no account record exists.
export async function getCurrentDbUser() {
  const session = await getUser()
  if (!session || !session.email) return null
  if (!dbConfigured) return null
  const conn = await connectDb()
  if (!conn) return null
  try {
    const doc = await User.findOne({ email: String(session.email).toLowerCase() })
    if (!doc) return null
    // Hosts may exist without a real signup record
    return { id: String(doc._id), name: doc.name, email: doc.email, phone: doc.phone, role: doc.role }
  } catch {
    return null
  }
}

export async function listAddresses(userId) {
  return Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean()
}

export function safeAddress(a) {
  if (!a) return null
  return {
    id: String(a._id),
    label: a.label,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 || '',
    city: a.city,
    state: a.state || '',
    pincode: a.pincode,
    country: a.country || 'India',
    isDefault: Boolean(a.isDefault),
  }
}
