import React from 'react'
import type { InvestmentAnalysis, Position } from '../../store/useAnalysisStore'
import { planRow } from '../../utils/investments/planMetrics'
import { formatMoney } from '../planner/format'

const th = 'px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-text-secondary'
const td = 'px-3 py-2 text-right text-[13px] text-text-primary tabular-nums'

export const PlanTable: React.FC<{ analysis: InvestmentAnalysis; priceFor: (p: Position) => number }> = ({ analysis, priceFor }) => {
  const rows = analysis.positions.map((p) => planRow(p, analysis.initialFund ?? 0, priceFor(p)))
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse">
        <thead className="bg-bg-primary/50">
          <tr>
            <th className={`${th} text-left`}>Ticker</th>
            <th className={th}>Allocation %</th>
            <th className={th}>Extra $</th>
            <th className={th}>Initial Investment</th>
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
              <td className={td}>{r.allocationPct.toFixed(2)}%</td>
              <td className={td}>{formatMoney(r.extra)}</td>
              <td className={td}>{formatMoney(r.initialInvestment)}</td>
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
    </div>
  )
}
