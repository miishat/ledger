import React from 'react'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useBudgetStore } from '../../store/useBudgetStore'
import { formatMoney } from '../planner/format'
import { totalMonthlyBudget } from '../../store/budgetSelectors'
import { inRange, isSingleMonth, monthKeyOf, monthsInRange, type MonthRange } from '../../utils/budget/period'
import { annualTarget, elapsedMonthsInYear, isAnnual, setAsideExpected } from '../../utils/budget/cadence'

type Pace = 'over' | 'under' | 'on'

/** Shared pace rule: >110% of expected is over, <90% is under. */
function paceOf(spent: number, expected: number): Pace {
  if (spent > expected * 1.1) return 'over'
  if (spent < expected * 0.9) return 'under'
  return 'on'
}

const paceLabel = (p: Pace) => (p === 'over' ? 'over pace' : p === 'under' ? 'under pace' : 'on pace')

// Pace: expected-by-today = target x (day / days-in-month); >110% = over.
// Pace prorating only applies when the range is exactly the current single month.
// Annual categories are tracked separately against calendar-year spend.
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

  const withTarget = Object.values(categories).filter((c) => c.targetAmount > 0)

  const rows = withTarget
    .filter((c) => !isAnnual(c))
    .map((c) => {
      const spent = spentByCategory.get(c.id) ?? 0
      const target = c.targetAmount * months
      const expected = target * monthFraction
      return { c, spent, target, pace: paceOf(spent, expected) }
    })

  // Annual rows: calendar-year spend for the year containing range.to,
  // counted through the viewed month.
  const year = y
  const elapsed = elapsedMonthsInYear(year, new Date())
  const yearRange: MonthRange = { from: `${year}-01`, to: range.to }
  const annualRows = withTarget
    .filter(isAnnual)
    .map((c) => {
      const annual = annualTarget(c)
      const spent = Object.values(transactions)
        .filter((t) => t.type === 'expense' && t.categoryId === c.id && inRange(t.date, yearRange))
        .reduce((s, t) => s + t.amount, 0)
      const expected = setAsideExpected(annual, elapsed)
      return { c, spent, annual, expected, pace: paceOf(spent, expected) }
    })

  const budgeted = totalMonthlyBudget(categories, categoryGroups) * months
  const totalSpent = txInRange.reduce((s, t) => s + t.amount, 0)
  const unbudgeted = txInRange
    .filter((t) => !t.categoryId || (categories[t.categoryId]?.targetAmount ?? 0) === 0)
    .reduce((s, t) => s + t.amount, 0)

  const hasAnything = rows.length > 0 || annualRows.length > 0

  return (
    <WidgetWrapper title="Budget vs. Actual">
      {!hasAnything ? (
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
                  {isCurrentSingleMonth ? ` · ${paceLabel(pace)}` : ''}
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

          {annualRows.length > 0 && (
            <div className="flex flex-col gap-3 pt-3 border-t border-border">
              <p className="text-[12px] uppercase tracking-wide text-text-secondary">Annual budgets</p>
              {annualRows.map(({ c, spent, annual, expected, pace }) => (
                <div key={c.id} className="flex flex-col gap-1 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-text-primary">{c.name}</span>
                    <span className={pace === 'over' ? 'text-error' : 'text-text-secondary'}>
                      {formatMoney(spent)} / {formatMoney(annual)} · {paceLabel(pace)}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-bg-primary/50 overflow-hidden">
                    <div
                      className={`h-full ${pace === 'over' ? 'bg-error' : 'bg-accent'}`}
                      style={{ width: `${Math.min(100, (spent / annual) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-text-secondary">
                    Set aside {formatMoney(expected)} by now · {formatMoney(spent)} spent · {formatMoney(Math.max(0, annual - spent))} left this year
                  </p>
                </div>
              ))}
            </div>
          )}

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
