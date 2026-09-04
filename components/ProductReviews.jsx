'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

/* ── Star icons ─────────────────────────── */
function Star({ filled, half, size = 18, onClick, interactive }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#f59e0b' : 'none'}
      stroke={filled || half ? '#f59e0b' : '#d1d5db'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      onClick={onClick}
      className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''}
      style={interactive ? { touchAction: 'manipulation' } : {}}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function Stars({ rating, size = 18 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= Math.round(rating)} size={size} />
      ))}
    </div>
  )
}

function InteractiveStars({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          style={{ touchAction: 'manipulation' }}
        >
          <Star filled={n <= (hover || value)} size={size} interactive />
        </span>
      ))}
    </div>
  )
}

/* ── Rating summary bar ────────────────── */
function RatingBar({ star, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right font-semibold text-gray-600 dark:text-gray-400">{star}</span>
      <Star filled size={12} />
      <div className="flex-1 h-2 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-gray-400 dark:text-gray-500">{count}</span>
    </div>
  )
}

/* ── Time ago ──────────────────────────── */
function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export default function ProductReviews({ productId }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [avg, setAvg] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState({ text: '', ok: false })

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`)
      const data = await res.json()
      setReviews(data.reviews || [])
      setAvg(data.avg || 0)
      setCount(data.count || 0)

      // If user already reviewed, pre-fill the form
      if (data.reviews) {
        const own = data.reviews.find((r) => r.isOwn)
        if (own) {
          setRating(own.rating)
          setFeedback(own.feedback || '')
        }
      }
    } catch {
      // silently fail — reviews are non-critical
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    setReviews([])
    setAvg(0)
    setCount(0)
    setLoading(true)
    setShowForm(false)
    setRating(0)
    setFeedback('')
    setMsg({ text: '', ok: false })
    load()
  }, [productId, load])

  async function submit(e) {
    e.preventDefault()
    if (!user) {
      setMsg({ text: 'Please log in to submit a review.', ok: false })
      return
    }
    if (rating < 1 || rating > 5) {
      setMsg({ text: 'Please select a rating (1–5 stars).', ok: false })
      return
    }
    setSubmitting(true)
    setMsg({ text: '', ok: false })
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback: feedback.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit review')
      setMsg({ text: 'Review submitted successfully!', ok: true })
      setShowForm(false)
      await load()
    } catch (err) {
      setMsg({ text: err.message, ok: false })
    } finally {
      setSubmitting(false)
    }
  }

  const existingReview = reviews.find((r) => r.isOwn)

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="mt-10 bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-sm overflow-hidden">
      {/* ── Section Header ──────────────── */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-[#222]">
        <h2 className="text-base font-black uppercase tracking-widest text-gray-900 dark:text-white">
          Ratings & Reviews
        </h2>
      </div>

      <div className="px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-brand rounded-full animate-spin" />
            Loading reviews…
          </div>
        ) : (
          <>
            {/* ── Rating Summary ────────────── */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-6">
              {/* Left — big number */}
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">
                    {count > 0 ? avg.toFixed(1) : '—'}
                  </span>
                  <span className="text-lg text-gray-400 font-medium">/ 5</span>
                </div>
                <Stars rating={avg} size={20} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {count} {count === 1 ? 'Rating' : 'Ratings'}
                </p>
              </div>

              {/* Right — distribution bars */}
              {count > 0 && (
                <div className="flex-1 max-w-xs space-y-1">
                  {dist.map((d) => (
                    <RatingBar key={d.star} star={d.star} count={d.count} total={count} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Write Review Button ────────── */}
            <div className="mb-6">
              {msg.text && (
                <p className={`text-sm font-semibold mb-2 ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {msg.text}
                </p>
              )}

              {!showForm ? (
                <button
                  onClick={() => {
                    if (!user) {
                      setMsg({ text: 'Please log in to write a review.', ok: false })
                      return
                    }
                    setShowForm(true)
                    if (existingReview) {
                      setRating(existingReview.rating)
                      setFeedback(existingReview.feedback || '')
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-[#111] dark:bg-white text-white dark:text-[#111] font-bold px-5 py-2.5 text-sm tracking-wider uppercase hover:opacity-80 transition-opacity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  {existingReview ? 'Edit Your Review' : 'Write a Review'}
                </button>
              ) : (
                /* ── Review Form ───────────── */
                <form onSubmit={submit} className="bg-gray-50 dark:bg-[#0f0f0f] border border-gray-100 dark:border-[#222] rounded-sm p-4 sm:p-5 max-w-lg space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Your Rating *
                    </p>
                    <InteractiveStars value={rating} onChange={setRating} size={32} />
                    {rating > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Your Feedback
                    </p>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Write your experience with this product…"
                      rows={3}
                      maxLength={2000}
                      className="w-full border border-gray-200 dark:border-[#333] dark:bg-[#1a1a1a] dark:text-white rounded-sm px-3 py-2 text-sm outline-none focus:border-brand transition-colors resize-none"
                    />
                    <p className="text-[10px] text-gray-400 text-right">{feedback.length}/2000</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={submitting || rating < 1}
                      className="bg-brand hover:bg-brand-dark disabled:bg-gray-300 disabled:dark:bg-gray-700 text-white font-bold px-6 py-2.5 text-sm tracking-wider uppercase transition-colors"
                    >
                      {submitting ? 'Submitting…' : existingReview ? 'Update Review' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ── Review List ────────────────── */}
            {reviews.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 pb-2 border-b border-gray-100 dark:border-[#222]">
                  Customer Reviews ({count})
                </h3>
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div
                      key={r._id}
                      className={`border border-gray-100 dark:border-[#222] rounded-sm p-4 ${
                        r.isOwn ? 'bg-brand/5 border-brand/20' : 'bg-white dark:bg-[#0f0f0f]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Stars rating={r.rating} size={14} />
                          {r.feedback && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed whitespace-pre-wrap">
                              {r.feedback}
                            </p>
                          )}
                        </div>
                        {r.isOwn && (
                          <span className="shrink-0 text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            You
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                        <span className="font-semibold">{r.userName || 'Customer'}</span>
                        <span>·</span>
                        <span>{timeAgo(r.createdAt)}</span>
                        {r.updatedAt && r.updatedAt !== r.createdAt && (
                          <>
                            <span>·</span>
                            <span className="italic">edited</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {reviews.length === 0 && !showForm && (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                <p className="text-sm">No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Exported Rating Badge (for product cards/images) ── */
export function RatingBadge({ productId }) {
  const [avg, setAvg] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/products/${productId}/rating`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setAvg(d.avg || 0)
          setCount(d.count || 0)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [productId])

  if (count === 0) return null

  return (
    <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-white/95 dark:bg-[#111]/95 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded-sm shadow-sm border border-gray-100 dark:border-[#333]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span className="text-gray-900 dark:text-white">{avg.toFixed(1)}</span>
      <span className="text-gray-400 dark:text-gray-500 font-normal">({count})</span>
    </div>
  )
}
