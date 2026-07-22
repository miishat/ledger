import React from 'react'
import type { PAReport } from '../../../utils/investments/ibkrPortfolioAnalyst'
import { formatMoney } from '../../planner/format'
import { Stat } from '../../ui/Stat'
import { benchmarkDelta, feeTotal, incomeTotals } from './reportMetrics'
import { pct } from './Section'

/** Summary-first hero: the six figures that answer "how did I do" before any
 *  table is opened. */
export const ReportSummary: React.FC<{ report: PAReport }> = ({ report }) => {
  const stats = report.keyStats
  if (!stats) return null

  const delta = benchmarkDelta(report.benchmarkSummary)
  const benchmarkName = report.benchmarkSummary[1]?.name
  const income = incomeTotals(report.dividends, report.projectedIncome)

  return (
    <div className="themed-card rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
      <Stat label="Ending NAV" value={formatMoney(stats.endingNav)} tone="accent" />
      <Stat
        label="Cumulative Return"
        value={pct(stats.cumulativeReturn)}
        tone={stats.cumulativeReturn >= 0 ? 'accent' : 'error'}
        sub={delta !== null && benchmarkName ? `${pct(delta)} vs ${benchmarkName}` : undefined}
      />
      <Stat
        label="Change in NAV"
        value={formatMoney(stats.changeInNav)}
        tone={stats.changeInNav >= 0 ? 'accent' : 'error'}
      />
      <Stat
        label="Income"
        value={formatMoney(stats.dividends + stats.interest)}
        sub={income.projectedAnnual > 0 ? `${formatMoney(income.projectedAnnual)} projected annual` : undefined}
      />
      <Stat
        label="Fees & Commissions"
        value={formatMoney(stats.feesCommissions)}
        sub={report.fees.length > 0 ? `${formatMoney(feeTotal(report.fees))} itemised` : undefined}
      />
      <Stat label="Deposits & Withdrawals" value={formatMoney(stats.depositsWithdrawals)} />
    </div>
  )
}
