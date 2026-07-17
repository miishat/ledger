import { describe, it, expect } from 'vitest'
import { migrateBudgetState, migrateBudgetStateV3 } from './useBudgetStore'

describe('budget store migration v1 -> v2', () => {
  it('assigns kind=income to income-named groups, expense otherwise', () => {
    const v1 = {
      categoryGroups: {
        'g-2': { id: 'g-2', name: 'Income' },
        'g-h': { id: 'g-h', name: 'Housing' },
        'g-e': { id: 'g-e', name: 'Side Earnings' },
      },
    }
    const out = migrateBudgetState(v1, 1) as {
      categoryGroups: Record<string, { kind: string }>
    }
    expect(out.categoryGroups['g-2'].kind).toBe('income')
    expect(out.categoryGroups['g-e'].kind).toBe('income')
    expect(out.categoryGroups['g-h'].kind).toBe('expense')
  })
})

describe('budget store migration v2 -> v3', () => {
  it('remaps out-of-type paradigms to Ledger Custom', () => {
    expect((migrateBudgetStateV3({ paradigm: 'Envelope' }) as { paradigm: string }).paradigm).toBe('Ledger Custom')
    expect((migrateBudgetStateV3({ paradigm: 'Zero-Based' }) as { paradigm: string }).paradigm).toBe('Zero-Based')
    expect((migrateBudgetStateV3({ paradigm: '50/30/20' }) as { paradigm: string }).paradigm).toBe('50/30/20')
    expect((migrateBudgetStateV3({}) as { paradigm: string }).paradigm).toBe('Ledger Custom')
  })

  it('classifies known seeded expense groups and leaves others alone', () => {
    const v2 = {
      paradigm: 'Ledger Custom',
      categoryGroups: {
        h: { id: 'h', name: 'Housing', kind: 'expense' },
        e: { id: 'e', name: 'Entertainment', kind: 'expense' },
        x: { id: 'x', name: 'Mystery', kind: 'expense' },
        i: { id: 'i', name: 'Income', kind: 'income' },
        pre: { id: 'pre', name: 'Food', kind: 'expense', budgetClass: 'want' },
      },
    }
    const out = migrateBudgetStateV3(v2) as { categoryGroups: Record<string, { budgetClass?: string }> }
    expect(out.categoryGroups.h.budgetClass).toBe('need')
    expect(out.categoryGroups.e.budgetClass).toBe('want')
    expect(out.categoryGroups.x.budgetClass).toBeUndefined()
    expect(out.categoryGroups.i.budgetClass).toBeUndefined()
    expect(out.categoryGroups.pre.budgetClass).toBe('want') // never overwrites an explicit class
  })
})
