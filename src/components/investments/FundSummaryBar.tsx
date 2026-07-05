import React from 'react'
import { Stat } from '../ui/Stat'
import { formatMoney } from '../planner/format'
import type { FundSummary } from '../../utils/investments/planMetrics'

export const FundSummaryBar: React.FC<{ summary: FundSummary; startDate: string }> = ({ summary, startDate }) => (
  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 themed-card rounded-lg p-4">
    <Stat label="Start date" value={startDate} />
    <Stat label="Initial fund" value={formatMoney(summary.initialFund)} />
    <Stat label="Extra fund" value={formatMoney(summary.extraFund)} />
    <Stat label="Total fund" value={formatMoney(summary.totalFund)} />
    <Stat label="Current value" value={formatMoney(summary.currentValue)} tone="accent" />
    <Stat
      label="Total return"
      value={summary.totalReturnPct === null ? 'n/a' : `${summary.totalReturnPct.toFixed(2)}%`}
      tone={summary.totalReturnPct !== null && summary.totalReturnPct < 0 ? 'error' : 'accent'}
    />
  </div>
)
