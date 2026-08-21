export const CATEGORIES = [
  { slug: 'boys', label: 'Boys' },
  { slug: 'girls', label: 'Girls' },
  { slug: 'children', label: 'Children' },
  { slug: 'men', label: 'Men' },
  { slug: 'women', label: 'Women' },
]

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.label]))

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size']

export const ORDER_STATUS = [
  { value: 'pending', label: 'Pending Verification', color: 'bg-amber-100 text-amber-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'shipped', label: 'Shipped', color: 'bg-violet-100 text-violet-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
]

export const STATUS_LABEL = Object.fromEntries(ORDER_STATUS.map((s) => [s.value, s.label]))
export const STATUS_COLOR = Object.fromEntries(ORDER_STATUS.map((s) => [s.value, s.color]))

export function getStatusMeta(value) {
  const meta = ORDER_STATUS.find((s) => s.value === value)
  if (!meta) return { label: value, color: 'bg-slate-100 text-slate-700' }
  return meta
}