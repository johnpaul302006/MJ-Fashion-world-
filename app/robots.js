import { SITE_URL } from '@/lib/site'

export default function robots() {
  const siteUrl = SITE_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/shop',
          '/shop/*',
          '/product/*',
          '/new-arrivals',
          '/coupons',
          '/api/products/*/image',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/order/*/invoice',
          '/checkout',
          '/profile',
          '/wallet',
          '/rewards',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
