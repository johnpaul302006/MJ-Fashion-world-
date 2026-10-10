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
  { value: 'pending', label: 'Order Placed', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
  { value: 'packed', label: 'Packed', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300' },
  { value: 'shipped', label: 'Shipped', color: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
]

export const STATUS_LABEL = Object.fromEntries(ORDER_STATUS.map((s) => [s.value, s.label]))
export const STATUS_COLOR = Object.fromEntries(ORDER_STATUS.map((s) => [s.value, s.color]))

export function getStatusMeta(value) {
  const meta = ORDER_STATUS.find((s) => s.value === value)
  if (!meta) return { label: value, color: 'bg-slate-100 text-slate-700' }
  return meta
}