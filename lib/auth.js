import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'adminsession'

function secretKey() {
  return new TextEncoder().encode(
    process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'change-me-please'
  )
}

export async function isAdmin() {
  try {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token) return false
    await jwtVerify(token, secretKey())
    return true
  } catch {
    return false
  }
}

export async function loginAdmin(password) {
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) return false
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey())
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  })
  return true
}

export async function logoutAdmin() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function createUserSession(email, role) {
  const token = await new SignJWT({ email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(role === 'host' ? '7d' : '60d')
    .sign(secretKey())
  const store = await cookies()
  const maxAge = role === 'host' ? 60 * 60 * 24 * 7 : 60 * 60 * 24 * 60
  const opts = {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
    secure: process.env.NODE_ENV === 'production',
  }
  store.set('usersession', token, opts)
  if (role === 'host') store.set(COOKIE_NAME, token, opts)
}

export async function getUser() {
  try {
    const store = await cookies()
    const token = store.get('usersession')?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, secretKey())
    return { email: payload.email, role: payload.role }
  } catch {
    return null
  }
}

export async function logoutUser() {
  const store = await cookies()
  store.delete('usersession')
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }
}