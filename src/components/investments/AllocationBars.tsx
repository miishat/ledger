import React from 'react'
import type { Holding } from '../../store/usePortfolioStore'
import {
  allocationBreakdown, type AllocationBy, type AllocationSlice, type FxRates,
} from '../../utils/investments/portfolioMetrics'
import { formatMoney } from '../planner/format'
import { sliceColor } from '../../utils/chartTheme'

interface AllocationBarsProps {
  rows: { holding: Holding; price: number }[]
  rates: FxRates
}

const CUTS: { by: AllocationBy; label: string }[] = [
  { by: 'holding', label: 'Holding' },
  { by: 'account', label: 'Account' },
  { by: 'currency', label: 'Currency' },
]

/** One 100% stacked bar plus its own text row.
 *
 *  No label sits inside a segment. Several --chart-* tokens are mid-tone
 *  and clear 4.5:1 against neither white nor black across the six themes,
 *  so text on a segment would be a contrast problem to solve six times
 *  over. Naming the segments underneath sidesteps it, and doubles as the
 *  non-colour channel the bar itself cannot provide. */
const Bar: React.FC<{ label: string; by: AllocationBy; slices: AllocationSlice[] }> = ({ label, by, slices }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-meta uppercase tracking-wide text-text-secondary">{label}</span>
    </div>
    <div
      role="img"
      aria-label={`Allocation by ${by}: ${slices.map((s) => `${s.name} ${s.pct.toFixed(1)}%`).join(', ')}`}
      className="flex h-4 w-full gap-px overflow-hidden rounded"
    >
      {slices.map((s, i) => (
        <span key={s.name} className="h-full" style={{ width: `${s.pct}%`, backgroundColor: sliceColor(i) }} />
      ))}
    </div>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {slices.map((s, i) => (
        <span key={s.name} className="inline-flex items-center gap-1.5 text-meta text-text-secondary">
          <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: sliceColor(i) }} aria-hidden="true" />
          <span className="tabular-nums">{s.name} {s.pct.toFixed(1)}% &middot; {formatMoney(s.valueCad)}</span>
        </span>
      ))}
    </div>
  </div>
)

export const AllocationBars: React.FC<AllocationBarsProps> = ({ rows, rates }) => {
  if (rows.length === 0) return null
  const cuts = CUTS.map((c) => ({ ...c, slices: allocationBreakdown(rows, rates, c.by) }))
  if (cuts.every((c) => c.slices.length === 0)) return null

  return (
    <div className="themed-card rounded-lg p-4 flex flex-col gap-4">
      <h3 className="text-[14px] font-semibold text-text-primary">Allocation</h3>
      {cuts.map((c) => (
        <Bar key={c.by} label={c.label} by={c.by} slices={c.slices} />
      ))}
    </div>
  )
}
