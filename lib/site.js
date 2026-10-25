/**
 * Central site URL configuration.
 * Always resolves to the verified production domain when deployed,
 * or localhost in development, unless overridden by NEXT_PUBLIC_SITE_URL.
 */
export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, '')
  }
  if (process.env.URL && process.env.URL.trim()) {
    return process.env.URL.trim().replace(/\/$/, '')
  }
  if (process.env.DEPLOY_PRIME_URL && process.env.DEPLOY_PRIME_URL.trim()) {
    return process.env.DEPLOY_PRIME_URL.trim().replace(/\/$/, '')
  }
  return 'https://mjfashionworld.netlify.app'
}

export const SITE_URL = getSiteUrl()
