import { getProducts, getCategories } from '@/lib/data'
import { SITE_URL } from '@/lib/site'

export default async function sitemap() {
  const siteUrl = SITE_URL
  const now = new Date()

  // 1. Static Core Pages
  const staticRoutes = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/new-arrivals`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/coupons`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // 2. Category Pages
  let categoryRoutes = []
  try {
    const categories = await getCategories()
    categoryRoutes = (categories || []).map((cat) => ({
      url: `${siteUrl}/shop/${cat.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    }))
  } catch {
    categoryRoutes = []
  }

  // 3. Product Pages
  let productRoutes = []
  try {
    const products = await getProducts({ limit: 500 })
    productRoutes = (products || []).map((prod) => ({
      url: `${siteUrl}/product/${prod._id}`,
      lastModified: prod.updatedAt ? new Date(prod.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  } catch {
    productRoutes = []
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
