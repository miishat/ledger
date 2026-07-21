import type { Transaction } from '../types/budget'
import {
  averageMonthlyExpenses,
  averageMonthlyNetSavings,
  monthlyExpenseTotal,
  monthlyIncomeTotal,
} from './budgetSelectors'
import { totalMonthlyBudget } from './budgetSelectors'
import type { Category, CategoryGroup } from '../types/budget'

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
    tx('2026-07-01', 999, 'expense'), // current month - excluded from averages
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

describe('totalMonthlyBudget', () => {
  const groups: Record<string, CategoryGroup> = {
    g1: { id: 'g1', name: 'Housing', kind: 'expense' },
    g2: { id: 'g2', name: 'Income', kind: 'income' },
  }
  const categories: Record<string, Category> = {
    c1: { id: 'c1', groupId: 'g1', name: 'Rent', targetAmount: 1021 },
    c2: { id: 'c2', groupId: 'g1', name: 'Utilities', targetAmount: 200 },
    c3: { id: 'c3', groupId: 'g2', name: 'Salary', targetAmount: 5000 },
    c4: { id: 'c4', groupId: 'g1', name: 'Untargeted', targetAmount: 0 },
  }

  it('sums expense category targets and ignores income categories', () => {
    expect(totalMonthlyBudget(categories, groups)).toBe(1221)
  })

  it('returns 0 with no categories', () => {
    expect(totalMonthlyBudget({}, {})).toBe(0)
  })
})

describe('totalMonthlyBudget with mixed cadence', () => {
  it('counts an annual category at one twelfth per month', () => {
    const categoryGroups = {
      g1: { id: 'g1', name: 'Travel', kind: 'expense' as const },
    }
    const categories = {
      c1: { id: 'c1', groupId: 'g1', name: 'Rent', targetAmount: 1000 },
      c2: { id: 'c2', groupId: 'g1', name: 'Vacation', targetAmount: 2400, cadence: 'annual' as const },
    }
    expect(totalMonthlyBudget(categories, categoryGroups)).toBe(1200)
  })
})
