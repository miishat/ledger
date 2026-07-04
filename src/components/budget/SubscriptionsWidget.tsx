import React from 'react'
import { Repeat } from 'lucide-react'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useBudgetStore } from '../../store/useBudgetStore'
import { detectRecurring } from '../../utils/budget/recurring'
import { formatMoney } from '../planner/format'

export const SubscriptionsWidget: React.FC = () => {
  const transactions = useBudgetStore((s) => s.transactions)
  const items = detectRecurring(transactions).filter((i) => i.type === 'expense')
  const monthlyTotal = items.reduce((s, i) => s + i.monthlyEstimate, 0)

  return (
    <WidgetWrapper title="Subscriptions & recurring">
      {items.length === 0 ? (
        <p className="text-[13px] text-text-secondary mt-2">No repeating charges detected yet — import more history.</p>
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[13px] text-text-secondary">
            ~<span className="text-accent font-semibold">{formatMoney(monthlyTotal)}</span>/month across {items.length} recurring charges
          </p>
          {items.slice(0, 8).map((i) => (
            <div key={i.key} className="flex items-center justify-between text-[13px] border-b border-border pb-1 last:border-b-0">
              <span className="flex items-center gap-2 text-text-primary truncate">
                <Repeat className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="truncate">{i.description}</span>
              </span>
              <span className="text-text-secondary whitespace-nowrap ml-2">
                {formatMoney(i.avgAmount)} · every {i.intervalDays}d · next {i.nextExpected}
              </span>
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  )
}
