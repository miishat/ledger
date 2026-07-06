import React from 'react'
import type { InvestmentAnalysis, Position } from '../../store/useAnalysisStore'
import { planRow } from '../../utils/investments/planMetrics'
import { formatMoney } from '../planner/format'

const th = 'px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-text-secondary'
const td = 'px-3 py-2 text-right text-[13px] text-text-primary tabular-nums'

interface PlanTableProps {
  analysis: InvestmentAnalysis
  priceFor: (p: Position) => number
  onAllocationChange: (positionId: string, pct: number) => void
}

export const PlanTable: React.FC<PlanTableProps> = ({ analysis, priceFor, onAllocationChange }) => {
  const budget = analysis.plannedBudget ?? 0
  const rows = analysis.positions.map((p) => planRow(p, budget, priceFor(p)))
  const totalAllocation = rows.reduce((s, r) => s + r.allocationPct, 0)
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse">
        <thead className="bg-bg-primary/50">
          <tr>
            <th className={`${th} text-left`}>Ticker</th>
            <th className={th}>Allocation %</th>
            <th className={th}>Planned $</th>
            <th className={th}>Start Price</th>
            <th className={th}>Shares</th>
            <th className={th}>Current Price</th>
            <th className={th}>Current Value</th>
            <th className={th}>Return $</th>
            <th className={th}>Return %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.positionId} className="border-t border-border/60">
              <td className={`${td} text-left font-medium`}>{r.ticker}</td>
              <td className={td}>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={100}
                  aria-label={`Allocation % for ${r.ticker}`}
                  className="w-20 bg-bg-primary/50 border border-border rounded px-2 py-1 text-right text-[13px] text-text-primary outline-none focus:border-accent"
                  value={r.allocationPct}
                  onChange={(e) => onAllocationChange(r.positionId, Number(e.target.value))}
                />
              </td>
              <td className={td}>{formatMoney(r.plannedDollars)}</td>
              <td className={td}>{formatMoney(r.startPrice)}</td>
              <td className={td}>{r.shares.toFixed(2)}</td>
              <td className={td}>{formatMoney(r.currentPrice)}</td>
              <td className={td}>{formatMoney(r.currentValue)}</td>
              <td className={`${td} ${r.returnDollars < 0 ? 'text-error' : 'text-accent'}`}>{formatMoney(r.returnDollars)}</td>
              <td className={`${td} ${(r.returnPct ?? 0) < 0 ? 'text-error' : 'text-accent'}`}>{r.returnPct === null ? 'n/a' : `${r.returnPct.toFixed(2)}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {Math.round(totalAllocation * 100) !== 10000 && analysis.positions.length > 0 && (
        <p className="px-3 py-2 text-[12px] text-error">Allocations sum to {totalAllocation.toFixed(1)}% (should be 100%).</p>
      )}
    </div>
  )
}
