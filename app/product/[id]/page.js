import { notFound } from 'next/navigation'
import { getProduct, getProducts } from '@/lib/data'
import { SITE_URL } from '@/lib/site'
import ProductDetailsClient from '@/components/pdp/ProductDetailsClient'

export async function generateMetadata({ params }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) {
    return { title: 'Product Not Found | MJ Fashion World' }
  }

  const siteUrl = SITE_URL
  const canonicalUrl = `${siteUrl}/product/${product._id}`
  const description =
    product.description ||
    `Shop ${product.name} at ₹${product.price} (MRP ₹${product.mrp || product.price}) on MJ Fashion World. 100% Genuine, Fast Delivery & Easy 7-Day Returns.`

  // Always point to our dedicated public image route to ensure WhatsApp & Facebook crawlers
  // get a clean binary JPEG image even when products have Base64 images from admin uploads.
  const publicImageUrl = `${siteUrl}/api/products/${product._id}/image`

  return {
    title: `${product.name} | MJ Fashion World`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: `${product.name} — ₹${product.price} | MJ Fashion World`,
      description,
      siteName: 'MJ Fashion World',
      images: [
        {
          url: publicImageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — ₹${product.price} | MJ Fashion World`,
      description,
      images: [publicImageUrl],
    },
    other: {
      'product:price:amount': String(product.price),
      'product:price:currency': 'INR',
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
      'product:brand': product.brand || 'MJ Fashion World',
      'product:condition': 'new',
    },
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  // Fetch similar products from same category
  const allCategoryProducts = await getProducts({ category: product.category, limit: 12 })
  const similarProducts = (allCategoryProducts || [])
    .filter((p) => String(p._id) !== String(product._id))
    .slice(0, 8)

  // Construct JSON-LD Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images && product.images.length > 0 ? product.images : [product.image],
    description: product.description || `${product.name} available at MJ Fashion World`,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'MJ Fashion World',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'MJ Fashion World',
      },
    },
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0c0e12]">
      {/* JSON-LD for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <ProductDetailsClient
          product={product}
          similarProducts={similarProducts}
        />
      </main>
    </div>
  )
}
