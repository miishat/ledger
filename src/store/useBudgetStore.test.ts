import { describe, it, expect } from 'vitest'
import { migrateBudgetState } from './useBudgetStore'

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
