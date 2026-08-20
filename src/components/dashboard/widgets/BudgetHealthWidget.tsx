import React from 'react'
import { Link } from 'react-router-dom'
import { WidgetWrapper } from '../WidgetWrapper'
import { useBudgetStore, getMonthlyBudgetStats } from '../../../store/useBudgetStore'
import { formatMoney } from '../../planner/format'

export const BudgetHealthWidget: React.FC = () => {
  const budgetState = useBudgetStore()

  if (Object.keys(budgetState.transactions).length === 0) {
    return (
      <WidgetWrapper title="This Month's Budget">
        <p className="text-[13px] text-text-secondary mt-2">
          {/* Exempt from the mobile tap-target floor: this link sits inline in a sentence, and WCAG 2.5.8 excludes inline text links from the minimum target size since forcing 44px would break the flow. */}
          <Link to="/budget" className="text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded tap-exempt">Add transactions in Budgeting</Link> to see your monthly health here.
        </p>
      </WidgetWrapper>
    )
  }

  const now = new Date()
  const stats = getMonthlyBudgetStats(budgetState, now.getFullYear(), now.getMonth())

  return (
    <WidgetWrapper title="This Month's Budget">
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
