import crypto from 'node:crypto'

// Password hashing with Node's built-in scrypt (memory-hard KDF).
// Stored format: scrypt$<saltHex>$<hashHex>
const KEYLEN = 64
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 }

export function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(String(password), salt, KEYLEN, SCRYPT_OPTS)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password, stored) {
  try {
    const parts = String(stored || '').split('$')
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false
    const salt = Buffer.from(parts[1], 'hex')
    const expected = Buffer.from(parts[2], 'hex')
    const actual = crypto.scryptSync(String(password), salt, expected.length, SCRYPT_OPTS)
    return crypto.timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function passwordIssues(password) {
  const pw = String(password || '')
  const issues = []
  if (pw.length < 8) issues.push('at least 8 characters')
  if (!/[a-zA-Z]/.test(pw)) issues.push('one letter')
  if (!/[0-9]/.test(pw)) issues.push('one number')
  return issues
}

export function normalizePhone(raw) {
  let p = String(raw || '').replace(/[^0-9]/g, '')
  if (p.length === 12 && p.startsWith('91')) p = p.slice(2)
  if (p.length === 11 && p.startsWith('0')) p = p.slice(1)
  return p
}

export function isValidPhone(raw) {
  return /^[6-9][0-9]{9}$/.test(normalizePhone(raw))
}

export function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(String(email || '').trim())
}

// Random URL-safe token + its SHA-256 hash (only the hash is stored in DB)
export function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex')
  return { token, tokenHash: sha256(token) }
}

export function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}
