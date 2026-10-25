'use client'

import { useState } from 'react'
import { inr } from '@/lib/format'

export default function AdminChart({ orders = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  // Aggregate orders by day for the last 7 distinct days or default timeline
  const daysMap = new Map()

  // Generate last 7 days buckets
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    daysMap.set(key, { label: key, revenue: 0, count: 0 })
  }

  // Populate from confirmed, shipped, delivered orders
  const revenueStatuses = ['confirmed', 'shipped', 'delivered', 'packed', 'out_for_delivery']
  for (const o of orders) {
    if (!o.createdAt) continue
    const dateKey = new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    if (daysMap.has(dateKey)) {
      const entry = daysMap.get(dateKey)
      entry.count += 1
      if (revenueStatuses.includes(o.status)) {
        entry.revenue += Number(o.amount) || 0
      }
    }
  }

  const data = Array.from(daysMap.values())
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 5000)

  // SVG dimensions
  const width = 640
  const height = 180
  const padLeft = 45
  const padRight = 20
  const padTop = 20
  const padBottom = 30
  const chartWidth = width - padLeft - padRight
  const chartHeight = height - padTop - padBottom

  // Coordinates
  const points = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * chartWidth
    const y = padTop + chartHeight - (d.revenue / maxRevenue) * chartHeight
    return { x, y, ...d }
  })

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    // Smooth bezier curve
    const prev = points[i - 1]
    const cx1 = prev.x + (p.x - prev.x) / 2
    const cy1 = prev.y
    const cx2 = prev.x + (p.x - prev.x) / 2
    const cy2 = p.y
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`
  }, '')

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + chartHeight} L ${points[0].x} ${padTop + chartHeight} Z`

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            7-Day Revenue Trend
          </span>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
            {inr(data.reduce((sum, d) => sum + d.revenue, 0))} total revenue
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand" />
            <span>Revenue</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[640/180] max-h-[220px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cc0000" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#cc0000" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = padTop + chartHeight * ratio
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  ₹{Math.round((maxRevenue * (1 - ratio)) / 1000)}k
                </text>
              </g>
            )
          })}

          {/* Shaded Area */}
          <path d={areaD} fill="url(#areaGrad)" />

          {/* Curve Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#cc0000"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Interactive Data Points */}
          {points.map((p, i) => {
            const isHovered = hoveredIdx === i
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Invisible large touch target */}
                <circle cx={p.x} cy={p.y} r="16" fill="transparent" />

                {/* Visible dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : 3.5}
                  className="fill-white dark:fill-slate-900 stroke-brand transition-all duration-200"
                  strokeWidth={isHovered ? 3 : 2}
                />

                {/* X Axis label */}
                <text
                  x={p.x}
                  y={height - 6}
                  textAnchor="middle"
                  className={`text-[10px] font-medium transition-colors ${
                    isHovered
                      ? 'fill-brand font-bold'
                      : 'fill-slate-400 dark:fill-slate-500'
                  }`}
                >
                  {p.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${(points[hoveredIdx].y / height) * 100}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-12 pointer-events-none z-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
          >
            <p className="font-bold">{inr(points[hoveredIdx].revenue)}</p>
            <p className="text-[10px] opacity-80">
              {points[hoveredIdx].count} order{points[hoveredIdx].count !== 1 ? 's' : ''} ({points[hoveredIdx].label})
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
