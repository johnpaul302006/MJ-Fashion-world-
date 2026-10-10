'use client'

import Link from 'next/link'

export default function WalletPage() {
  return (
    <div className="min-h-[80vh] px-4 py-8 sm:py-12 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6 font-mono">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <span className="text-white">Saved Cards & Wallet</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#cc0000]/10 border border-[#cc0000]/20 text-[#cc0000] mb-3">
          <span>💳</span> Payments & Wallet
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Saved Cards & Store Balance
        </h1>
        <p className="text-sm text-neutral-400">
          Manage your saved payment instruments and view instant refund credits.
        </p>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-[#161616] border border-neutral-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-neutral-400 block mb-1">
              Store Wallet Credit
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">₹0.00</span>
              <span className="text-xs text-emerald-400 font-medium">Available for Checkout</span>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Cancellations and instant returns are automatically credited here for 1-click reorder.
            </p>
          </div>

          <Link
            href="/shop"
            className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition self-start sm:self-auto"
          >
            Shop Collections
          </Link>
        </div>
      </div>

      {/* Supported Payment Methods */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-bold text-white">Payment Options Supported at Checkout</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl shrink-0">
              ⚡
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Instant UPI & QR Code</h4>
              <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                Pay in seconds using Google Pay, PhonePe, Paytm, or any BHIM UPI application.
              </p>
              <span className="text-[11px] font-mono text-emerald-400">✓ 0% Gateway Convenience Fee</span>
            </div>
          </div>

          <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl shrink-0">
              💳
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Credit & Debit Cards</h4>
              <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                All major Indian and international cards accepted (Visa, MasterCard, RuPay, Maestro).
              </p>
              <span className="text-[11px] font-mono text-neutral-400">256-bit SSL Bank Encrypted</span>
            </div>
          </div>

          <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl shrink-0">
              📦
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Cash on Delivery (COD)</h4>
              <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                Pay safely in cash or UPI at the doorstep when your parcel arrives.
              </p>
              <span className="text-[11px] font-mono text-neutral-400">Available across all serviceable pin codes</span>
            </div>
          </div>

          <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl shrink-0">
              🏦
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Net Banking</h4>
              <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                Direct netbanking supported for HDFC, ICICI, SBI, Axis, Kotak, and 50+ banks.
              </p>
              <span className="text-[11px] font-mono text-neutral-400">Instant Payment Confirmation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
