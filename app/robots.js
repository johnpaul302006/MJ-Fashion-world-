export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mjfashionworld.com'

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
