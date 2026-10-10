'use client'

import { useState } from 'react'
import Image from 'next/image'
import { inr } from '@/lib/format'
import { SIZES } from '@/lib/categories'

const REASONS = [
  { code: 'wrong_size', label: 'Size does not fit (Too small / Too large)' },
  { code: 'defective', label: 'Defective / Damaged product or stitching issue' },
  { code: 'not_as_pictured', label: 'Item not as pictured / Different color' },
  { code: 'changed_mind', label: 'Changed my mind / No longer needed' },
  { code: 'other', label: 'Other (Please specify details)' },
]

export default function ReturnExchangeModal({ order, product, onClose, onSuccess }) {
  const [step, setStep] = useState(1) // 1: Type & Reason, 2: Verification, 3: Feedback, 4: Confirmation
  const [type, setType] = useState('exchange') // 'exchange' | 'return'
  const [reasonCode, setReasonCode] = useState('wrong_size')
  const [reasonText, setReasonText] = useState('')
  const [newSize, setNewSize] = useState(product?.size ? (product.size === 'M' ? 'L' : 'M') : 'L')
  const [newColor, setNewColor] = useState('')
  const [photos, setPhotos] = useState([])
  const [declaration, setDeclaration] = useState(false)
  const [rating, setRating] = useState(5)
  const [feedbackComments, setFeedbackComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdRequest, setCreatedRequest] = useState(null)

  // Handle image upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (photos.length + files.length > 3) {
      setError('You can upload a maximum of 3 photos')
      return
    }

    files.slice(0, 3 - photos.length).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each photo must be smaller than 5 MB')
        return
      }
      const reader = new FileReader()
      reader.onload = (uploadEvent) => {
        setPhotos((prev) => [...prev, uploadEvent.target.result].slice(0, 3))
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  // Handle form submission at Step 3
  const handleSubmit = async () => {
    if (!declaration) {
      setError('You must confirm the declaration to submit')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderId,
          product: {
            productId: product.productId,
            name: product.name,
            image: product.image,
            size: product.size,
            price: product.price,
            qty: product.qty || 1,
          },
          type,
          reason: {
            code: reasonCode,
            text: reasonText.trim(),
          },
          exchangeDetails:
            type === 'exchange'
              ? { newSize, newColor: newColor.trim() }
              : {},
          photos,
          declaration: true,
          feedback: {
            rating,
            comments: feedbackComments.trim(),
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }

      setCreatedRequest(data.request)
      setStep(4)
      if (onSuccess) onSuccess(data.request)
    } catch (err) {
      setError(err.message || 'Error creating return request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[#141414] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/60">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Order #{order.orderId}
            </span>
            <h3 className="text-base font-bold text-white">
              {step === 4 ? 'Request Submitted' : 'Return & Exchange Assistance'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator (Steps 1-3) */}
        {step < 4 && (
          <div className="px-6 py-3 bg-neutral-900/30 border-b border-neutral-800/80 flex items-center justify-between text-xs font-semibold shrink-0">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#cc0000]' : 'text-neutral-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-[#cc0000] text-white' : 'bg-neutral-800'}`}>1</span>
              <span>Reason</span>
            </div>
            <div className="h-[1px] w-8 bg-neutral-800" />
            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#cc0000]' : 'text-neutral-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-[#cc0000] text-white' : 'bg-neutral-800'}`}>2</span>
              <span>Verification</span>
            </div>
            <div className="h-[1px] w-8 bg-neutral-800" />
            <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-[#cc0000]' : 'text-neutral-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-[#cc0000] text-white' : 'bg-neutral-800'}`}>3</span>
              <span>Feedback</span>
            </div>
          </div>
        )}

        {/* Product Snapshot */}
        <div className="px-6 py-3 bg-neutral-950/60 border-b border-neutral-800/60 flex items-center gap-3 shrink-0">
          <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
            {product?.image ? (
              <Image src={product.image} alt={product.name} fill sizes="48px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500">IMG</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-white truncate">{product?.name}</h4>
            <p className="text-[11px] text-neutral-400">
              Size: {product?.size || 'Standard'} · {inr(product?.price || 0)}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ════════════ STEP 1: TYPE & REASON ════════════ */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  What would you like to do?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('exchange')}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      type === 'exchange'
                        ? 'bg-[#cc0000]/10 border-[#cc0000] text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🔄</span>
                      <span className="font-bold text-sm">Exchange</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Swap for a different size or color.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('return')}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      type === 'return'
                        ? 'bg-[#cc0000]/10 border-[#cc0000] text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">↩</span>
                      <span className="font-bold text-sm">Return for Refund</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Return the item and receive a refund.
                    </p>
                  </button>
                </div>
              </div>

              {type === 'exchange' && (
                <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                  <span className="text-xs font-bold text-white block">Replacement Preferences</span>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Select Replacement Size</label>
                    <select
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-700 text-white text-xs focus:border-[#cc0000] focus:outline-none"
                    >
                      {SIZES.map((sz) => (
                        <option key={sz} value={sz}>
                          Size {sz}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Preferred Color (Optional)</label>
                    <input
                      type="text"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="e.g. Black, Navy Blue, Maroon"
                      className="w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-700 text-white text-xs focus:border-[#cc0000] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Reason for {type === 'exchange' ? 'Exchange' : 'Return'}
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-sm focus:border-[#cc0000] focus:outline-none"
                >
                  {REASONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Additional Details / Notes (Optional)
                </label>
                <textarea
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Tell us more about the fit or problem..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs focus:border-[#cc0000] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ════════════ STEP 2: VERIFICATION ════════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Attach Product Photos (Up to 3)
                </label>
                <p className="text-xs text-neutral-400 mb-3">
                  Upload clear photos showing the garment and tags attached to speed up host approval.
                </p>

                {/* Photo Previews */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 group">
                      <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/80 text-white text-xs flex items-center justify-center hover:bg-rose-600 transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {photos.length < 3 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-neutral-700 hover:border-neutral-500 bg-neutral-900/50 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition">
                      <span className="text-xl mb-1">📷</span>
                      <span className="text-[11px] font-medium text-neutral-300">Add Photo</span>
                      <span className="text-[9px] text-neutral-500">Max 5MB</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaration}
                    onChange={(e) => {
                      setDeclaration(e.target.checked)
                      if (error) setError('')
                    }}
                    className="w-4 h-4 rounded border-neutral-700 text-[#cc0000] focus:ring-0 mt-0.5"
                  />
                  <span className="text-xs text-neutral-300 leading-relaxed">
                    I declare and confirm that the item is <b>unused, unworn, unwashed</b>, with original tags intact and in its original retail packaging.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ════════════ STEP 3: FEEDBACK ════════════ */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center py-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Rate your overall product &amp; purchase experience
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-3xl transition hover:scale-110 cursor-pointer"
                    >
                      {star <= rating ? '★' : '☆'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  {rating === 5 && 'Outstanding quality & service'}
                  {rating === 4 && 'Good quality, minor issue'}
                  {rating === 3 && 'Average experience'}
                  {rating <= 2 && 'Needs improvement'}
                </p>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">
                  Feedback for our designers and store team (Optional)
                </label>
                <textarea
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  placeholder="Let us know what we can improve regarding sizing, fabric, or delivery..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs focus:border-[#cc0000] focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 space-y-1.5">
                <p className="font-semibold text-white">Summary of your request:</p>
                <p>• Type: <b className="capitalize text-white">{type}</b></p>
                <p>• Product: <b className="text-white">{product?.name}</b> (Size {product?.size})</p>
                {type === 'exchange' && <p>• Replacement: <b className="text-emerald-400">Size {newSize}</b></p>}
                <p>• Photos attached: <b className="text-white">{photos.length}</b></p>
              </div>
            </div>
          )}

          {/* ════════════ STEP 4: CONFIRMATION ════════════ */}
          {step === 4 && createdRequest && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
                ✓
              </div>
              <h4 className="text-xl font-bold text-white">Request Submitted!</h4>
              <p className="text-xs text-neutral-400 font-mono">
                Request ID: <span className="font-bold text-white">{createdRequest.requestId}</span>
              </p>
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 leading-relaxed max-w-md mx-auto">
                Your request is under review. You will see an update here once the host approves.
                Our logistics team will coordinate pickup once confirmed.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/60">
          {step < 4 ? (
            <>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setStep((s) => s - 1)
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
                >
                  ← Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {step === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setStep(2)
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold transition cursor-pointer"
                >
                  Next: Verification →
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!declaration) {
                      setError('You must confirm the declaration checkbox to proceed')
                      return
                    }
                    setError('')
                    setStep(3)
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold transition cursor-pointer"
                >
                  Next: Feedback →
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold transition cursor-pointer"
            >
              Done &amp; Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
