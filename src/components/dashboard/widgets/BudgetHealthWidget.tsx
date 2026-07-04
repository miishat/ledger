import React from 'react'
import { WidgetWrapper } from '../WidgetWrapper'
import { useBudgetStore, getMonthlyBudgetStats } from '../../../store/useBudgetStore'
import { formatMoney } from '../../planner/format'

export const BudgetHealthWidget: React.FC = () => {
  const budgetState = useBudgetStore()
  const now = new Date()
  const stats = getMonthlyBudgetStats(budgetState, now.getFullYear(), now.getMonth())

  return (
    <WidgetWrapper title="This month's budget">
      <div className="flex flex-col gap-1 mt-2">
        <span className={`text-[28px] font-bold ${stats.remaining >= 0 ? 'text-accent' : 'text-error'}`}>
          {formatMoney(stats.remaining)}
        </span>
        <span className="text-[12px] text-text-secondary">left of targets · {formatMoney(stats.spent)} spent</span>
        <span className="text-[12px] text-text-secondary">{formatMoney(stats.unallocated)} unallocated</span>
      </div>
    </WidgetWrapper>
  )
}
