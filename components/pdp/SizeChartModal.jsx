'use client'

import { useState, useEffect } from 'react'

export default function SizeChartModal({ isOpen, onClose, category = 'men' }) {
  const [unit, setUnit] = useState('in') // 'in' or 'cm'

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Sizing data in inches
  const sizeData = [
    { size: 'S', chestIn: 38, chestCm: 96, lengthIn: 27, lengthCm: 68, shoulderIn: 16.5, shoulderCm: 42 },
    { size: 'M', chestIn: 40, chestCm: 101, lengthIn: 28, lengthCm: 71, shoulderIn: 17.5, shoulderCm: 44 },
    { size: 'L', chestIn: 42, chestCm: 106, lengthIn: 29, lengthCm: 73, shoulderIn: 18.5, shoulderCm: 47 },
    { size: 'XL', chestIn: 44, chestCm: 111, lengthIn: 30, lengthCm: 76, shoulderIn: 19.5, shoulderCm: 49 },
    { size: 'XXL', chestIn: 46, chestCm: 116, lengthIn: 31, lengthCm: 78, shoulderIn: 20.5, shoulderCm: 52 },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#333] rounded-sm max-w-lg w-full p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262626] pb-3">
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">
              Size Chart & Fit Guide
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 capitalize">
              Standard garment measurements ({category})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Close size guide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Unit Selector (Inches / CM) */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-600 dark:text-gray-300 font-medium">
            Measurement Unit:
          </span>
          <div className="inline-flex rounded-sm border border-gray-200 dark:border-[#333] p-0.5 bg-gray-50 dark:bg-[#202020]">
            <button
              type="button"
              onClick={() => setUnit('in')}
              className={`px-3 py-1 text-[13px] font-semibold rounded-sm transition-all ${
                unit === 'in'
                  ? 'bg-white dark:bg-[#111] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Inches (in)
            </button>
            <button
              type="button"
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 text-[13px] font-semibold rounded-sm transition-all ${
                unit === 'cm'
                  ? 'bg-white dark:bg-[#111] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Centimeters (cm)
            </button>
          </div>
        </div>

        {/* Measurement Table */}
        <div className="overflow-x-auto border border-gray-200 dark:border-[#2a2a2a] rounded-sm">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-gray-50 dark:bg-[#1f1f1f] border-b border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-300 font-semibold text-[13px]">
              <tr>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Chest ({unit})</th>
                <th className="py-2.5 px-3">Length ({unit})</th>
                <th className="py-2.5 px-3">Shoulder ({unit})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#262626] text-gray-800 dark:text-gray-200">
              {sizeData.map((row) => (
                <tr key={row.size} className="hover:bg-gray-50/50 dark:hover:bg-[#1b1b1b] transition-colors">
                  <td className="py-2.5 px-3 font-bold">{row.size}</td>
                  <td className="py-2.5 px-3">{unit === 'in' ? row.chestIn : row.chestCm}</td>
                  <td className="py-2.5 px-3">{unit === 'in' ? row.lengthIn : row.lengthCm}</td>
                  <td className="py-2.5 px-3">{unit === 'in' ? row.shoulderIn : row.shoulderCm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* How to Measure Tip */}
        <div className="bg-gray-50 dark:bg-[#1c1c1c] p-3 rounded-sm border border-gray-200/60 dark:border-[#2a2a2a] text-[13px] text-gray-500 dark:text-gray-400 space-y-1">
          <p className="font-semibold text-gray-700 dark:text-gray-300">Measuring Tips:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li><strong>Chest:</strong> Measure around the fullest part of the chest.</li>
            <li><strong>Length:</strong> Measure from highest point of the shoulder down to bottom hem.</li>
            <li>If between sizes, we recommend sizing up for a relaxed fit.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
