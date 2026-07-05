import React from 'react'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useBudgetStore } from '../../store/useBudgetStore'
import { categoryMonthlyTotal } from '../../utils/budget/categoryStats'
import { formatMoney } from '../planner/format'

// Pace: expected-by-today = target × (day / days-in-month); >110% = over.
export const BudgetProgressWidget: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const transactions = useBudgetStore((s) => s.transactions)
  const categories = useBudgetStore((s) => s.categories)

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const isCurrentMonth = currentMonthKey === selectedMonth
  const [y, m] = selectedMonth.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const monthFraction = isCurrentMonth ? now.getDate() / daysInMonth : 1

  const rows = Object.values(categories)
    .filter((c) => c.targetAmount > 0)
    .map((c) => {
      const spent = categoryMonthlyTotal(transactions, c.id, selectedMonth)
      const expected = c.targetAmount * monthFraction
      const pace = spent > expected * 1.1 ? 'over' : spent < expected * 0.9 ? 'under' : 'on'
      return { c, spent, pace }
    })

  return (
    <WidgetWrapper title="Budget vs. Actual">
      {rows.length === 0 ? (
        <p className="text-[13px] text-text-secondary mt-2">Set target amounts on categories to track progress.</p>
      ) : (
        <div className="flex flex-col gap-3 mt-2">
          {rows.map(({ c, spent, pace }) => (
            <div key={c.id} className="flex flex-col gap-1 text-[13px]">
              <div className="flex justify-between">
                <span className="text-text-primary">{c.name}</span>
                <span className={pace === 'over' ? 'text-error' : 'text-text-secondary'}>
                  {formatMoney(spent)} / {formatMoney(c.targetAmount)}
                  {isCurrentMonth ? ` · ${pace === 'over' ? 'over pace' : pace === 'under' ? 'under pace' : 'on pace'}` : ''}
                </span>
              </div>
              <div className="h-2 rounded bg-bg-primary/50 overflow-hidden">
                <div
                  className={`h-full ${pace === 'over' ? 'bg-error' : 'bg-accent'}`}
                  style={{ width: `${Math.min(100, (spent / c.targetAmount) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  )
}
