'use client'

import { useState } from 'react'
import { isValidPincode, getDeliveryEstimate, getDefaultDeliveryEstimate } from '@/lib/delivery-config'

function MapPinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-500" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function DeliveryEstimator() {
  const [pincode, setPincode] = useState('')
  const [estimate, setEstimate] = useState(getDefaultDeliveryEstimate())
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState('')

  function handleCheck(e) {
    e.preventDefault()
    if (!isValidPincode(pincode)) {
      setError('Please enter a valid 6-digit Indian PIN code.')
      return
    }
    setError('')
    const res = getDeliveryEstimate(pincode)
    setEstimate(res)
    setChecked(true)
  }

  function handleReset() {
    setChecked(false)
    setPincode('')
    setError('')
  }

  return (
    <div className="py-4 border-b border-gray-100 dark:border-[#222] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">
          Delivery Options
        </h3>
        {checked && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[13px] font-semibold text-brand hover:underline"
          >
            Change PIN
          </button>
        )}
      </div>

      {!checked ? (
        <form onSubmit={handleCheck} className="space-y-2">
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <MapPinIcon />
              </span>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  setPincode(val)
                  if (error) setError('')
                }}
                placeholder="Enter 6-digit delivery PIN"
                className="w-full pl-9 pr-3 py-2 text-[14px] bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333] rounded-sm focus:outline-none focus:border-gray-900 dark:focus:border-white text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-[14px] font-bold text-brand hover:text-brand-dark border border-brand/40 hover:border-brand rounded-sm bg-brand/5 transition-colors"
            >
              Check
            </button>
          </div>
          {error && <p className="text-[13px] text-red-500 font-medium">{error}</p>}
        </form>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[14px] text-gray-800 dark:text-gray-200">
            <CheckCircleIcon />
            <span>
              Delivering to <strong className="font-semibold">{estimate.pincode}</strong>:
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {estimate.formattedDate}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">
              FREE
            </span>
          </div>
          {estimate.fastDelivery && (
            <p className="text-[13px] text-emerald-700 dark:text-emerald-400 font-medium">
              ⚡ Express 48-Hour Metro Delivery Available
            </p>
          )}
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[13px] text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
          </svg>
          <span>7-Day Return / Exchange</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <span>Cash on Delivery</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>100% Original Products</span>
        </div>
      </div>
    </div>
  )
}
