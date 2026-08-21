'use client'

import { fallbackImg } from '@/lib/img-fallback'
import { imgUrl } from '@/lib/img-url'

export default function ProductImage({ src, alt = '', className }) {
  if (!src) return null
  return <img src={imgUrl(src)} alt={alt} onError={fallbackImg} className={className} loading="lazy" />
}