'use client'

import Link from 'next/link'

export default function MembershipPage() {
  return (
    <div className="min-h-[80vh] px-4 py-8 sm:py-12 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6 font-mono">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <span className="text-white">Membership / Plus</span>
      </nav>

      {/* Hero Membership Banner */}
      <div className="bg-gradient-to-br from-purple-950/40 via-[#161616] to-black border border-purple-500/30 rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-3">
            <span>⭐</span> Plus VIP Membership
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Elevate Your Fashion Experience
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed mb-6">
            Enjoy unlimited free delivery, 2-hour priority customer support, early access to new collections, and double reward coins on every order.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/30">
              Active Member
            </span>
            <span className="text-xs text-neutral-400">Renews automatically with your active orders</span>
          </div>
        </div>
      </div>

      {/* Perks Grid */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-bold text-white">Your Plus Privileges</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: '🚚', title: 'Zero Delivery Fees', desc: 'Enjoy unlimited standard delivery across India on every clothing and accessory order, with no minimum cart amount.' },
            { icon: '⚡', title: 'Early Access to Drops', desc: 'Shop seasonal sales and limited streetwear drops 24 hours before the general public.' },
            { icon: '🪙', title: '2X SuperCoin Multiplier', desc: 'Earn double coins on all purchases to redeem even larger discount vouchers.' },
            { icon: '✨', title: 'Hassle-Free Returns', desc: 'Enjoy extended 15-day return and instant exchange pick-up with dedicated courier priority.' },
          ].map((perk, i) => (
            <div
              key={i}
              className="bg-[#161616] border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl shrink-0">
                {perk.icon}
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">{perk.title}</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">{perk.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold uppercase tracking-wider transition shadow-lg shadow-[#cc0000]/20"
        >
          <span>Start Shopping with Plus Perks</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
