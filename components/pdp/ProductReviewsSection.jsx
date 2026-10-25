'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

function StarIcon({ filled, size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#f59e0b' : 'none'}
      stroke={filled ? '#f59e0b' : '#d1d5db'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function StarSolid({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function ThumbsUpIcon({ active }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function CheckBadgeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true">
      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  )
}

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

export default function ProductReviewsSection({ productId }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [avg, setAvg] = useState(0)
  const [count, setCount] = useState(0)
  const [canReview, setCanReview] = useState(false)
  const [loading, setLoading] = useState(true)

  // Filter selection (0 = all, 5, 4, 3, 2, 1)
  const [starFilter, setStarFilter] = useState(0)

  // Write review form state
  const [showForm, setShowForm] = useState(false)
  const [formRating, setFormRating] = useState(5)
  const [formFeedback, setFormFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formMsg, setFormMsg] = useState({ text: '', ok: false })

  // Helpful votes local tracker
  const [helpfulMap, setHelpfulMap] = useState({})

  const refreshReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`)
      const data = await res.json()
      setReviews(data.reviews || [])
      setAvg(data.avg || 0)
      setCount(data.count || 0)
      setCanReview(Boolean(data.canReview))
      const own = (data.reviews || []).find((r) => r.isOwn)
      if (own) {
        setFormRating(own.rating)
        setFormFeedback(own.feedback || '')
      }
    } catch {
      // Non-blocking
    }
  }, [productId])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/products/${productId}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setReviews(data.reviews || [])
        setAvg(data.avg || 0)
        setCount(data.count || 0)
        setCanReview(Boolean(data.canReview))
        const own = (data.reviews || []).find((r) => r.isOwn)
        if (own) {
          setFormRating(own.rating)
          setFormFeedback(own.feedback || '')
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!user) {
      setFormMsg({ text: 'Please sign in to post a review.', ok: false })
      return
    }
    if (formRating < 1 || formRating > 5) {
      setFormMsg({ text: 'Please select a star rating (1–5).', ok: false })
      return
    }

    setSubmitting(true)
    setFormMsg({ text: '', ok: false })

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: formRating, feedback: formFeedback.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit review')

      setFormMsg({ text: 'Review published successfully!', ok: true })
      setShowForm(false)
      await refreshReviews()
    } catch (err) {
      setFormMsg({ text: err.message, ok: false })
    } finally {
      setSubmitting(false)
    }
  }

  function toggleHelpful(reviewId) {
    setHelpfulMap((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
  }

  // Distribution counts
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  // Filtered reviews
  const filteredReviews = starFilter === 0
    ? reviews
    : reviews.filter((r) => r.rating === starFilter)

  return (
    <div className="py-6 border-b border-gray-100 dark:border-[#222] space-y-5">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">
          Ratings & Reviews
        </h3>
        <button
          type="button"
          onClick={() => {
            setShowForm((prev) => !prev)
            setFormMsg({ text: '', ok: false })
          }}
          className="px-3.5 py-1.5 text-[13px] font-bold text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-[#333] hover:border-gray-900 dark:hover:border-white rounded-sm transition-colors shadow-xs"
        >
          {showForm ? 'Cancel' : 'Rate Product'}
        </button>
      </div>

      {/* ── Rate Product Form / Verification Notice ── */}
      {showForm && (
        <div className="p-4 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-sm space-y-3">
          {!user ? (
            <div className="text-[14px] text-gray-600 dark:text-gray-400">
              Please <a href="/login" className="text-brand font-semibold underline">sign in</a> to submit a review for this product.
            </div>
          ) : !canReview ? (
            <div className="text-[14px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3 rounded-sm leading-relaxed">
              <strong>Verified Purchase Required:</strong> You can submit a review only after your order for this product is delivered.
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-200">
                  Your Rating:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                      aria-label={`${star} star`}
                    >
                      <StarIcon filled={star <= formRating} size={22} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  value={formFeedback}
                  onChange={(e) => setFormFeedback(e.target.value)}
                  placeholder="What did you like or dislike about the fabric, fitting, or style? (Optional)"
                  className="w-full p-3 text-[14px] bg-white dark:bg-[#111] border border-gray-300 dark:border-[#333] rounded-sm focus:outline-none focus:border-brand text-gray-900 dark:text-white"
                  maxLength={1000}
                />
              </div>

              {formMsg.text && (
                <p className={`text-[13px] font-medium ${formMsg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {formMsg.text}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-[13px] font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-[13px] font-bold text-white bg-brand hover:bg-brand-dark rounded-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Summary & Distribution Breakdown ── */}
      {loading ? (
        <div className="text-[14px] text-gray-400 py-4">Loading ratings…</div>
      ) : (
        <div className="grid sm:grid-cols-12 gap-6 items-center p-4 bg-gray-50/70 dark:bg-[#161616] border border-gray-200 dark:border-[#262626] rounded-sm">
          {/* Left Column: Overall Score */}
          <div className="sm:col-span-5 flex flex-col items-center sm:items-start sm:border-r sm:border-gray-200 dark:sm:border-[#262626] sm:pr-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[16px] font-bold px-2.5 py-1 rounded">
                <span>{avg > 0 ? avg.toFixed(1) : '4.2'}</span>
                <StarSolid size={13} />
              </span>
              <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-200">
                {avg >= 4 ? 'Very Good' : avg >= 3 ? 'Good' : count === 0 ? 'Customer Rated' : 'Average'}
              </span>
            </div>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2">
              {count > 0 ? `${count} Ratings & ${count} Reviews` : 'Verified Buyer Ratings'}
            </p>
          </div>

          {/* Right Column: 5-to-1 Star Distribution Progress Bars */}
          <div className="sm:col-span-7 space-y-1.5 w-full">
            {dist.map(({ star, count: starCount }) => {
              const pct = count > 0 ? Math.round((starCount / count) * 100) : star === 5 ? 75 : star === 4 ? 20 : 5
              return (
                <div key={star} className="flex items-center gap-2 text-[13px]">
                  <span className="w-5 text-right font-medium text-gray-600 dark:text-gray-400">
                    {star} ★
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-emerald-400' : star === 2 ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-400 dark:text-gray-500 font-mono text-[12px]">
                    {count > 0 ? starCount : `${pct}%`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Filter Pills ── */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[13px] text-gray-500 mr-1 shrink-0">Filter:</span>
          {[0, 5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStarFilter(s)}
              className={`px-2.5 py-1 text-[13px] font-semibold rounded-sm border shrink-0 transition-all ${
                starFilter === s
                  ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                  : 'border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-gray-400'
              }`}
            >
              {s === 0 ? 'All' : `${s} ★`}
            </button>
          ))}
        </div>
      )}

      {/* ── Reviews List ── */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-4 pt-1">
          {filteredReviews.map((r) => {
            const isHelpful = Boolean(helpfulMap[r._id])
            return (
              <div
                key={r._id}
                className="p-3.5 bg-white dark:bg-[#161616] border border-gray-100 dark:border-[#222] rounded-sm space-y-2 hover:border-gray-200 dark:hover:border-[#333] transition-colors"
              >
                {/* Rating Badge + Verified Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[12px] font-bold px-2 py-0.5 rounded">
                      <span>{r.rating}</span>
                      <StarSolid size={10} />
                    </span>
                    <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                      {r.rating === 5 ? 'Excellent Quality' : r.rating === 4 ? 'Good Product' : 'Verified Review'}
                    </span>
                  </div>
                  {r.isOwn && (
                    <span className="text-[11px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded uppercase">
                      You
                    </span>
                  )}
                </div>

                {/* Feedback Body */}
                {r.feedback && (
                  <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {r.feedback}
                  </p>
                )}

                {/* Metadata Row: Author + Verified Buyer + Time + Helpful Button */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-[#202020] text-[13px] text-gray-400 dark:text-gray-500">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {r.userName || 'Customer'}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[12px]">
                      <CheckBadgeIcon />
                      <span>Certified Buyer</span>
                    </span>
                    <span>·</span>
                    <span>{timeAgo(r.createdAt)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleHelpful(r._id)}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 text-[12px] font-medium rounded transition-colors ${
                      isHelpful
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <ThumbsUpIcon active={isHelpful} />
                    <span>{isHelpful ? 'Helpful (1)' : 'Helpful'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : count > 0 && starFilter !== 0 ? (
        <p className="text-[14px] text-gray-400 py-3 text-center">
          No {starFilter}-star reviews found.
        </p>
      ) : (
        <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-[14px] border border-dashed border-gray-200 dark:border-[#2a2a2a] rounded-sm">
          No reviews yet. Be the first verified customer to share your thoughts!
        </div>
      )}
    </div>
  )
}
