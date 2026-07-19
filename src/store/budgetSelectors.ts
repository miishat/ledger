// Pure selectors over budget transactions. Kept store-free so calculators
// (4b Emergency Fund, 4e forecaster auto-feed) can call them with
// useBudgetStore.getState().transactions or any snapshot.

import type { Category, CategoryGroup, Transaction } from '../types/budget'

export function monthlyExpenseTotal(
  transactions: Record<string, Transaction>,
  month: string,
): number {
  return Object.values(transactions)
    .filter((t) => t.type === 'expense' && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0)
}

export function monthlyIncomeTotal(
  transactions: Record<string, Transaction>,
  month: string,
): number {
  return Object.values(transactions)
    .filter((t) => t.type === 'income' && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0)
}

/** 'YYYY-MM' keys for the N completed months before refDate (most recent first). */
function completedMonthKeys(monthsBack: number, refDate: Date): string[] {
  const keys: string[] = []
  for (let i = 1; i <= monthsBack; i++) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function averageMonthlyExpenses(
  transactions: Record<string, Transaction>,
  monthsBack: number,
  refDate: Date = new Date(),
): number {
  if (monthsBack <= 0) return 0
  const months = completedMonthKeys(monthsBack, refDate)
  const total = months.reduce((sum, m) => sum + monthlyExpenseTotal(transactions, m), 0)
  return total / monthsBack
}

export function averageMonthlyNetSavings(
  transactions: Record<string, Transaction>,
  monthsBack: number,
  refDate: Date = new Date(),
): number {
  if (monthsBack <= 0) return 0
  const months = completedMonthKeys(monthsBack, refDate)
  const total = months.reduce(
    (sum, m) => sum + monthlyIncomeTotal(transactions, m) - monthlyExpenseTotal(transactions, m),
    0,
  )
  return total / monthsBack
}

/** Sum of expense-category monthly targets. Income categories excluded. */
export function totalMonthlyBudget(
  categories: Record<string, Category>,
  categoryGroups: Record<string, CategoryGroup>,
): number {
  return Object.values(categories)
    .filter((c) => categoryGroups[c.groupId]?.kind === 'expense')
    .reduce((sum, c) => sum + c.targetAmount, 0)
}
