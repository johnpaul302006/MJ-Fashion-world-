import { redirect } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'

export default async function CategoryPage({ params }) {
  const { category } = await params
  const valid = CATEGORIES.some((c) => c.slug === category)
  redirect(valid ? `/shop?category=${category}` : '/shop')
}