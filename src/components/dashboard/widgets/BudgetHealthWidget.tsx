import React from 'react'
import { Wallet } from 'lucide-react'
import { WidgetWrapper } from '../WidgetWrapper'
import { useBudgetStore, getMonthlyBudgetStats } from '../../../store/useBudgetStore'
import { formatMoney } from '../../planner/format'
import { EmptyState } from '../../ui/EmptyState'

export const BudgetHealthWidget: React.FC = () => {
  const budgetState = useBudgetStore()

  if (Object.keys(budgetState.transactions).length === 0) {
    return (
      <WidgetWrapper title="This Month's Budget">
        <EmptyState
          icon={Wallet}
          message="No transactions yet"
          hint="Import a CSV or add one by hand, and your monthly health appears here."
          action={{ label: 'Add transactions', to: '/budget' }}
        />
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
