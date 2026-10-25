'use client'

import { useEffect } from 'react'

export default function PackingSlipControls({ autoPrint }) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [autoPrint])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        <span>Print Packing Slip</span>
      </button>
    </div>
  )
}
