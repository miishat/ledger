import React from 'react'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useBudgetStore } from '../../store/useBudgetStore'
import { formatMoney } from '../planner/format'
import { totalMonthlyBudget } from '../../store/budgetSelectors'
import { inRange, isSingleMonth, monthKeyOf, monthsInRange, type MonthRange } from '../../utils/budget/period'

// Pace: expected-by-today = target × (day / days-in-month); >110% = over.
// Pace prorating only applies when the range is exactly the current single month.
export const BudgetProgressWidget: React.FC<{ range: MonthRange }> = ({ range }) => {
  const transactions = useBudgetStore((s) => s.transactions)
  const categories = useBudgetStore((s) => s.categories)
  const categoryGroups = useBudgetStore((s) => s.categoryGroups)

  const months = monthsInRange(range)
  const currentMonthKey = monthKeyOf(new Date())
  const isCurrentSingleMonth = isSingleMonth(range) && range.to === currentMonthKey
  const [y, m] = range.to.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const monthFraction = isCurrentSingleMonth ? new Date().getDate() / daysInMonth : 1

  const txInRange = Object.values(transactions).filter(
    (t) => t.type === 'expense' && inRange(t.date, range),
  )
  const spentByCategory = new Map<string, number>()
  for (const t of txInRange) {
    const key = t.categoryId ?? ''
    spentByCategory.set(key, (spentByCategory.get(key) ?? 0) + t.amount)
  }

  const rows = Object.values(categories)
    .filter((c) => c.targetAmount > 0)
    .map((c) => {
      const spent = spentByCategory.get(c.id) ?? 0
      const target = c.targetAmount * months
      const expected = target * monthFraction
      const pace = spent > expected * 1.1 ? 'over' : spent < expected * 0.9 ? 'under' : 'on'
      return { c, spent, target, pace }
    })

  const budgeted = totalMonthlyBudget(categories, categoryGroups) * months
  const totalSpent = txInRange.reduce((s, t) => s + t.amount, 0)
  const unbudgeted = txInRange
    .filter((t) => !t.categoryId || (categories[t.categoryId]?.targetAmount ?? 0) === 0)
    .reduce((s, t) => s + t.amount, 0)

  return (
    <WidgetWrapper title="Budget vs. Actual">
      {rows.length === 0 ? (
        <p className="text-[13px] text-text-secondary mt-2">Set target amounts on categories to track progress.</p>
      ) : (
        <div className="flex flex-col gap-3 mt-2">
          {budgeted > 0 && (
            <div className="flex flex-col gap-1 text-[13px] pb-3 border-b border-border">
              <div className="flex justify-between font-semibold">
                <span className="text-text-primary">Total</span>
                <span className={totalSpent > budgeted ? 'text-error' : 'text-text-primary'}>
                  {formatMoney(totalSpent)} / {formatMoney(budgeted)}
                </span>
              </div>
              <div className="h-2 rounded bg-bg-primary/50 overflow-hidden">
                <div
                  className={`h-full ${totalSpent > budgeted ? 'bg-error' : 'bg-accent'}`}
                  style={{ width: `${Math.min(100, (totalSpent / budgeted) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {rows.map(({ c, spent, target, pace }) => (
            <div key={c.id} className="flex flex-col gap-1 text-[13px]">
              <div className="flex justify-between">
                <span className="text-text-primary">{c.name}</span>
                <span className={pace === 'over' ? 'text-error' : 'text-text-secondary'}>
                  {formatMoney(spent)} / {formatMoney(target)}
                  {isCurrentSingleMonth ? ` · ${pace === 'over' ? 'over pace' : pace === 'under' ? 'under pace' : 'on pace'}` : ''}
                </span>
              </div>
              <div className="h-2 rounded bg-bg-primary/50 overflow-hidden">
                <div
                  className={`h-full ${pace === 'over' ? 'bg-error' : 'bg-accent'}`}
                  style={{ width: `${Math.min(100, (spent / target) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          {unbudgeted > 0 && (
            <div className="flex justify-between text-[13px] pt-2 border-t border-border">
              <span className="text-text-secondary">Unbudgeted spending</span>
              <span className="text-error font-medium">{formatMoney(unbudgeted)}</span>
            </div>
          )}
        </div>
      )}
    </WidgetWrapper>
  )
}
