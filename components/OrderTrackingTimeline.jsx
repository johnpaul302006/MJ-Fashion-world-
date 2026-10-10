'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const STAGES = [
  { key: 'pending', title: 'Order Placed', desc: 'We received your order and are preparing it.' },
  { key: 'confirmed', title: 'Order Confirmed', desc: 'Order details verified and sent to warehouse.' },
  { key: 'packed', title: 'Packed & Quality Checked', desc: 'Your apparel is carefully inspected and packed.' },
  { key: 'shipped', title: 'Handed to Courier', desc: 'Package in transit with our logistics partner.' },
  { key: 'out_for_delivery', title: 'Out for Delivery', desc: 'Courier agent is on the way to your doorstep.' },
  { key: 'delivered', title: 'Delivered', desc: 'Delivered successfully to the recipient.' },
]

function getStageIndex(status) {
  switch (status) {
    case 'delivered':
      return 5
    case 'out_for_delivery':
      return 4
    case 'shipped':
      return 3
    case 'packed':
      return 2
    case 'confirmed':
      return 1
    case 'pending':
    default:
      return 0
  }
}

function formatStageTime(dateStr) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

export default function OrderTrackingTimeline({ order }) {
  const currentIdx = getStageIndex(order?.status)
  const isCancelled = order?.status === 'cancelled'
  const isRejected = order?.status === 'rejected'

  const lineRef = useRef(null)
  const dotsRef = useRef([])

  useEffect(() => {
    if (isCancelled || isRejected) return

    const percent = Math.min(1, Math.max(0, currentIdx / (STAGES.length - 1)))
    if (lineRef.current) {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: percent,
          duration: 1,
          ease: 'power3.out',
          transformOrigin: 'top center',
        }
      )
    }

    // Gentle pulse animation on active dot
    const activeDot = dotsRef.current[currentIdx]
    if (activeDot) {
      gsap.fromTo(
        activeDot,
        { scale: 0.9 },
        { scale: 1.08, repeat: -1, yoyo: true, duration: 1.2, ease: 'sine.inOut' }
      )
    }
  }, [currentIdx, isCancelled, isRejected])

  if (isCancelled) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center text-neutral-300">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3 text-xl">
          ✕
        </div>
        <h4 className="text-base font-bold text-white mb-1">Order Cancelled</h4>
        <p className="text-xs text-neutral-400">
          This order was cancelled. Any online pre-payments are automatically refunded to your original payment method.
        </p>
      </div>
    )
  }

  if (isRejected) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center text-neutral-300">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3 text-xl">
          ✕
        </div>
        <h4 className="text-base font-bold text-white mb-1">Order Rejected</h4>
        <p className="text-xs text-neutral-400">
          This order could not be fulfilled by the seller. Please contact support if you require assistance.
        </p>
      </div>
    )
  }

  const tracking = order?.tracking || {}
  const statusTimestamps = order?.statusTimestamps || {}
  const currentLocation = tracking.currentLocation || (
    currentIdx >= 5
      ? 'Delivered to recipient address'
      : currentIdx >= 4
      ? 'Out for delivery with courier rider'
      : currentIdx >= 3
      ? 'Departed origin hub · In transit'
      : currentIdx >= 2
      ? 'Fulfillment center: Packed and waiting for courier dispatch'
      : currentIdx >= 1
      ? 'Order confirmed: Processing in warehouse'
      : 'Order placed: Awaiting verification'
  )

  return (
    <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl">
      {/* Current Location Alert Card */}
      <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-900 border border-[#cc0000]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#cc0000]/20 text-[#cc0000] flex items-center justify-center shrink-0 mt-0.5">
            📍
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-neutral-400 block">
              Current Location &amp; Status
            </span>
            <p className="text-sm font-semibold text-white mt-0.5">
              {currentLocation}
            </p>
          </div>
        </div>

        {tracking.eta && (
          <div className="sm:text-right shrink-0">
            <span className="text-[10px] text-neutral-400 block">Estimated Delivery</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">{tracking.eta}</span>
          </div>
        )}
      </div>

      {/* Courier details badge if available */}
      {(tracking.courier || tracking.number) && (
        <div className="mb-6 px-4 py-3 bg-neutral-900/90 rounded-xl border border-neutral-800 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Logistics Partner:</span>
            <span className="font-bold text-white">{tracking.courier || 'Express Logistics'}</span>
            {tracking.number && (
              <>
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-400">AWB:</span>
                <span className="font-mono font-bold text-[#cc0000] bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                  {tracking.number}
                </span>
              </>
            )}
          </div>
          {tracking.url && (
            <a
              href={tracking.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#cc0000] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Live Courier Portal</span>
              <span>↗</span>
            </a>
          )}
        </div>
      )}

      {/* Vertical Animated Timeline */}
      <div className="relative pl-8 sm:pl-10 space-y-7 sm:space-y-8">
        {/* Background Grey Line */}
        <div className="absolute left-[13px] sm:left-[17px] top-3 bottom-3 w-[2px] bg-neutral-800 rounded-full" />

        {/* Animated Active Line */}
        <div
          ref={lineRef}
          className="absolute left-[13px] sm:left-[17px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-[#cc0000] to-red-500 rounded-full origin-top"
        />

        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isPending = idx > currentIdx

          // Determine timestamp for this milestone
          let timeVal = null
          if (stage.key === 'pending') {
            timeVal = statusTimestamps.placed || order?.createdAt
          } else if (stage.key === 'confirmed') {
            timeVal = statusTimestamps.confirmed
          } else if (stage.key === 'packed') {
            timeVal = statusTimestamps.packed
          } else if (stage.key === 'shipped') {
            timeVal = statusTimestamps.shipped
          } else if (stage.key === 'out_for_delivery') {
            timeVal = statusTimestamps.out_for_delivery
          } else if (stage.key === 'delivered') {
            timeVal = statusTimestamps.delivered || order?.deliveredAt
          }
          const formattedTime = formatStageTime(timeVal)

          return (
            <div key={stage.key} className="relative flex items-start gap-4 group">
              {/* Node Icon */}
              <div
                ref={(el) => {
                  dotsRef.current[idx] = el
                }}
                className={`absolute -left-8 sm:-left-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                  isDone
                    ? 'bg-[#cc0000] text-white shadow-[#cc0000]/30'
                    : isCurrent
                    ? 'bg-red-600 text-white ring-4 ring-red-500/20 shadow-red-500/50'
                    : 'bg-neutral-900 border border-neutral-700 text-neutral-500'
                }`}
              >
                {isDone ? (
                  '✓'
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                ) : (
                  idx + 1
                )}
              </div>

              {/* Stage Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4
                    className={`text-sm font-bold tracking-tight ${
                      isCurrent
                        ? 'text-white font-extrabold'
                        : isDone
                        ? 'text-neutral-200'
                        : 'text-neutral-500'
                    }`}
                  >
                    {stage.title}
                  </h4>
                  {formattedTime && (
                    <span className="text-[11px] font-mono text-neutral-400">
                      {formattedTime}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    isCurrent
                      ? 'text-neutral-300 font-medium'
                      : isDone
                      ? 'text-neutral-400'
                      : 'text-neutral-600'
                  }`}
                >
                  {stage.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
