'use client'

import { useEffect } from 'react'

export default function DevPerfPatch() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const perf = window.performance
    if (!perf || typeof perf.measure !== 'function' || perf.__devPerfPatched) return
    const original = perf.measure.bind(perf)
    perf.measure = function (...args) {
      try {
        return original(...args)
      } catch (err) {
        const msg = (err && err.message) || ''
        if (msg.includes('negative time stamp') || msg.includes('cannot be negative')) return
        throw err
      }
    }
    perf.__devPerfPatched = true
  }, [])
  return null
}