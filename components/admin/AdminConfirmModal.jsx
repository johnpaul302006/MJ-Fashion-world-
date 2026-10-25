'use client'

import { useEffect, useRef } from 'react'

export default function AdminConfirmModal({
  isOpen,
  open,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  variant,
  isLoading = false,
  loading,
  onConfirm,
  onCancel,
}) {
  const isVisible = Boolean(isOpen ?? open)
  const danger = Boolean(isDanger || variant === 'danger')
  const busy = Boolean(isLoading || loading)
  const confirmBtnRef = useRef(null)

  useEffect(() => {
    if (!isVisible) return
    const prevActive = document.activeElement
    confirmBtnRef.current?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape' && !busy) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (prevActive && prevActive.focus) prevActive.focus()
    }
  }, [isVisible, busy, onCancel])

  if (!isVisible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
              danger
                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
            }`}
          >
            {danger ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p id="confirm-dialog-desc" className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition flex items-center gap-2 ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50'
                : 'bg-brand hover:bg-brand-dark active:scale-95 disabled:opacity-50'
            }`}
          >
            {busy ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
