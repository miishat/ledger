import React, { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Holding } from '../../store/usePortfolioStore'
import { allocationBreakdown, type AllocationBy, type FxRates } from '../../utils/investments/portfolioMetrics'
import { formatMoney } from '../planner/format'
import { chartTooltipStyles } from '../../utils/chartTheme'

const SLICE_COLORS = [
  'var(--accent)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
]

const MODES: { by: AllocationBy; label: string }[] = [
  { by: 'holding', label: 'By holding' },
  { by: 'account', label: 'By account' },
  { by: 'currency', label: 'By currency' },
]

interface AllocationChartProps {
  rows: { holding: Holding; price: number }[]
  rates: FxRates
}

export const AllocationChart: React.FC<AllocationChartProps> = ({ rows, rates }) => {
  const [by, setBy] = useState<AllocationBy>('holding')
  if (rows.length === 0) return null

  const slices = allocationBreakdown(rows, rates, by)
  if (slices.length === 0) return null

  return (
    <div className="themed-card rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-[14px] font-semibold text-text-primary">Allocation</h3>
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m.by}
              onClick={() => setBy(m.by)}
              aria-pressed={by === m.by}
              className={`px-2 py-1 rounded-md text-[12px] border transition-colors ${
                by === m.by ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="valueCad" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} isAnimationActive={false}>
                {slices.map((s, i) => <Cell key={s.name} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />)}
              </Pie>
              <Tooltip {...chartTooltipStyles} formatter={(value) => formatMoney(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1 text-[13px] max-h-[200px] overflow-y-auto">
          {slices.map((s, i) => (
            <div key={s.name} className="flex justify-between items-center gap-2">
              <span className="flex items-center gap-2 text-text-primary truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                {s.name}
              </span>
              <span className="text-text-secondary shrink-0 tabular-nums">{s.pct.toFixed(1)}% · {formatMoney(s.valueCad)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
