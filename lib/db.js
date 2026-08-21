import mongoose from 'mongoose'
import dns from 'node:dns'

const MONGODB_URI = process.env.MONGODB_URI

export const dbConfigured = Boolean(MONGODB_URI)

const cached = globalThis.__mongoCache || (globalThis.__mongoCache = {})

const PUBLIC_DNS = ['8.8.8.8', '1.1.1.1']
const CONNECT_TIMEOUT_MS = 6000
const FAIL_COOLDOWN_MS = 30000

let dnsFixed = false

function withTimeout(fn, ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms)
    fn((err, value) => {
      clearTimeout(timer)
      resolve(err ? null : value)
    })
  })
}

// Some ISP/office DNS servers refuse Node's SRV queries (querySrv ECONNREFUSED)
// even though browsers/Windows work fine. We probe with the current resolver; if
// it fails we switch Node to public DNS and re-probe.
async function dnsResolvesSrv(host) {
  return Boolean(await withTimeout((cb) => dns.resolveSrv(`_mongodb._tcp.${host}`, cb), 4000))
}

async function fixDnsIfNeeded() {
  if (dnsFixed || !MONGODB_URI || !MONGODB_URI.startsWith('mongodb+srv://')) return
  dnsFixed = true
  const host = MONGODB_URI.split('@')[1]?.split('/')[0]
  if (!host) return
  if (await dnsResolvesSrv(host)) return // current DNS works fine
  const original = dns.getServers()
  try {
    dns.setServers(PUBLIC_DNS)
    if (await dnsResolvesSrv(host)) {
      console.log('[db] switched to public DNS for MongoDB SRV resolution')
      return
    }
    dns.setServers(original) // public DNS also blocked — restore, stop trying
    cached.dnsBlocked = true
    console.warn('[db] DNS resolution blocked — MongoDB is unreachable')
  } catch (err) {
    console.error('[db] could not set DNS servers:', err.message)
  }
}

// Resolve the shard hosts + TXT params ourselves and build a plain mongodb://
// URI, so the MongoDB driver never touches DNS (which is broken on some ISPs).
async function buildDirectUri() {
  if (cached.directUri) return cached.directUri
  const url = new URL(MONGODB_URI)
  const host = url.hostname
  const srv = await withTimeout((cb) => dns.resolveSrv(`_mongodb._tcp.${host}`, cb), 4000)
  if (!srv || srv.length === 0) return null
  const txt = await withTimeout((cb) => dns.resolveTxt(host, cb), 4000)
  const txtParams = txt ? txt.flat().join('&') : ''
  const auth = url.username ? `${url.username}:${url.password}@` : ''
  const dbName = url.pathname.replace(/^\//, '')
  const hosts = srv.map((h) => `${h.name}:${h.port}`).join(',')
  const params = new URLSearchParams(url.search.replace(/^\?/, ''))
  for (const [k, v] of new URLSearchParams(txtParams)) {
    if (!params.has(k)) params.set(k, v)
  }
  params.set('tls', 'true')
  cached.directUri = `mongodb://${auth}${hosts}/${dbName}?${params.toString()}`
  return cached.directUri
}

export function isDbConnected() {
  return Boolean(cached.conn && cached.conn.readyState === 1)
}

export async function connectDb() {
  if (!MONGODB_URI) return null
  if (isDbConnected()) return cached.conn
  if (cached.dnsBlocked) return null
  if (cached.failedAt && Date.now() - cached.failedAt < FAIL_COOLDOWN_MS) return null
  await fixDnsIfNeeded()
  if (cached.dnsBlocked) return null

  let connectUri = MONGODB_URI
  if (MONGODB_URI.startsWith('mongodb+srv://')) {
    connectUri = (await buildDirectUri()) || null
  }
  if (!connectUri) {
    cached.failedAt = Date.now()
    return null
  }

  try {
    const conn = await mongoose.connect(connectUri, {
      serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
      bufferCommands: false,
    })
    cached.conn = conn
    delete cached.failedAt
    return conn
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    cached.failedAt = Date.now()
    return null
  }
}