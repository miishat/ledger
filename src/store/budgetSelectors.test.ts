import type { Transaction } from '../types/budget'
import {
  averageMonthlyExpenses,
  averageMonthlyNetSavings,
  monthlyExpenseTotal,
  monthlyIncomeTotal,
} from './budgetSelectors'

function tx(date: string, amount: number, type: 'expense' | 'income'): Transaction {
  return { id: `${date}-${amount}-${type}`, date, amount, description: 't', type }
}

const transactions: Record<string, Transaction> = Object.fromEntries(
  [
    tx('2026-05-03', 1000, 'expense'),
    tx('2026-05-10', 500, 'expense'),
    tx('2026-05-15', 4000, 'income'),
    tx('2026-06-01', 2000, 'expense'),
    tx('2026-06-20', 4000, 'income'),
    tx('2026-07-01', 999, 'expense'), // current month — excluded from averages
  ].map((t) => [t.id, t]),
)

describe('monthly totals', () => {
  it('sums expenses and income for one month', () => {
    expect(monthlyExpenseTotal(transactions, '2026-05')).toBe(1500)
    expect(monthlyIncomeTotal(transactions, '2026-05')).toBe(4000)
    expect(monthlyExpenseTotal(transactions, '2026-04')).toBe(0)
  })
})

describe('averages over completed months', () => {
  const ref = new Date('2026-07-02T12:00:00')

  it('averages expenses over the previous N completed months', () => {
    // May 1500 + June 2000 over 2 months = 1750; July excluded
    expect(averageMonthlyExpenses(transactions, 2, ref)).toBe(1750)
  })

  it('counts empty months as zero', () => {
    // Apr 0 + May 1500 + Jun 2000 over 3 = 1166.67
    expect(averageMonthlyExpenses(transactions, 3, ref)).toBeCloseTo(1166.67, 1)
  })

  it('averages net savings (income − expenses)', () => {
    // May 2500 + June 2000 over 2 = 2250
    expect(averageMonthlyNetSavings(transactions, 2, ref)).toBe(2250)
  })
})
