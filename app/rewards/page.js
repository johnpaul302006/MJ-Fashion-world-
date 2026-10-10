'use client'

import Link from 'next/link'

export default function RewardsPage() {
  const supercoins = 150

  return (
    <div className="min-h-[80vh] px-4 py-8 sm:py-12 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6 font-mono">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <span className="text-white">Rewards & Supercoin</span>
      </nav>

      {/* Hero Balance Card */}
      <div className="bg-gradient-to-br from-amber-500/10 via-[#161616] to-[#121212] border border-amber-500/30 rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
              <span>🪙</span> SuperCoin Balance
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {supercoins}
              </span>
              <span className="text-base sm:text-lg font-bold text-amber-400">Coins</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-md">
              Earn 2 SuperCoins for every ₹100 spent on fashion orders. Use your coins to unlock exclusive vouchers and bonus perks.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href="/shop"
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition text-center shadow-lg shadow-amber-500/20"
            >
              Earn More Coins
            </Link>
            <span className="text-[11px] text-neutral-500 text-center">1 Coin = ₹1 Voucher Value</span>
          </div>
        </div>
      </div>

      {/* Rewards Catalog */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-bold text-white">Redeem Rewards</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: '₹100 Off Voucher', coins: 100, tag: 'Fashion Discount', desc: 'Valid on orders above ₹999 across all clothing.' },
            { title: 'Free Express Delivery', coins: 50, tag: 'Shipping Perk', desc: 'Get guaranteed next-day delivery on your next purchase.' },
            { title: '₹250 Off Voucher', coins: 250, tag: 'VIP Reward', desc: 'Valid on footwear & outerwear collections above ₹1999.' },
          ].map((r, i) => (
            <div
              key={i}
              className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-700 transition"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 inline-block mb-3">
                  {r.tag}
                </span>
                <h4 className="text-base font-bold text-white mb-1">{r.title}</h4>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">{r.desc}</p>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">🪙 {r.coins} Coins</span>
                <button
                  type="button"
                  disabled={supercoins < r.coins}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                >
                  {supercoins >= r.coins ? 'Redeem' : 'Locked'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-white mb-3">How SuperCoins Work</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-400">
          <div>
            <span className="text-white font-semibold block mb-1">1. Shop & Earn</span>
            Place any order on our store. SuperCoins are automatically credited to your balance when delivery completes.
          </div>
          <div>
            <span className="text-white font-semibold block mb-1">2. Unlock Rewards</span>
            Convert your coins into instant discounts, free delivery passes, or gift hampers at checkout.
          </div>
          <div>
            <span className="text-white font-semibold block mb-1">3. Never Expire</span>
            Active accounts retain their SuperCoin balance with zero expiration dates.
          </div>
        </div>
      </div>
    </div>
  )
}
