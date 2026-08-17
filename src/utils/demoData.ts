import type { Category, CategoryGroup, Transaction } from '../types/budget'
import { STORAGE_KEYS } from '../store/storageKeys'

export const DEMO_FLAG_KEY = STORAGE_KEYS.demo

export function isDemoActive(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(DEMO_FLAG_KEY) !== null
}

const DEMO_GROUP_EXPENSE = 'demo-group-expense'
const DEMO_GROUP_INCOME = 'demo-group-income'

/** Category groups backing the demo categories. Not part of buildDemoData's
 *  return shape (categories/transactions only), but a category's groupId
 *  must resolve to something real or it renders under no group. Callers that
 *  apply demo data to the budget store should merge these in alongside
 *  buildDemoData's categories. */
export function buildDemoCategoryGroups(): Record<string, CategoryGroup> {
  return {
    [DEMO_GROUP_EXPENSE]: { id: DEMO_GROUP_EXPENSE, name: 'Everyday', kind: 'expense' },
    [DEMO_GROUP_INCOME]: { id: DEMO_GROUP_INCOME, name: 'Income', kind: 'income' },
  }
}

export function buildDemoData(): {
  transactions: Record<string, Transaction>
  categories: Record<string, Category>
} {
  const categories: Record<string, Category> = {
    'demo-cat-1': { id: 'demo-cat-1', groupId: DEMO_GROUP_EXPENSE, name: 'Groceries', targetAmount: 400 },
    'demo-cat-2': { id: 'demo-cat-2', groupId: DEMO_GROUP_EXPENSE, name: 'Transport', targetAmount: 200 },
    'demo-cat-3': { id: 'demo-cat-3', groupId: DEMO_GROUP_INCOME, name: 'Salary', targetAmount: 0 },
  }

  const seed: Array<[string, number, string, 'income' | 'expense', string]> = [
    ['Grocery run', 82.4, 'demo-cat-1', 'expense', '-01-06'],
    ['Transit pass', 156, 'demo-cat-2', 'expense', '-01-08'],
    ['Paycheque', 3200, 'demo-cat-3', 'income', '-01-15'],
    ['Grocery run', 61.15, 'demo-cat-1', 'expense', '-01-18'],
    ['Rideshare', 24.8, 'demo-cat-2', 'expense', '-01-20'],
    ['Grocery run', 94.02, 'demo-cat-1', 'expense', '-01-27'],
    ['Paycheque', 3200, 'demo-cat-3', 'income', '-01-30'],
    ['Grocery run', 77.6, 'demo-cat-1', 'expense', '-02-04'],
    ['Transit pass', 156, 'demo-cat-2', 'expense', '-02-08'],
    ['Paycheque', 3200, 'demo-cat-3', 'income', '-02-15'],
    ['Grocery run', 88.31, 'demo-cat-1', 'expense', '-02-19'],
    ['Rideshare', 18.45, 'demo-cat-2', 'expense', '-02-24'],
  ]

  const year = new Date().getFullYear()
  const transactions: Record<string, Transaction> = {}
  seed.forEach(([description, amount, categoryId, type, suffix], i) => {
    const id = `demo-tx-${i + 1}`
    transactions[id] = {
      id,
      date: `${year}${suffix}`,
      amount,
      description,
      type,
      categoryId,
    }
  })

  return { transactions, categories }
}
