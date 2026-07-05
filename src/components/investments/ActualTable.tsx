import React from 'react'
import type { InvestmentAnalysis, Position } from '../../store/useAnalysisStore'
import { avgCostBasis, currentValue, plDollars, plPct, sharesFromLots, totalInvested } from '../../utils/investments/analysisMetrics'
import { formatMoney } from '../planner/format'

const th = 'px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-text-secondary'
const td = 'px-3 py-2 text-right text-[13px] text-text-primary tabular-nums'

interface ActualRow {
  positionId: string
  ticker: string
  initialInvestment: number
  extra: number
  startPrice: number
  avgPrice: number | null
  shares: number
  currentPrice: number
  currentValue: number
  returnDollars: number
  returnPct: number | null
}

function actualRow(position: Position, currentPrice: number): ActualRow {
  const { lots } = position
  const initial = lots[0]?.amountInvested ?? 0
  const invested = totalInvested(lots)
  const extra = invested - initial
  return {
    positionId: position.id,
    ticker: position.ticker,
    initialInvestment: initial,
    extra,
    startPrice: position.startPrice,
    avgPrice: avgCostBasis(lots),
    shares: sharesFromLots(lots),
    currentPrice,
    currentValue: currentValue(lots, currentPrice),
    returnDollars: plDollars(lots, currentPrice),
    returnPct: plPct(lots, currentPrice),
  }
}

export const ActualTable: React.FC<{ analysis: InvestmentAnalysis; priceFor: (p: Position) => number }> = ({ analysis, priceFor }) => {
  const rows = analysis.positions.map((p) => actualRow(p, priceFor(p)))
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse">
        <thead className="bg-bg-primary/50">
          <tr>
            <th className={`${th} text-left`}>Ticker</th>
            <th className={th}>Initial investment</th>
            <th className={th}>Extra investment</th>
            <th className={th}>Start price</th>
            <th className={th}>Average price</th>
            <th className={th}>Shares</th>
            <th className={th}>Current price</th>
            <th className={th}>Current value</th>
            <th className={th}>Return $</th>
            <th className={th}>Return %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.positionId} className="border-t border-border/60">
              <td className={`${td} text-left font-medium`}>{r.ticker}</td>
              <td className={td}>{formatMoney(r.initialInvestment)}</td>
              <td className={td}>{formatMoney(r.extra)}</td>
              <td className={td}>{formatMoney(r.startPrice)}</td>
              <td className={td}>{r.avgPrice === null ? 'n/a' : formatMoney(r.avgPrice)}</td>
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
