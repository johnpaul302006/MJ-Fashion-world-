'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
    setToasts((prev) => [...prev, { id, message, type }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur || 4500),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur || 4000),
    showSuccess: (msg, dur) => addToast(msg, 'success', dur),
    showError: (msg, dur) => addToast(msg, 'error', dur || 4500),
    showInfo: (msg, dur) => addToast(msg, 'info', dur),
    showWarning: (msg, dur) => addToast(msg, 'warning', dur || 4000),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-xl border text-sm backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : t.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                : t.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
            }`}
          >
            <span className="text-base shrink-0 mt-0.5">
              {t.type === 'success' && '✓'}
              {t.type === 'error' && '✕'}
              {t.type === 'warning' && '⚠'}
              {t.type === 'info' && 'ℹ'}
            </span>
            <div className="flex-1 font-medium leading-snug">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Close notification"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useAdminToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback if rendered outside provider
    const log = (prefix, msg) => console.log(prefix, msg)
    return {
      success: (msg) => log('[Toast Success]', msg),
      error: (msg) => log('[Toast Error]', msg),
      info: (msg) => log('[Toast Info]', msg),
      warning: (msg) => log('[Toast Warning]', msg),
      showSuccess: (msg) => log('[Toast Success]', msg),
      showError: (msg) => log('[Toast Error]', msg),
      showInfo: (msg) => log('[Toast Info]', msg),
      showWarning: (msg) => log('[Toast Warning]', msg),
    }
  }
  return ctx
}
