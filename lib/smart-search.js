/**
 * Smart Search Engine for Fashion Catalog
 * Features:
 * - Query normalization & punctuation stripping
 * - Synonym equivalences (t-shirt == tshirt == tee, etc.)
 * - Singular/plural stemming
 * - Token-based strict inclusion (every token must match at least one field)
 * - Typo tolerance (1-character Levenshtein distance for tokens >= 5 chars)
 * - Weighted relevance ranking (name > category/brand > colors/tags > description)
 * - Returns ONLY relevant results; never falls back to the full catalog on unmatched queries.
 */

const SYNONYM_GROUPS = [
  ['t-shirt', 'tshirt', 'tee', 'tees', 't shirt'],
  ['hoodie', 'hoodies', 'sweatshirt', 'sweatshirts', 'hooded'],
  ['sneakers', 'sneaker', 'shoes', 'shoe', 'kicks', 'footwear'],
  ['jeans', 'jean', 'denim'],
  ['trousers', 'trouser', 'pants', 'pant', 'bottoms'],
  ['oversized', 'baggy', 'loose', 'relaxed'],
  ['jacket', 'jackets', 'coat', 'coats', 'outerwear'],
  ['shirt', 'shirts', 'buttondown'],
  ['shorts', 'short'],
  ['black', 'dark', 'noir'],
  ['white', 'light', 'blanc'],
]

// Map each word to all its synonyms in lowercase
const SYNONYM_MAP = new Map()
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    const key = word.toLowerCase().replace(/[^a-z0-9]/g, '')
    const set = SYNONYM_MAP.get(key) || new Set()
    for (const alt of group) {
      set.add(alt.toLowerCase())
      set.add(alt.toLowerCase().replace(/[^a-z0-9]/g, ''))
    }
    SYNONYM_MAP.set(key, set)
  }
}

export function normalizeWord(raw) {
  let w = String(raw || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '')
  if (w.endsWith('ies') && w.length > 4) {
    w = w.slice(0, -3) + 'y'
  } else if (w.endsWith('es') && w.length > 4) {
    w = w.slice(0, -2)
  } else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) {
    w = w.slice(0, -1)
  }
  return w
}

export function getSynonyms(word) {
  const norm = normalizeWord(word)
  const direct = SYNONYM_MAP.get(norm)
  const variants = direct ? Array.from(direct) : [word.toLowerCase(), norm]
  return Array.from(new Set([word.toLowerCase(), norm, ...variants])).filter(Boolean)
}

export function levenshteinDistance(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[a.length][b.length]
}

function fieldWords(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[\s,/\-_]+/)
    .map((w) => w.trim().replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 0)
}

function tokenMatchesField(token, synonyms, fieldString) {
  if (!fieldString) return false
  const target = String(fieldString).toLowerCase()
  const cleanTarget = target.replace(/[^a-z0-9\s]/g, ' ')

  // 1. Direct or synonym substring check
  for (const s of synonyms) {
    if (cleanTarget.includes(s) || target.includes(s)) return true
  }

  // 2. Word-level check with 1-char typo tolerance for words >= 5 characters
  const words = fieldWords(fieldString)
  for (const w of words) {
    const wNorm = normalizeWord(w)
    for (const s of synonyms) {
      if (w === s || wNorm === s) return true
      if (s.length >= 5 && w.length >= 5) {
        if (levenshteinDistance(w, s) <= 1 || levenshteinDistance(wNorm, s) <= 1) {
          return true
        }
      }
    }
  }
  return false
}

/**
 * Evaluates a product against query tokens.
 * Returns a weighted numerical score > 0 if EVERY token matches.
 * Returns 0 if any token is missing.
 */
export function scoreProduct(product, tokens) {
  if (!tokens.length) return 1

  const name = String(product.name || '')
  const category = String(product.category || '')
  const brand = String(product.brand || '')
  const description = String(product.description || '')
  const colors = Array.isArray(product.colors) ? product.colors.join(' ') : String(product.colors || '')
  const tags = Array.isArray(product.tags) ? product.tags.join(' ') : String(product.tags || '')

  let totalScore = 0

  for (const rawToken of tokens) {
    const synonyms = getSynonyms(rawToken)
    let matchedInField = false
    let tokenScore = 0

    if (tokenMatchesField(rawToken, synonyms, name)) {
      matchedInField = true
      tokenScore += 100
      // Exact substring match bonus in name
      if (name.toLowerCase().includes(rawToken.toLowerCase())) tokenScore += 30
    }

    if (tokenMatchesField(rawToken, synonyms, category)) {
      matchedInField = true
      tokenScore += 40
    }

    if (tokenMatchesField(rawToken, synonyms, brand)) {
      matchedInField = true
      tokenScore += 40
    }

    if (tokenMatchesField(rawToken, synonyms, colors)) {
      matchedInField = true
      tokenScore += 30
    }

    if (tokenMatchesField(rawToken, synonyms, tags)) {
      matchedInField = true
      tokenScore += 30
    }

    if (tokenMatchesField(rawToken, synonyms, description)) {
      matchedInField = true
      tokenScore += 10
    }

    if (!matchedInField) {
      return 0 // Every token must match at least one field!
    }

    totalScore += tokenScore
  }

  // Exact full query match bonus
  const fullQuery = tokens.join(' ').toLowerCase()
  if (name.toLowerCase().includes(fullQuery)) {
    totalScore += 50
  }

  return totalScore
}

/**
 * Filter and rank products using the Smart Search Engine.
 */
export function filterAndRankProducts(products, query) {
  if (!query || !String(query).trim()) return products

  const raw = String(query).trim().toLowerCase()
  const tokens = raw
    .split(/[\s,+/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  if (!tokens.length) return products

  const scored = []
  for (const p of products) {
    const score = scoreProduct(p, tokens)
    if (score > 0) {
      scored.push({ product: p, score })
    }
  }

  // Sort strictly descending by relevance score
  scored.sort((a, b) => b.score - a.score)

  return scored.map((item) => item.product)
}
