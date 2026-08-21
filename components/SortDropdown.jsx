'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'priceLow', label: 'Price: Low to High' },
  { value: 'priceHigh', label: 'Price: High to Low' },
  { value: 'discount', label: 'Discount %' },
]

export default function SortDropdown() {
  const router = useRouter()
  const sp = useSearchParams()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = sp.get('sort') || ''

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function choose(value) {
    setOpen(false)
    const params = new URLSearchParams(sp.toString())
    if (value) params.set('sort', value)
    else params.delete('sort')
    router.push(`/shop?${params.toString()}`)
  }

  const label = OPTIONS.find((o) => o.value === current)?.label || 'Newest First'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:border-brand"
      >
        ⇅ Sort: {label}
      </button>
      {open ? (
        <div className="absolute right-0 mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl min-w-48 overflow-hidden">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => choose(o.value)}
              className={`block w-full text-left px-3 py-2 text-sm ${
                current === o.value
                  ? 'bg-brand-faint dark:bg-brand-deep font-bold text-brand dark:text-amber-300'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}