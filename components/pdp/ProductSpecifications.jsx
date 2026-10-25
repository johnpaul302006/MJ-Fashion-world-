'use client'

import { useState } from 'react'

function ChevronDown({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 text-gray-500 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function ProductSpecifications({ specifications = [] }) {
  // If specifications is empty, don't crash
  const specs = Array.isArray(specifications) ? specifications : []

  // Default all open
  const [openGroups, setOpenGroups] = useState(() => {
    return specs.reduce((acc, curr, idx) => {
      acc[curr.group || idx] = true
      return acc
    }, {})
  })

  function toggleGroup(key) {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (specs.length === 0) return null

  return (
    <div className="py-4 border-b border-gray-100 dark:border-[#222] space-y-4">
      <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">
        Specifications
      </h3>

      <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-sm divide-y divide-gray-200 dark:divide-[#2a2a2a] overflow-hidden">
        {specs.map((groupObj, groupIdx) => {
          const groupTitle = groupObj.group || `Group ${groupIdx + 1}`
          const isOpen = Boolean(openGroups[groupTitle] ?? true)
          const items = Array.isArray(groupObj.items) ? groupObj.items : []

          return (
            <div key={groupIdx} className="bg-white dark:bg-[#161616]">
              {/* Group Accordion Header */}
              <button
                type="button"
                onClick={() => toggleGroup(groupTitle)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/60 dark:bg-[#1a1a1a] hover:bg-gray-100/60 dark:hover:bg-[#202020] transition-colors text-left"
                aria-expanded={isOpen}
              >
                <span className="text-[14px] font-semibold text-gray-900 dark:text-white">
                  {groupTitle}
                </span>
                <ChevronDown open={isOpen} />
              </button>

              {/* Group Table Body */}
              {isOpen && (
                <div className="px-4 py-2">
                  <table className="w-full text-left text-[14px]">
                    <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                      {items.map((row, itemIdx) => (
                        <tr key={itemIdx} className="hover:bg-gray-50/40 dark:hover:bg-[#1a1a1a]/50">
                          <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400 font-normal w-2/5 sm:w-1/3 align-top">
                            {row.label}
                          </td>
                          <td className="py-2.5 text-gray-900 dark:text-gray-200 font-medium align-top">
                            {row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
