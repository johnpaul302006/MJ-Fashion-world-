'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function GiftCardsPage() {
  const [selectedDenom, setSelectedDenom] = useState(1000)
  const [gcCode, setGcCode] = useState('')
  const [balanceResult, setBalanceResult] = useState(null)
  const [checking, setChecking] = useState(false)

  const handleCheckBalance = (e) => {
    e.preventDefault()
    if (!gcCode.trim()) return
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      setBalanceResult({ code: gcCode.trim().toUpperCase(), balance: 0, status: 'No active card found with this code' })
    }, 700)
  }

  return (
    <div className="min-h-[80vh] px-4 py-8 sm:py-12 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6 font-mono">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <span className="text-white">Gift Cards</span>
      </nav>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#cc0000]/10 border border-[#cc0000]/20 text-[#cc0000] mb-3">
          <span>🎁</span> Digital E-Gift Cards
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Give the Gift of Style
        </h1>
        <p className="text-sm text-neutral-400">
          Send an instant digital gift card to family or friends for birthdays, celebrations, or holidays.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Gift Card Purchase Visualizer */}
        <div className="bg-[#161616] border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="h-44 sm:h-48 rounded-2xl bg-gradient-to-tr from-[#cc0000] via-red-900 to-black p-6 flex flex-col justify-between text-white shadow-xl relative overflow-hidden mb-6">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase tracking-widest font-mono opacity-80">Fashion E-Gift Voucher</span>
                <span className="text-xl">🎁</span>
              </div>
              <div>
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                  ₹{selectedDenom}
                </span>
                <span className="text-[11px] opacity-75 mt-1 block font-mono">Redeemable on all products</span>
              </div>
            </div>

            <label className="block text-xs font-semibold text-neutral-300 mb-2">Choose Voucher Value</label>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[500, 1000, 2500, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelectedDenom(val)}
                  className={`h-11 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    selectedDenom === val
                      ? 'bg-[#cc0000] text-white border-[#cc0000] ring-2 ring-[#cc0000]/20'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          <Link
            href="/shop"
            className="w-full h-12 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white font-semibold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-[#cc0000]/20"
          >
            <span>Buy Gift Card (₹{selectedDenom})</span>
            <span>→</span>
          </Link>
        </div>

        {/* Check Gift Card Balance Form */}
        <div className="bg-[#161616] border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-2">Check Gift Card Balance</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Already have an e-gift card? Enter the 16-character code below to verify your active balance.
            </p>

            <form onSubmit={handleCheckBalance} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 font-medium mb-1.5">Gift Card Code</label>
                <input
                  type="text"
                  value={gcCode}
                  onChange={(e) => setGcCode(e.target.value)}
                  placeholder="e.g. GC-9281-4402-9182"
                  className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 text-sm font-mono focus:border-[#cc0000] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={checking}
                className="w-full h-11 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
              >
                {checking ? 'Checking Balance...' : 'Check Balance'}
              </button>
            </form>

            {balanceResult && (
              <div className="mt-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                <p className="text-neutral-400 mb-1">
                  Card: <span className="text-white font-mono">{balanceResult.code}</span>
                </p>
                <p className="text-rose-400">{balanceResult.status}</p>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-neutral-800/80 text-[11px] text-neutral-500">
            Gift cards have a validity of 1 year from the date of issuance and can be combined with active promotional coupon codes.
          </div>
        </div>
      </div>
    </div>
  )
}
